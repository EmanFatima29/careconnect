import logger from "../../lib/logger.js";

/**
 * In-memory token blacklist for revoked JWTs.
 * Tokens are stored with their expiry time and auto-cleaned periodically.
 *
 * For production at scale, replace with Redis SET with TTL.
 */
const blacklist = new Map(); // token → expiryTimestamp

// Clean expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [token, expiry] of blacklist) {
    if (expiry < now) {
      blacklist.delete(token);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    logger.log(`[TokenBlacklist] Cleaned ${cleaned} expired entries`);
  }
}, 10 * 60 * 1000);

/**
 * Add a token to the blacklist.
 * @param {string} token - JWT string
 * @param {number} expiresAt - Unix timestamp (seconds) when token expires
 */
export function blacklistToken(token, expiresAt) {
  if (!token) return;
  // Store expiry as ms
  const expiryMs = expiresAt ? expiresAt * 1000 : Date.now() + 3600 * 1000;
  blacklist.set(token, expiryMs);
  logger.log(`[TokenBlacklist] Token blacklisted (expires: ${new Date(expiryMs).toISOString()})`);
}

/**
 * Check if a token is blacklisted.
 * @param {string} token - JWT string
 * @returns {boolean}
 */
export function isTokenBlacklisted(token) {
  if (!token) return false;
  if (!blacklist.has(token)) return false;

  // If expired, remove and return false (it's naturally invalid anyway)
  const expiry = blacklist.get(token);
  if (expiry < Date.now()) {
    blacklist.delete(token);
    return false;
  }

  return true;
}
