/**
 * Local-First Chat Cache
 *
 * WhatsApp-style local caching using localStorage for instant warm startup.
 * - Chat list: cached per user, restored on mount before API call
 * - Messages: cached per chat, restored when opening a chat
 * - Incremental sync: only fetch messages newer than the latest cached one
 *
 * Storage keys:
 *   gc:chats:{userId}         → serialized chat list
 *   gc:chats:ts:{userId}      → last sync timestamp for chat list
 *   gc:msgs:{chatId}          → serialized messages array (last N)
 *   gc:msgs:ts:{chatId}       → ISO timestamp of newest cached message
 *
 * Limits:
 *   - Max 100 messages cached per chat (older ones pruned)
 *   - Chat list TTL: 24 hours (stale data still shown, but marked for refresh)
 */

const MAX_CACHED_MESSAGES = 100;
const CHAT_LIST_TTL = 24 * 60 * 60 * 1000; // 24h
const PREFIX = "gc:";

// ============ HELPERS ============

function safeGet(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full — silently fail; cache is best-effort
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}

// ============ CHAT LIST ============

/**
 * Get cached chat list for a user (warm startup).
 * Returns { chats: [], isStale: boolean }
 */
export function getCachedChats(userId) {
  if (!userId) return { chats: [], isStale: true };
  const chats = safeGet(`chats:${userId}`);
  const ts = safeGet(`chats:ts:${userId}`);
  const isStale = !ts || Date.now() - ts > CHAT_LIST_TTL;
  return { chats: chats || [], isStale };
}

/**
 * Persist chat list to local cache.
 */
export function setCachedChats(userId, chats) {
  if (!userId) return;
  safeSet(`chats:${userId}`, chats);
  safeSet(`chats:ts:${userId}`, Date.now());
}

/**
 * Remove cached chat list (e.g., on logout).
 */
export function clearCachedChats(userId) {
  if (!userId) return;
  safeRemove(`chats:${userId}`);
  safeRemove(`chats:ts:${userId}`);
}

// ============ MESSAGES ============

/**
 * Get cached messages for a specific chat.
 * Returns { messages: [], lastTimestamp: string|null }
 */
export function getCachedMessages(chatId) {
  if (!chatId) return { messages: [], lastTimestamp: null };
  const messages = safeGet(`msgs:${chatId}`);
  const lastTimestamp = safeGet(`msgs:ts:${chatId}`);
  return { messages: messages || [], lastTimestamp };
}

/**
 * Persist messages to local cache (keeps last N messages).
 */
export function setCachedMessages(chatId, messages) {
  if (!chatId || !Array.isArray(messages)) return;
  // Keep only the most recent messages to avoid localStorage bloat
  const trimmed = messages.slice(-MAX_CACHED_MESSAGES);
  safeSet(`msgs:${chatId}`, trimmed);

  // Track the newest message timestamp for incremental sync
  const newest = trimmed[trimmed.length - 1];
  if (newest?.createdAt) {
    safeSet(`msgs:ts:${chatId}`, newest.createdAt);
  }
}

/**
 * Append a single message to the cache (real-time socket update).
 */
export function appendCachedMessage(chatId, message) {
  if (!chatId || !message?._id) return;
  const { messages } = getCachedMessages(chatId);

  // Deduplicate
  if (messages.some((m) => m._id === message._id)) return;

  messages.push(message);
  setCachedMessages(chatId, messages);
}

/**
 * Update a cached message (edit, status change).
 */
export function updateCachedMessage(chatId, messageId, updates) {
  if (!chatId || !messageId) return;
  const { messages } = getCachedMessages(chatId);
  const idx = messages.findIndex((m) => m._id === messageId);
  if (idx !== -1) {
    messages[idx] = { ...messages[idx], ...updates };
    setCachedMessages(chatId, messages);
  }
}

/**
 * Remove a cached message.
 */
export function removeCachedMessage(chatId, messageId) {
  if (!chatId || !messageId) return;
  const { messages } = getCachedMessages(chatId);
  const filtered = messages.filter((m) => m._id !== messageId);
  setCachedMessages(chatId, filtered);
}

/**
 * Clear cached messages for a chat.
 */
export function clearCachedMessages(chatId) {
  if (!chatId) return;
  safeRemove(`msgs:${chatId}`);
  safeRemove(`msgs:ts:${chatId}`);
}

// ============ CHAT LIST UPDATES (real-time) ============

/**
 * Update a single chat in the cached list (e.g., new lastMessage, unread bump).
 */
export function updateCachedChat(userId, chatId, updates) {
  if (!userId || !chatId) return;
  const { chats } = getCachedChats(userId);
  const idx = chats.findIndex((c) => c._id === chatId);
  if (idx !== -1) {
    chats[idx] = { ...chats[idx], ...updates, updatedAt: new Date().toISOString() };
    // Move to top (most recent)
    const [updated] = chats.splice(idx, 1);
    chats.unshift(updated);
    setCachedChats(userId, chats);
  }
}

// ============ FULL CLEAR (logout) ============

export function clearAllCache() {
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}
