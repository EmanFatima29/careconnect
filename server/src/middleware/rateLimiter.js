/**
 * Rate Limiting Middleware — Redis-backed
 * Persistent rate limiting that survives server restarts
 * Location: /server/src/middleware/rateLimiter.js
 */
import redis from "../../lib/redis.js";
import logger from "../../lib/logger.js";

/**
 * Redis-backed rate limiter using INCR + EXPIRE (fixed window).
 * Falls open (allows request) if Redis is unavailable.
 *
 * @param {number} limit   Max requests allowed in the window
 * @param {number} windowMs  Window size in milliseconds
 */
export const rateLimiter = (limit = 100, windowMs = 15 * 60 * 1000) => {
  const windowSec = Math.ceil(windowMs / 1000);

  return async (req, res, next) => {
    const key = `rl:${req.user?.userId || req.user?._id || req.ip}`;
    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, windowSec);
      }

      // Attach rate-limit headers
      res.set("X-RateLimit-Limit", String(limit));
      res.set("X-RateLimit-Remaining", String(Math.max(0, limit - count)));

      if (count > limit) {
        const ttl = await redis.ttl(key);
        res.set("Retry-After", String(ttl));
        return res.status(429).json({
          success: false,
          error: "Too many requests",
          message: `Rate limit exceeded. Max ${limit} requests per ${Math.round(windowMs / 60000)} minutes`,
          retryAfter: ttl,
        });
      }

      return next();
    } catch (err) {
      // Fail open — if Redis is down, allow the request through
      logger.error("[RateLimiter] Redis error, failing open:", err.message);
      return next();
    }
  };
};

/**
 * Strict rate limiter for authentication endpoints
 * 10 requests per 15 minutes per IP
 */
export const authRateLimiter = rateLimiter(10, 15 * 60 * 1000);

/**
 * Analytics rate limiter
 * 50 requests per 15 minutes per user
 */
export const analyticsRateLimiter = rateLimiter(50, 15 * 60 * 1000);

/**
 * Export data rate limiter
 * 5 requests per hour per user
 */
export const exportRateLimiter = rateLimiter(5, 60 * 60 * 1000);

/**
 * Stricter rate limiter for forgot-password
 * 3 requests per hour per IP
 */
export const forgotPasswordRateLimiter = rateLimiter(3, 60 * 60 * 1000);
