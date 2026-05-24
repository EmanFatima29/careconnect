import logger from "@/lib/logger";
/**
 * Analytics Data Fetching Service
 * Centralized API calls for analytics data
 * Location: /client/src/lib/analyticsApi.js
 */

import api from "@/lib/api";
// The `api` instance automatically attaches the Bearer token via its interceptor;
// no manual auth-header construction is needed here.

export const analyticsApi = {
  /**
   * Get all analytics metrics
   */
  getMetrics: async () => {
    try {
      const response = await api.get(`/api/analytics/metrics`);
      return response.data;
    } catch (error) {
      logger.error("Failed to fetch metrics:", error);
      throw error;
    }
  },

  /**
   * Get user activity data (7 days by default)
   */
  getUserActivity: async (days = 7) => {
    try {
      const response = await api.get(`/api/analytics/user-activity`, {
        params: { days },
      });
      return response.data;
    } catch (error) {
      logger.error("Failed to fetch user activity:", error);
      throw error;
    }
  },

  /**
   * Get message statistics
   */
  getMessageStats: async (days = 7) => {
    try {
      const response = await api.get(`/api/analytics/messages`, {
        params: { days },
      });
      return response.data;
    } catch (error) {
      logger.error("Failed to fetch message stats:", error);
      throw error;
    }
  },

  /**
   * Get location statistics
   */
  getLocationStats: async () => {
    try {
      const response = await api.get(`/api/analytics/location-stats`);
      return response.data;
    } catch (error) {
      logger.error("Failed to fetch location stats:", error);
      throw error;
    }
  },

  /**
   * Get group statistics
   */
  getGroupStats: async () => {
    try {
      const response = await api.get(`/api/analytics/groups`);
      return response.data;
    } catch (error) {
      logger.error("Failed to fetch group stats:", error);
      throw error;
    }
  },

  /**
   * Export analytics data
   */
  exportAnalytics: async (format = "csv", dateRange = "7days") => {
    try {
      const response = await api.get(`/api/analytics/export`, {
        params: { format, dateRange },
        responseType: format === "csv" ? "blob" : "json",
      });
      return response.data;
    } catch (error) {
      logger.error("Failed to export analytics:", error);
      throw error;
    }
  },
};

export default analyticsApi;
