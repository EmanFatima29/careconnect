import jwt from "jsonwebtoken";
import { isTokenBlacklisted } from "../services/tokenBlacklist.js";

export const normalizeRoles = (roles) => {
  if (!roles) return [];
  if (Array.isArray(roles)) return roles.map(String);
  return [String(roles)];
};

export const isAdminRoles = (roles) => {
  const r = normalizeRoles(roles);
  return r.includes("admin") || r.includes("superadmin");
};

/**
 * Unified authentication middleware.
 * 1. Tries Bearer JWT from Authorization header.
 * 2. Falls back to NextAuth session cookie.
 * Exported as both `authenticate` and `requireAuth` for backward compatibility.
 */
const verifyToken = async (req, res, next) => {
  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "Server auth misconfigured" });
    }

    // 1. Try Authorization: Bearer <token>
    const authHeader = req.headers.authorization || "";
    const [scheme, headerToken] = authHeader.split(" ");

    if (scheme === "Bearer" && headerToken) {
      // Check token blacklist (revoked on logout)
      if (isTokenBlacklisted(headerToken)) {
        return res.status(401).json({ error: "Token has been revoked" });
      }

      try {
        const decoded = jwt.verify(headerToken, secret);
        req.user = {
          email: decoded.email,
          userId: decoded.userId || decoded.sub || null,
          roles: decoded.roles || decoded.role || null,
        };
        return next();
      } catch (err) {
        if (err.name === "TokenExpiredError") {
          return res
            .status(401)
            .json({ error: "Token expired. Please log in again." });
        }
        return res.status(401).json({ error: "Invalid token" });
      }
    }

    // 2. Fallback: NextAuth session cookie
    const cookieToken =
      req.cookies?.["next-auth.session-token"] ||
      req.cookies?.["__Secure-next-auth.session-token"];

    if (cookieToken) {
      try {
        const { getToken } = await import("next-auth/jwt");
        const decoded = await getToken({ req, secret });
        if (decoded) {
          req.user = {
            email: decoded.email,
            userId: decoded.userId || decoded.sub || null,
            roles: decoded.roles || decoded.role || null,
          };
          return next();
        }
      } catch (e) {
        // cookie decode failed — fall through to 401
      }
    }

    return res.status(401).json({ error: "Unauthorized" });
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

// Named exports — both names kept for zero-diff backward compatibility
export const authenticate = verifyToken;
export const requireAuth = verifyToken;

/** Require an authenticated admin/superadmin (must be used after authenticate). */
export const requireAdmin = (req, res, next) => {
  const roles = req.user?.roles;
  if (!isAdminRoles(roles)) {
    return res.status(403).json({ error: "Admin access required" });
  }
  return next();
};

// export const _internal = {
//   normalizeRoles,
//   isAdminRoles,
// };
