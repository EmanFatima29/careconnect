/**
 * Application-wide constants
 * Replaces magic numbers scattered throughout the codebase.
 */

// ============ TIMING ============
export const LOCATION_WATCH_INTERVAL = 15000;
export const NEARBY_FETCH_INTERVAL = 30000;
export const TYPING_TIMEOUT = 2000;
export const AUTO_SCROLL_DELAY = 100;

// ============ LOCATION ============
export const MIN_RADIUS = 500;
export const MAX_RADIUS = 10000;
export const INITIAL_RADIUS = 1000;
export const GPS_VERIFY_DISTANCE = 500;
export const LOCATION_BROADCAST_RADIUS = 10000;

// ============ CHAT ============
export const MESSAGE_PAGE_SIZE = 50;
export const MAX_MESSAGE_PAGE_SIZE = 100;
export const MAX_CACHED_MESSAGES = 100;
export const CHAT_LIST_CACHE_TTL = 24 * 60 * 60 * 1000;

// ============ MEDIA ============
export const MAX_MEDIA_SIZE = 20 * 1024 * 1024;
export const ALLOWED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "application/pdf",
];

// ============ HEALTH STATUS ============
export const HEALTH_STATUS_COLORS = {
  healthy: "success",
  stressed: "warning",
  declining: "warning",
  critical: "error",
  null: "default",
};

export const SENTIMENT_CONFIG = {
  positive: { emoji: "\ud83d\ude0a", color: "#4caf50", label: "Positive" },
  negative: { emoji: "\ud83d\ude14", color: "#f44336", label: "Negative" },
  neutral: { emoji: "\ud83d\ude10", color: "#9e9e9e", label: "Neutral" },
};
