import logger from "@/lib/logger";
/**
 * Socket Notification Handler
 * Centralized notification management for socket events
 * Location: /client/src/utils/socketNotificationHandler.js
 */

/**
 * Simple notification queue for socket events
 */
export class SocketNotificationManager {
  constructor() {
    this.callbacks = {
      success: [],
      error: [],
      warning: [],
      info: [],
    };
  }

  /**
   * Register callback for notification type
   */
  on(type, callback) {
    if (this.callbacks[type]) {
      this.callbacks[type].push(callback);
    }
  }

  /**
   * Unregister callback
   */
  off(type, callback) {
    if (this.callbacks[type]) {
      this.callbacks[type] = this.callbacks[type].filter(
        (cb) => cb !== callback,
      );
    }
  }

  /**
   * Notify all listeners
   */
  notify(type, message, options = {}) {
    if (!this.callbacks[type]) return;

    logger.log(`[Notification] ${type.toUpperCase()}: ${message}`, options);

    this.callbacks[type].forEach((callback) => {
      try {
        callback(message, options);
      } catch (error) {
        logger.error("[Notification] Error in callback:", error);
      }
    });
  }

  /**
   * Success notification
   */
  success(message, options = {}) {
    this.notify("success", message, { ...options, type: "success" });
  }

  /**
   * Error notification
   */
  error(message, options = {}) {
    this.notify("error", message, { ...options, type: "error" });
  }

  /**
   * Warning notification
   */
  warning(message, options = {}) {
    this.notify("warning", message, { ...options, type: "warning" });
  }

  /**
   * Info notification
   */
  info(message, options = {}) {
    this.notify("info", message, { ...options, type: "info" });
  }
}

// Create singleton instance
export const notificationManager = new SocketNotificationManager();

/**
 * Custom hook for using notifications in components
 */
export function useSocketNotifications() {
  return {
    success: notificationManager.success.bind(notificationManager),
    error: notificationManager.error.bind(notificationManager),
    warning: notificationManager.warning.bind(notificationManager),
    info: notificationManager.info.bind(notificationManager),
    on: notificationManager.on.bind(notificationManager),
    off: notificationManager.off.bind(notificationManager),
  };
}

/**
 * Socket event handlers with notifications
 */
export const socketEventHandlers = {
  // Message events
  "message:sent": (notify) => (data) => {
    notify?.success("Message sent successfully", {
      autoHideDuration: 2000,
    });
  },

  "message:delivered": (notify) => (data) => {
    notify?.info("Message delivered", {
      autoHideDuration: 1500,
    });
  },

  "message:seen": (notify) => (data) => {
    notify?.info("Message seen", {
      autoHideDuration: 1500,
    });
  },

  "message:error": (notify) => (error) => {
    notify?.error(
      "Failed to send message: " + (error?.message || "Unknown error"),
      {
        autoHideDuration: 4000,
      },
    );
  },

  // User events
  "user-online": (notify) => (userId) => {
    logger.log(`[Socket] User online: ${userId}`);
  },

  "user-offline":
    (notify) =>
    ({ userId, lastSeen }) => {
      logger.log(`[Socket] User offline: ${userId}`);
    },

  "user-status-changed": (notify) => (data) => {
    notify?.info(`User status changed to ${data.status}`, {
      autoHideDuration: 2000,
    });
  },

  // Group events
  "group:created": (notify) => (data) => {
    notify?.success(`Group "${data.group?.name}" created successfully!`, {
      autoHideDuration: 3000,
    });
  },

  "group:updated": (notify) => (data) => {
    notify?.success(`Group "${data.group?.name}" updated`, {
      autoHideDuration: 2000,
    });
  },

  "group:deleted": (notify) => (data) => {
    notify?.info("Group deleted", {
      autoHideDuration: 2000,
    });
  },

  "group:error": (notify) => (error) => {
    notify?.error(
      "Group operation failed: " + (error?.message || "Unknown error"),
      {
        autoHideDuration: 4000,
      },
    );
  },

  // Location events
  "location:updated": (notify) => (data) => {
    logger.log("[Socket] Location updated");
  },

  "location:error": (notify) => (error) => {
    notify?.error(
      "Location update failed: " + (error?.message || "Unknown error"),
      {
        autoHideDuration: 4000,
      },
    );
  },

  // Connection events
  connect: (notify) => () => {
    notify?.success("Connected to server", {
      autoHideDuration: 2000,
    });
  },

  disconnect: (notify) => () => {
    notify?.warning("Disconnected from server. Attempting to reconnect...", {
      autoHideDuration: 4000,
    });
  },

  connect_error: (notify) => (error) => {
    notify?.error(
      "Connection error: " + (error?.message || "Failed to connect"),
      {
        autoHideDuration: 5000,
      },
    );
  },

  error: (notify) => (error) => {
    notify?.error("Socket error: " + (error?.message || "Unknown error"), {
      autoHideDuration: 5000,
    });
  },

  // Analytics events
  "analytics:metrics-updated": (notify) => (data) => {
    if (data?.success) {
      logger.log("[Analytics] Metrics updated");
    }
  },

  "analytics:user-activity": (notify) => (data) => {
    if (data?.success) {
      logger.log("[Analytics] User activity updated");
    }
  },

  "analytics:message-stats": (notify) => (data) => {
    if (data?.success) {
      logger.log("[Analytics] Message stats updated");
    }
  },

  "analytics:location-stats": (notify) => (data) => {
    if (data?.success) {
      logger.log("[Analytics] Location stats updated");
    }
  },

  "analytics:group-stats": (notify) => (data) => {
    if (data?.success) {
      logger.log("[Analytics] Group stats updated");
    }
  },

  "analytics:error": (notify) => (error) => {
    notify?.error("Analytics error: " + (error?.error || "Unknown error"), {
      autoHideDuration: 4000,
    });
  },
};

/**
 * Setup event handlers with notifications
 */
export function setupSocketEventHandlers(socket, notify) {
  if (!socket) {
    logger.warn("[Socket] Socket not available, skipping event handler setup");
    return;
  }

  Object.entries(socketEventHandlers).forEach(([event, handler]) => {
    try {
      const handlerFn = handler(notify);
      socket.on(event, handlerFn);
      logger.log(`[Socket] Event handler registered: ${event}`);
    } catch (error) {
      logger.error(`[Socket] Error registering handler for ${event}:`, error);
    }
  });
}

/**
 * Remove event handlers
 */
export function removeSocketEventHandlers(socket) {
  if (!socket) return;

  Object.keys(socketEventHandlers).forEach((event) => {
    socket.off(event);
  });

  logger.log("[Socket] Event handlers removed");
}

export default {
  SocketNotificationManager,
  notificationManager,
  useSocketNotifications,
  socketEventHandlers,
  setupSocketEventHandlers,
  removeSocketEventHandlers,
};
