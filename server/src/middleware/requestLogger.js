// server/src/middleware/requestLogger.js
// Unified logging: writes to both JSONL file (raw HTTP audit) and MongoDB ActivityLog (queryable)
import fs from "fs";
import path from "path";
import ActivityLog from "../models/activityLogModel.js";

// Wards to redact from body/query/headers before logging
const SENSITIVE_BODY_KEYS = new Set([
  "password",
  "confirmPassword",
  "newPassword",
  "currentPassword",
  "token",
  "accessToken",
  "refreshToken",
  "secret",
]);
const SENSITIVE_HEADER_KEYS = new Set([
  "authorization",
  "cookie",
  "x-auth-token",
  "x-api-key",
]);

// Max log file size before rotation (5 MB)
const MAX_LOG_SIZE = 5 * 1024 * 1024;

function redactObject(obj, sensitiveSet) {
  if (!obj || typeof obj !== "object") return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) =>
      sensitiveSet.has(k.toLowerCase()) ? [k, "[REDACTED]"] : [k, v],
    ),
  );
}

// Helper to get client IP
function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    "unknown"
  );
}

// Helper to get user info if available
function getUserMeta(req) {
  if (req.user) {
    return {
      userId: req.user.userId || req.user._id || req.user.id || null,
      email: req.user.email || null,
      roles: req.user.roles || null,
    };
  }
  return null;
}

function rotateLogs(logFile) {
  try {
    const stat = fs.statSync(logFile);
    if (stat.size >= MAX_LOG_SIZE) {
      const rotated = `${logFile}.${Date.now()}.bak`;
      fs.renameSync(logFile, rotated);
    }
  } catch {
    // File doesn't exist yet — no rotation needed
  }
}

export function requestLogger(req, res, next) {
  const logFile = path.join(process.cwd(), "src", "logs", "request_logs.jsonl");

  const start = Date.now();
  const meta = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: getClientIp(req),
    headers: redactObject(req.headers, SENSITIVE_HEADER_KEYS),
    body: redactObject(req.body, SENSITIVE_BODY_KEYS),
    query: redactObject(req.query, SENSITIVE_BODY_KEYS),
    user: getUserMeta(req),
  };

  res.on("finish", () => {
    meta.status = res.statusCode;
    meta.durationMs = Date.now() - start;

    // 1. Write to JSONL file (raw HTTP audit trail)
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
    rotateLogs(logFile);
    const line = JSON.stringify(meta) + "\n";
    fs.appendFile(logFile, line, () => {});

    // 2. Write to MongoDB ActivityLog (queryable, unified with activityLogService)
    // Only log state-changing requests and errors to avoid flooding the DB
    const isStateChanging = !["GET", "HEAD", "OPTIONS"].includes(meta.method);
    const isError = meta.status >= 400;
    if (isStateChanging || isError) {
      ActivityLog.create({
        actorId: meta.user?.userId || null,
        actorEmail: meta.user?.email || null,
        action: `http.${meta.method.toLowerCase()}`,
        entityType: "Request",
        status: meta.status < 400 ? "success" : "failed",
        ip: meta.ip,
        userAgent: meta.headers?.["user-agent"] || null,
        metadata: {
          url: meta.url,
          statusCode: meta.status,
          durationMs: meta.durationMs,
        },
      }).catch(() => {}); // Best-effort — never block
    }
  });

  next();
}
