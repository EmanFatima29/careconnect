/**
 * Simple in-memory rate limiter for Next.js API routes.
 * Uses a sliding window approach with automatic cleanup.
 */

const requestCounts = new Map();

// Cleanup expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, record] of requestCounts.entries()) {
      if (now > record.resetTime) requestCounts.delete(key);
    }
  },
  5 * 60 * 1000,
);

/**
 * Rate limiter for Next.js API Routes
 * @param {Request} request - The incoming request
 * @param {number} limit - Max requests allowed in the window (default: 10)
 * @param {number} windowMs - Time window in milliseconds (default: 15 minutes)
 * @returns {{ limited: boolean, retryAfter?: number }} Whether the request should be rate-limited
 */
export function checkRateLimit(request, limit = 10, windowMs = 15 * 60 * 1000) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const key = `auth:${ip}`;
  const now = Date.now();

  if (!requestCounts.has(key)) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return { limited: false };
  }

  const record = requestCounts.get(key);

  if (now > record.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return { limited: false };
  }

  if (record.count >= limit) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { limited: true, retryAfter };
  }

  record.count++;
  return { limited: false };
}
