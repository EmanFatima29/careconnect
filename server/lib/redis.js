/**
 * Redis Client Singleton
 * Used for rate limiting, caching, and session management
 * Location: /server/lib/redis.js
 */
import Redis from "ioredis";
import logger from "./logger.js";

let client = null;

if (process.env.DISABLE_REDIS === "true") {
  logger.log("[Redis] Stub created (DISABLE_REDIS=true)");
  const noopAsync = async () => null;
  client = {
    status: "disabled",
    on: () => {},
    get: noopAsync,
    setex: async () => {},
    set: async () => {},
    del: async () => {},
    incr: async () => 1,
    expire: async () => {},
    ttl: async () => -1,
    quit: async () => {},
  };
} else {
  const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

  client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 5) {
        logger.error("[Redis] Max retries reached — giving up");
        return null; // Stop retrying
      }
      return Math.min(times * 200, 2000);
    },
    lazyConnect: false,
  });

  client.on("connect", () => logger.log("[Redis] Connected"));
  client.on("error", (err) => logger.error("[Redis] Error:", err.message));
  client.on("close", () => logger.log("[Redis] Connection closed"));
}

export default client;
