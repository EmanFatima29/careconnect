/**
 * CSRF Protection Middleware
 *
 * Uses the double-submit cookie pattern:
 * 1. Server sets a random CSRF token in a cookie
 * 2. Client reads the cookie and sends the token in the X-CSRF-Token header
 * 3. Server verifies that cookie value matches header value
 *
 * Since cookies are automatically sent by the browser but custom headers
 * are not, an attacker cannot forge the header from a cross-origin site.
 *
 * Note: This is defense-in-depth on top of JWT Bearer auth + CORS.
 */
import crypto from "crypto";

const CSRF_COOKIE_NAME = "_csrf";
const CSRF_HEADER_NAME = "x-csrf-token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Middleware that sets a CSRF cookie on every response and validates
 * the token on state-changing requests (POST, PUT, PATCH, DELETE).
 */
export const csrfProtection = (req, res, next) => {
  // Always set/refresh the CSRF cookie if it doesn't exist
  if (!req.cookies[CSRF_COOKIE_NAME]) {
    const token = crypto.randomBytes(32).toString("hex");
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Client JS must read this cookie
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/",
    });
    // Also set on request so downstream can use it on first request
    req.cookies[CSRF_COOKIE_NAME] = token;
  }

  // Safe methods don't need CSRF validation
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // Skip CSRF for internal API key calls (server-to-server)
  if (req.isInternalCall) {
    return next();
  }

  // Skip CSRF for bearer-token requests — JWT in Authorization header is
  // CSRF-immune (browsers don't auto-attach custom headers like they do cookies).
  // Required for cross-origin SPAs (Vercel → Render) where the double-submit
  // cookie can't be read by client JS on the other domain.
  if (req.headers.authorization?.startsWith("Bearer ")) {
    return next();
  }

  // Skip CSRF for sendBeacon calls (they can't set headers)
  // These endpoints are already rate-limited and restricted
  if (req.path === "/api/users/status-offline") {
    return next();
  }

  const cookieToken = req.cookies[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: "CSRF token validation failed" });
  }

  return next();
};
