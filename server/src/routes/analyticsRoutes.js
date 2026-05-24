/**
 * Analytics Routes
 * Define all analytics API endpoints
 * Location: /server/src/routes/analyticsRoutes.js
 */

import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  getMetrics,
  getUserActivity,
  getMessageStats,
  getLocationStats,
  getGroupStats,
  exportAnalytics,
} from "../controllers/analyticsController.js";

const router = express.Router();

/**
 * GET /api/analytics/metrics
 * Get KPI summary (total users, online users, messages, groups, location sharing)
 */
router.get("/metrics", authenticate, getMetrics);

/**
 * GET /api/analytics/user-activity?days=7
 * Get user activity trends for specified days
 */
router.get("/user-activity", authenticate, getUserActivity);

/**
 * GET /api/analytics/messages?days=7
 * Get message statistics for specified days
 */
router.get("/messages", authenticate, getMessageStats);

/**
 * GET /api/analytics/location-stats
 * Get location sharing statistics
 */
router.get("/location-stats", authenticate, getLocationStats);

/**
 * GET /api/analytics/groups
 * Get group statistics (top groups, member counts)
 */
router.get("/groups", authenticate, getGroupStats);

/**
 * GET /api/analytics/export?format=csv|json&dateRange=7days
 * Export analytics data in CSV or JSON format
 */
router.get("/export", authenticate, exportAnalytics);

export default router;
