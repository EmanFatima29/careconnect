import "dotenv/config";

// ---- Environment variable validation (fail fast) ----
const REQUIRED_ENV = ["MONGODB_URI", "NEXTAUTH_SECRET"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(
    `[Startup] Missing required environment variables: ${missing.join(", ")}`,
  );
  process.exit(1);
}

import express from "express";
import mongoose from "mongoose";
import { createServer } from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import { Server } from "socket.io";
//importing Routes
import userRoutes from "./src/routes/userRoutes.js";
import chatRoutes from "./src/routes/chatRoutes.js";
import messageRoutes from "./src/routes/messageRoutes.js";
import groupRoutes from "./src/routes/groupRoutes.js";
import locationRoutes from "./src/routes/locationRoutes.js";
import prescriptionRoutes from "./src/routes/prescriptionRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import analyticsRoutes from "./src/routes/analyticsRoutes.js";
import friendRoutes from "./src/routes/friendRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";
import monitoringRoutes from "./src/routes/monitoringRoutes.js";
import mediaRoutes from "./src/routes/mediaRoutes.js";
import visitRoutes from "./src/routes/visitRoutes.js";
import speechRoutes from "./src/routes/speechRoutes.js";
import adminMonitoringRoutes from "./src/routes/adminMonitoringRoutes.js";
import eventRoutes from "./src/routes/eventRoutes.js";
import ratingRoutes from "./src/routes/ratingRoutes.js";
import doctorRoutes from "./src/routes/doctorRoutes.js";
import pharmacyRoutes from "./src/routes/pharmacyRoutes.js";
import appointmentRoutes from "./src/routes/appointmentRoutes.js";
import { handleSocket } from "./lib/socketHandler.js";
import { setupAnalyticsHandlers } from "./lib/socketAnalyticsHandler.js";

import { errorHandler } from "./src/middleware/errorHandler.js";
import { analyticsRateLimiter } from "./src/middleware/rateLimiter.js";
import { requestLogger } from "./src/middleware/requestLogger.js";
import { csrfProtection } from "./src/middleware/csrf.js";
import logger from "./lib/logger.js";

// Redis is optional. Set DISABLE_REDIS=true in the environment to skip connecting.
let redis = null;
if (process.env.DISABLE_REDIS !== "true") {
  try {
    // dynamic import so missing/disabled redis doesn't crash startup
    // `server/lib/redis.js` exports a default ioredis client
    redis = (await import("./lib/redis.js")).default;
  } catch (err) {
    logger.error("[Redis] Failed to load redis client:", err.message);
    redis = null;
  }
} else {
  logger.log("[Redis] Disabled via DISABLE_REDIS=true");
}

const app = express();
const server = createServer(app);

// PORT
const PORT = process.env.PORT || 8080;

// CORS options
const allowedOrigin =
  process.env.NODE_ENV === "production"
    ? process.env.ORIGIN_URL
    : "http://localhost:3000";

const corsOptions = {
  origin: allowedOrigin,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  credentials: true,
};

// ---- Security & Compression ----
app.use(
  helmet({
    // Allow socket.io's long-polling iframes
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", allowedOrigin],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  }),
);
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(requestLogger);
app.use(csrfProtection);

// ---- Health / Readiness checks ----
app.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState; // 1 = connected
  const redisOk = process.env.DISABLE_REDIS === "true" ? true : (redis && redis.status === "ready");
  const healthy = dbState === 1 && redisOk;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    db: dbState === 1 ? "connected" : "disconnected",
    redis: redisOk ? "connected" : "disconnected",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/ready", (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ ready: false });
  }
  res.status(200).json({ ready: true });
});

// ---- API Routes ----
app.use("/api/location", locationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/monitoring", monitoringRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/speech", speechRoutes);
app.use("/api/analytics", analyticsRateLimiter, analyticsRoutes);
app.use("/api/admin/monitoring", adminMonitoringRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/doctor",   doctorRoutes);
app.use("/api/pharmacy",      pharmacyRoutes);
app.use("/api/appointments",  appointmentRoutes);

// Global Error Handler (must be last)
app.use(errorHandler);

// ---- Socket.IO Setup ----
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
global.io = io;
handleSocket(io);
setupAnalyticsHandlers(io);

// ---- MongoDB + Server start ----
const MONGODB_URI = process.env.MONGODB_URI;

try {
  await mongoose.connect(MONGODB_URI);
  logger.log("[DB] MongoDB connected");
  server.listen(PORT, () => logger.log(`[Server] Running on port ${PORT}`));
} catch (error) {
  logger.error("[DB] Connection failed:", error.message);
  process.exit(1);
}

// Render free tier sleeps after 15 min idle; ping ourselves every 14 min to stay warm.
if (process.env.NODE_ENV === "production" && process.env.RENDER_EXTERNAL_URL) {
  setInterval(() => {
    fetch(`${process.env.RENDER_EXTERNAL_URL}/health`).catch(() => {});
  }, 14 * 60 * 1000);
  logger.log(
    `[KeepAlive] Self-ping every 14 min → ${process.env.RENDER_EXTERNAL_URL}/health`,
  );
}

// ---- Graceful shutdown ----
async function shutdown(signal) {
  logger.log(`[Shutdown] Received ${signal} — closing gracefully…`);
  server.close(async () => {
    try {
      if (redis && typeof redis.quit === "function") {
        await redis.quit();
        logger.log("[Shutdown] Redis disconnected.");
      }
      await mongoose.connection.close();
      logger.log("[Shutdown] MongoDB disconnected. Exiting.");
    } catch (err) {
      logger.error("[Shutdown] Error during cleanup:", err.message);
    }
    process.exit(0);
  });

  // Force-exit if the server takes more than 10 s to close
  setTimeout(() => {
    logger.error("[Shutdown] Forced exit after timeout.");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("uncaughtException", (err) => {
  logger.error("[UnhandledException]", err);
  shutdown("uncaughtException");
});
process.on("unhandledRejection", (reason) => {
  logger.error("[UnhandledRejection]", reason);
});
