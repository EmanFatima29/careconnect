import logger from "@/lib/logger";
/**
 * Socket.io Real-time Analytics Integration
 * Location: /client/src/lib/socketAnalytics.js
 * Handles real-time analytics updates via Socket.io with notifications
 */

import {
  updateMetrics,
  updateUserActivity,
  updateMessageStats,
  updateLocationStats,
  updateGroupStats,
} from "@/utils/redux/analyticsSlice";

/**
 * Setup Socket.io listeners for analytics
 * Call this function in your Socket.io initialization
 *
 * Usage:
 * setupAnalyticsListeners(socket, dispatch, notify);
 */
export const setupAnalyticsListeners = (socket, dispatch, notify = null) => {
  if (!socket || !dispatch) {
    logger.warn("[Analytics] Socket or dispatch not available");
    return;
  }

  /**
   * Metrics updated - real-time KPI updates
   */
  socket.on("analytics:metrics-updated", (data) => {
    logger.log("[Analytics] Metrics updated:", data);
    try {
      if (data.success) {
        dispatch(updateMetrics(data.data));
        notify?.(
          "success",
          "Metrics updated in real-time",
          "analytics-metrics",
        );
      } else {
        throw new Error(data.error || "Failed to update metrics");
      }
    } catch (error) {
      logger.error("[Analytics] Error updating metrics:", error);
      notify?.("error", "Failed to update metrics", "analytics-error");
    }
  });

  /**
   * User activity updated
   */
  socket.on("analytics:user-activity", (data) => {
    logger.log("[Analytics] User activity received:", data);
    try {
      if (data.success) {
        dispatch(updateUserActivity(data.data));
        notify?.("success", "User activity updated", "analytics-activity");
      } else {
        throw new Error(data.error || "Failed to update user activity");
      }
    } catch (error) {
      logger.error("[Analytics] Error updating user activity:", error);
      notify?.("error", "Failed to update user activity", "analytics-error");
    }
  });

  /**
   * Message statistics updated
   */
  socket.on("analytics:message-stats", (data) => {
    logger.log("[Analytics] Message stats received:", data);
    try {
      if (data.success) {
        dispatch(updateMessageStats(data.data));
        notify?.("success", "Message stats updated", "analytics-messages");
      } else {
        throw new Error(data.error || "Failed to update message stats");
      }
    } catch (error) {
      logger.error("[Analytics] Error updating message stats:", error);
      notify?.("error", "Failed to update message stats", "analytics-error");
    }
  });

  /**
   * Location statistics updated
   */
  socket.on("analytics:location-stats", (data) => {
    logger.log("[Analytics] Location stats received:", data);
    try {
      if (data.success) {
        dispatch(updateLocationStats(data.data));
        notify?.("success", "Location stats updated", "analytics-location");
      } else {
        throw new Error(data.error || "Failed to update location stats");
      }
    } catch (error) {
      logger.error("[Analytics] Error updating location stats:", error);
      notify?.("error", "Failed to update location stats", "analytics-error");
    }
  });

  /**
   * Group statistics updated
   */
  socket.on("analytics:group-stats", (data) => {
    logger.log("[Analytics] Group stats received:", data);
    try {
      if (data.success) {
        dispatch(updateGroupStats(data.data));
        notify?.("success", "Group stats updated", "analytics-groups");
      } else {
        throw new Error(data.error || "Failed to update group stats");
      }
    } catch (error) {
      logger.error("[Analytics] Error updating group stats:", error);
      notify?.("error", "Failed to update group stats", "analytics-error");
    }
  });

  /**
   * General error event
   */
  socket.on("analytics:error", (data) => {
    logger.error("[Analytics] Server error:", data);
    notify?.(
      "error",
      data.error || "Analytics error occurred",
      "analytics-error",
    );
  });

  logger.log("[Analytics] Socket listeners setup complete");
};

/**
 * Remove Socket.io listeners for analytics
 * Call this when unmounting or cleaning up
 */
