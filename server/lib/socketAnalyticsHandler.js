/**
 * Socket.io Analytics Event Handlers
 * Real-time analytics data streaming
 *
 * UNIFIED: Uses shared query functions from analyticsController.js
 * so both REST and Socket endpoints return identical data.
 */

import {
  queryMetrics,
  queryUserActivity,
  queryMessageStats,
  queryLocationStats,
  queryGroupStats,
} from "../src/controllers/analyticsController.js";
import logger from "./logger.js";

/**
 * Setup analytics event handlers
 */
export const setupAnalyticsHandlers = (io) => {
  io.on("connection", (socket) => {
    logger.log("[Analytics] Client connected:", socket.id);

    // Metrics — same data as GET /api/analytics/metrics
    socket.on("analytics:request-metrics", async () => {
      try {
        const data = await queryMetrics();
        socket.emit("analytics:metrics-updated", { success: true, data });
      } catch (error) {
        logger.error("[Analytics] Error fetching metrics:", error);
        socket.emit("analytics:error", { success: false, error: "Failed to fetch metrics" });
      }
    });

    // User activity — same data as GET /api/analytics/user-activity
    socket.on("analytics:request-user-activity", async (params) => {
      try {
        const data = await queryUserActivity(params?.days || 7);
        socket.emit("analytics:user-activity", { success: true, data, timestamp: new Date() });
      } catch (error) {
        logger.error("[Analytics] Error fetching user activity:", error);
        socket.emit("analytics:error", { success: false, error: "Failed to fetch user activity" });
      }
    });

    // Message stats — same data as GET /api/analytics/messages
    socket.on("analytics:request-message-stats", async (params) => {
      try {
        const data = await queryMessageStats(params?.days || 7);
        socket.emit("analytics:message-stats", { success: true, data, timestamp: new Date() });
      } catch (error) {
        logger.error("[Analytics] Error fetching message stats:", error);
        socket.emit("analytics:error", { success: false, error: "Failed to fetch message stats" });
      }
    });

    // Location stats — same data as GET /api/analytics/location-stats
    socket.on("analytics:request-location-stats", async () => {
      try {
        const data = await queryLocationStats();
        socket.emit("analytics:location-stats", { success: true, data });
      } catch (error) {
        logger.error("[Analytics] Error fetching location stats:", error);
        socket.emit("analytics:error", { success: false, error: "Failed to fetch location stats" });
      }
    });

    // Group stats — same data as GET /api/analytics/groups
    socket.on("analytics:request-group-stats", async () => {
      try {
        const data = await queryGroupStats();
        socket.emit("analytics:group-stats", { success: true, data });
      } catch (error) {
        logger.error("[Analytics] Error fetching group stats:", error);
        socket.emit("analytics:error", { success: false, error: "Failed to fetch group stats" });
      }
    });

    socket.on("disconnect", () => {
      logger.log("[Analytics] Client disconnected:", socket.id);
    });
  });
};

/**
 * Broadcast metrics update to all connected clients
 */
export const broadcastMetricsUpdate = async (io) => {
  try {
    const data = await queryMetrics();
    io.emit("analytics:metrics-updated", { success: true, data });
  } catch (error) {
    logger.error("[Analytics] Error broadcasting metrics:", error);
  }
};
