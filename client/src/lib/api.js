import axios from "axios";
import { getSession, signOut } from "next-auth/react";
import logger from "@/lib/logger";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Send cookies (including CSRF cookie) with requests
});

/**
 * Read the CSRF token from the cookie set by the server.
 */
function getCsrfToken() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)_csrf=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Cached session to avoid calling getSession() on every single request.
 * Refreshes every 60 seconds or when invalidated.
 */
let _cachedSession = null;
let _sessionFetchedAt = 0;
const SESSION_CACHE_TTL = 60 * 1000; // 60 seconds

async function getCachedSession() {
  const now = Date.now();
  if (_cachedSession && now - _sessionFetchedAt < SESSION_CACHE_TTL) {
    return _cachedSession;
  }
  _cachedSession = await getSession();
  _sessionFetchedAt = now;
  return _cachedSession;
}

/** Call this to force session refresh (e.g. after login/logout) */
export function invalidateSessionCache() {
  _cachedSession = null;
  _sessionFetchedAt = 0;
}

// Add request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      const session = await getCachedSession();
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }

      // Attach CSRF token for state-changing requests
      const csrfToken = getCsrfToken();
      if (
        csrfToken &&
        ["post", "put", "patch", "delete"].includes(config.method)
      ) {
        config.headers["X-CSRF-Token"] = csrfToken;
      }

      return config;
    } catch (error) {
      logger.error("Error in request interceptor:", error);
      return config;
    }
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle CSRF retry on first request + sign out on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // CSRF token may not be available on the very first POST (cookie not yet set).
    // Retry once after a GET to receive the CSRF cookie.
    if (
      error.response?.status === 403 &&
      error.response?.data?.error === "CSRF token validation failed" &&
      !config._csrfRetried
    ) {
      config._csrfRetried = true;
      // Make a GET to receive the CSRF cookie
      await api.get("/health");
      // Re-read the fresh CSRF token
      const freshToken = getCsrfToken();
      if (freshToken) {
        config.headers["X-CSRF-Token"] = freshToken;
      }
      return api(config);
    }

    if (error.response?.status === 401) {
      logger.error("Unauthorized — session expired. Signing out.");
      invalidateSessionCache();
      if (typeof window !== "undefined") {
        await signOut({ redirect: false });
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;

export const updateUser = async (email, updates) => {
  // Input validation
  if (!email) {
    throw new Error("Email is required");
  }

  if (!updates || Object.keys(updates).length === 0) {
    throw new Error("Updates object cannot be empty");
  }

  try {
    const response = await api.patch(
      `/api/users/${encodeURIComponent(email)}`,
      updates,
    );
    return response.data;
  } catch (error) {
    // Enhanced error logging
    if (error.response) {
      // Server responded with error status
      logger.error("API Error Response:", {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      // Request was made but no response
      logger.error("No response received from server:", error.request);
    } else {
      // Something else happened
      logger.error("Error setting up request:", error.message);
    }

    // Re-throw with user-friendly message
    throw new Error(
      error.response?.data?.message ||
        "Failed to update user. Please try again.",
    );
  }
};

// Optional: Add utility functions for better API management
export const userAPI = {
  update: (email, updates) => updateUser(email, updates),

  // Add other user-related API calls here
  // getUser: (email) => {...},
  // deleteUser: (email) => {...},
};