export const removeAnalyticsListeners = (socket) => {
  if (!socket) return;

  socket.off("analytics:metrics-updated");
  socket.off("analytics:user-activity");
  socket.off("analytics:message-stats");
  socket.off("analytics:location-stats");
  socket.off("analytics:group-stats");
  socket.off("analytics:error");

  logger.log("[Analytics] Socket listeners removed");
};

/**
 * Request metrics from server via Socket.io
 */
export const requestMetricsViaSocket = (socket) => {
  if (!socket) {
    logger.warn("[Analytics] Socket not available");
    return;
  }
  socket.emit("analytics:request-metrics");
  logger.log("[Analytics] Requested metrics data");
};

/**
 * Request user activity from server via Socket.io
 */
export const requestUserActivityViaSocket = (socket, days = 7) => {
  if (!socket) {
    logger.warn("[Analytics] Socket not available");
    return;
  }
  socket.emit("analytics:request-user-activity", { days });
  logger.log(`[Analytics] Requested user activity for ${days} days`);
};

/**
 * Request message stats from server via Socket.io
 */
export const requestMessageStatsViaSocket = (socket, days = 7) => {
  if (!socket) {
    logger.warn("[Analytics] Socket not available");
    return;
  }
  socket.emit("analytics:request-message-stats", { days });
  logger.log(`[Analytics] Requested message stats for ${days} days`);
};

/**
 * Request location stats from server via Socket.io
 */
export const requestLocationStatsViaSocket = (socket) => {
  if (!socket) {
    logger.warn("[Analytics] Socket not available");
    return;
  }
  socket.emit("analytics:request-location-stats");
  logger.log("[Analytics] Requested location stats");
};

/**
 * Request group stats from server via Socket.io
 */
export const requestGroupStatsViaSocket = (socket) => {
  if (!socket) {
    logger.warn("[Analytics] Socket not available");
    return;
  }
  socket.emit("analytics:request-group-stats");
  logger.log("[Analytics] Requested group stats");
};

/**
 * Request all analytics data via Socket.io
 */
export const requestAllAnalyticsViaSocket = (socket, days = 7) => {
  if (!socket) {
    logger.warn("[Analytics] Socket not available");
    return;
  }
  requestMetricsViaSocket(socket);
  requestUserActivityViaSocket(socket, days);
  requestMessageStatsViaSocket(socket, days);
  requestLocationStatsViaSocket(socket);
  requestGroupStatsViaSocket(socket);
  logger.log("[Analytics] Requested all analytics data");
};

/**
 * Handle Socket.io connection for analytics
 */
export const handleAnalyticsSocketConnection = (
  socket,
  dispatch,
  notify = null,
) => {
  if (!socket) return;

  socket.on("connect", () => {
    logger.log("[Analytics] Socket connected, requesting data...");
    requestAllAnalyticsViaSocket(socket);
  });

  socket.on("disconnect", () => {
    logger.log("[Analytics] Socket disconnected");
    notify?.(
      "warning",
      "Real-time analytics connection lost",
      "analytics-disconnect",
    );
  });

  socket.on("connect_error", (error) => {
    logger.error("[Analytics] Socket connection error:", error);
    notify?.(
      "error",
      "Failed to connect to real-time analytics",
      "analytics-error",
    );
  });

  setupAnalyticsListeners(socket, dispatch, notify);
};

/**
 * Handle socket connection/disconnection
 */
// export const handleAnalyticsSocketConnection = (socket, dispatch) => {
//   if (!socket) return;

//   socket.on("connect", () => {
//     logger.log("[Analytics] Socket connected, requesting initial data");
//     requestAnalyticsUpdate(socket, "all");
//   });

//   socket.on("disconnect", () => {
//     logger.log("[Analytics] Socket disconnected");
//   });

//   socket.on("error", (error) => {
//     logger.error("[Analytics] Socket error:", error);
//   });
// };

export default {
  setupAnalyticsListeners,
  removeAnalyticsListeners,
  requestMetricsViaSocket,
  requestUserActivityViaSocket,
  requestMessageStatsViaSocket,
  requestLocationStatsViaSocket,
  requestGroupStatsViaSocket,
  requestAllAnalyticsViaSocket,
  handleAnalyticsSocketConnection,
};
