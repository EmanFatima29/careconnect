import logger from "@/lib/logger";
/**
 * Socket.io Client Configuration
 * Location: /client/src/lib/socket.js
 * Handles real-time communication with automatic reconnection and error recovery
 */

import { io } from "socket.io-client";

// Configuration for socket connection
const socketConfig = {
  url: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8080",
  options: {
    autoConnect: false, // Manual connection
    withCredentials: true,
    transports: ["polling", "websocket"], // Polling first; upgrade to WS when proxy permits
    timeout: 10000,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    query: {}, // Initialize empty, will be set dynamically
  },
};

// Create socket instance
const socket = io(socketConfig.url, socketConfig.options);

/**
 * Error Recovery Handler
 */
class SocketErrorRecovery {
  constructor(socket) {
    this.socket = socket;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 5000;
    this.isRecovering = false;
  }

  /**
   * Setup error handlers
   */
  setupErrorHandlers() {
    this.socket.on("connect_error", (error) => {
      logger.error("[Socket] Connection error:", error);
      this.handleConnectionError(error);
    });

    this.socket.on("error", (error) => {
      logger.error("[Socket] Socket error:", error);
      this.handleSocketError(error);
    });

    this.socket.on("disconnect", (reason) => {
      logger.warn("[Socket] Disconnected:", reason);
      this.handleDisconnection(reason);
    });

    this.socket.on("reconnect_attempt", () => {
      this.reconnectAttempts++;
      logger.log(
        `[Socket] Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`,
      );
    });

    this.socket.on("reconnect", () => {
      logger.log("[Socket] Successfully reconnected");
      this.resetRecoveryState();
    });

    this.socket.on("reconnect_failed", () => {
      logger.error(
        "[Socket] Reconnection failed after",
        this.reconnectAttempts,
        "attempts",
      );
      this.handleReconnectionFailure();
    });
  }

  /**
   * Handle connection errors
   */
  handleConnectionError(error) {
    if (error.type === "UnauthorizedError") {
      logger.error("[Socket] Unauthorized - check authentication");
    } else if (error.type === "Transport error") {
      logger.warn("[Socket] Transport error - server may be down");
    } else if (error.message === "timeout" || error.message?.includes("timeout")) {
      logger.warn("[Socket] Connection timeout - server may not be reachable or is responding slowly");
    } else {
      logger.error("[Socket] Unknown connection error:", error.message || error);
    }

    // Attempt automatic recovery only for recoverable errors
    if (
      !this.isRecovering &&
      this.reconnectAttempts < this.maxReconnectAttempts &&
      error.message !== "Authentication required" &&
      error.message !== "Authentication error"
    ) {
      this.attemptRecovery();
    }
  }

  /**
   * Handle socket errors
   */
  handleSocketError(error) {
    logger.error("[Socket] Error message:", error.message || error);
  }

  /**
   * Handle disconnection
   */
  handleDisconnection(reason) {
    if (reason === "io server disconnect") {
      // Server initiated disconnect - try to reconnect only if auth is available
      logger.log("[Socket] Server disconnected us - attempting to reconnect");
      setTimeout(() => {
        if (!this.socket.connected && this.socket.auth?.token) {
          this.socket.connect();
        } else if (!this.socket.auth?.token) {
          logger.warn("[Socket] Cannot reconnect - no auth token available");
        }
      }, 1000);
    } else if (reason === "io client disconnect") {
      // Client initiated disconnect - don't auto reconnect
      logger.log("[Socket] Client disconnected");
    } else {
      // Network error or other reason
      logger.warn("[Socket] Disconnected due to:", reason);
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptRecovery();
      }
    }
  }

  /**
   * Attempt recovery with exponential backoff
   */
  attemptRecovery() {
    if (this.isRecovering) return;

    // Don't attempt recovery without auth token
    if (!this.socket.auth?.token) {
      logger.warn("[Socket] Cannot recover - no auth token available");
      return;
    }

    this.isRecovering = true;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay,
    );

    logger.log(`[Socket] Attempting recovery in ${delay}ms...`);

    setTimeout(() => {
      if (
        !this.socket.connected &&
        this.reconnectAttempts < this.maxReconnectAttempts
      ) {
        this.socket.connect();
        this.isRecovering = false;
      }
    }, delay);
  }

  /**
   * Handle final reconnection failure
   */
  handleReconnectionFailure() {
    logger.error("[Socket] Unable to reconnect to server");
    // Could trigger UI notification or fallback mechanism here
  }

  /**
   * Reset recovery state after successful reconnection
   */
  resetRecoveryState() {
    this.reconnectAttempts = 0;
    this.isRecovering = false;
    logger.log("[Socket] Recovery state reset");
  }

  /**
   * Manual reconnect
   */
  reconnect() {
    this.resetRecoveryState();
    if (!this.socket.connected) {
      if (!this.socket.auth?.token) {
        logger.warn("[Socket] Cannot reconnect - no auth token available");
        return;
      }
      this.socket.connect();
      logger.log("[Socket] Manual reconnect initiated");
    }
  }
}

// Create error recovery instance
const errorRecovery = new SocketErrorRecovery(socket);

// Setup error handlers
errorRecovery.setupErrorHandlers();

/**
 * Enhanced socket with recovery methods
 */
socket.recovery = errorRecovery;

/**
 * Manual reconnection method
 */
socket.reconnect = () => {
  errorRecovery.reconnect();
};

/**
 * Get connection status
 */
socket.isConnected = () => {
  return socket.connected;
};

/**
 * Wait for connection with timeout
 */
socket.waitForConnection = (timeout = 5000) => {
  return new Promise((resolve, reject) => {
    if (socket.connected) {
      resolve();
    } else {
      const timer = setTimeout(() => {
        reject(new Error("Connection timeout"));
      }, timeout);

      socket.once("connect", () => {
        clearTimeout(timer);
        resolve();
      });
    }
  });
};

// Global error handler for unhandled socket errors
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    if (event.message && event.message.includes("socket")) {
      logger.error("[Socket] Unhandled error:", event);
    }
  });
}

export { socket as default, socketConfig, errorRecovery };
