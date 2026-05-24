import { asyncHandler } from "../middleware/errorHandler.js";
import logger from "../../lib/logger.js";
/**
 * Analytics Controller
 * Handle analytics data retrieval and computation
 * Location: /server/src/controllers/analyticsController.js
 */

import User from "../models/userModel.js";
import Message from "../models/messageModel.js";
import Group from "../models/groupModel.js";
import ActivityLog from "../models/activityLogModel.js";

/**
 * Get analytics metrics (KPI summary)
 * GET /api/analytics/metrics
 */
export const getMetrics = asyncHandler(async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const onlineUsers = await User.countDocuments({ status: "online" });
    const messageCount = await Message.countDocuments();
    const groupCount = await Group.countDocuments();
    const sharingLocationCount = await User.countDocuments({
      "location.coordinates": { $ne: [0, 0] },
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        onlineUsers,
        messageCount,
        groupCount,
        sharingLocation: sharingLocationCount,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    logger.error("Error fetching metrics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch metrics",
      message: error.message,
    });
  }
});

/**
 * Get user activity data (7 days default)
 * GET /api/analytics/user-activity?days=7
 */
export const getUserActivity = asyncHandler(async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activity = await ActivityLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Fill in missing dates with 0
    const result = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      const found = activity.find((a) => a._id === dateStr);
      result.push({
        date: dateStr,
        activities: found ? found.count : 0,
      });
    }

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error("Error fetching user activity:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user activity",
      message: error.message,
    });
  }
});

/**
 * Get message statistics
 * GET /api/analytics/messages?days=7
 */
export const getMessageStats = asyncHandler(async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const messageStats = await Message.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Calculate daily stats
    const result = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      const found = messageStats.find((m) => m._id === dateStr);
      result.push({
        date: dateStr,
        messages: found ? found.count : 0,
      });
    }

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error("Error fetching message stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch message stats",
      message: error.message,
    });
  }
});

/**
 * Get location statistics
 * GET /api/analytics/location-stats
 */
export const getLocationStats = asyncHandler(async (req, res) => {
  try {
    const usersWithLocation = await User.aggregate([
      {
        $match: {
          "location.coordinates": { $ne: [0, 0] },
        },
      },
      {
        $group: {
          _id: {
            $cond: [
              {
                $and: [
                  { $gte: ["$location.coordinates.0", -180] },
                  { $lte: ["$location.coordinates.0", 180] },
                ],
              },
              "$address.city",
              "Unknown",
            ],
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        sharing: usersWithLocation.length,
        byLocation: usersWithLocation.slice(0, 10), // Top 10 locations
        timestamp: new Date(),
      },
    });
  } catch (error) {
    logger.error("Error fetching location stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch location stats",
      message: error.message,
    });
  }
});

/**
 * Get group statistics
 * GET /api/analytics/groups
 */
export const getGroupStats = asyncHandler(async (req, res) => {
  try {
    const groupStats = await Group.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "members",
          foreignField: "_id",
          as: "memberDetails",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          memberCount: { $size: "$members" },
          createdAt: 1,
        },
      },
      {
        $sort: { memberCount: -1 },
      },
    ]);

    const totalMembers = groupStats.reduce((sum, g) => sum + g.memberCount, 0);

    res.status(200).json({
      success: true,
      data: {
        totalGroups: groupStats.length,
        totalMembers,
        topGroups: groupStats.slice(0, 10),
        timestamp: new Date(),
      },
    });
  } catch (error) {
    logger.error("Error fetching group stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch group stats",
      message: error.message,
    });
  }
});

/**
 * Export analytics data
 * GET /api/analytics/export?format=csv&dateRange=7days
 */
export const exportAnalytics = asyncHandler(async (req, res) => {
  try {
    const format = req.query.format || "json";
    const dateRange = req.query.dateRange || "7days";

    // Get metrics
    const metrics = await getMetricsData();

    if (format === "csv") {
      // Generate CSV
      const csv = generateCSV(metrics);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="analytics.csv"',
      );
      res.send(csv);
    } else {
      // JSON response
      res.status(200).json({
        success: true,
        data: metrics,
        format: "json",
        timestamp: new Date(),
      });
    }
  } catch (error) {
    logger.error("Error exporting analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to export analytics",
      message: error.message,
    });
  }
});

/**
 * Shared query functions — used by both REST endpoints and Socket.IO analytics handler.
 * This is the single source of truth for analytics data.
 */

export async function queryMetrics() {
  const totalUsers = await User.countDocuments();
  const onlineUsers = await User.countDocuments({ status: "online" });
  const messageCount = await Message.countDocuments();
  const groupCount = await Group.countDocuments();
  const sharingLocation = await User.countDocuments({
    "location.coordinates": { $ne: [0, 0] },
  });
  return { totalUsers, onlineUsers, messageCount, groupCount, sharingLocation, timestamp: new Date() };
}

export async function queryUserActivity(days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const activity = await ActivityLog.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const result = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    const found = activity.find((a) => a._id === dateStr);
    result.push({ date: dateStr, activities: found ? found.count : 0 });
  }
  return result;
}

export async function queryMessageStats(days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const messageStats = await Message.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const result = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    const found = messageStats.find((m) => m._id === dateStr);
    result.push({ date: dateStr, messages: found ? found.count : 0 });
  }
  return result;
}

export async function queryLocationStats() {
  const usersWithLocation = await User.aggregate([
    { $match: { "location.coordinates": { $ne: [0, 0] } } },
    { $group: { _id: "$address.city", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  return { sharing: usersWithLocation.length, byLocation: usersWithLocation.slice(0, 10), timestamp: new Date() };
}

export async function queryGroupStats() {
  const groupStats = await Group.aggregate([
    { $project: { _id: 1, name: 1, memberCount: { $size: "$members" }, createdAt: 1 } },
    { $sort: { memberCount: -1 } },
  ]);
  const totalMembers = groupStats.reduce((sum, g) => sum + g.memberCount, 0);
  return { totalGroups: groupStats.length, totalMembers, topGroups: groupStats.slice(0, 10), timestamp: new Date() };
}

// Legacy alias used by exportAnalytics
async function getMetricsData() {
  return queryMetrics();
}

/**
 * Helper: Generate CSV from metrics
 */
function generateCSV(metrics) {
  const headers = Object.keys(metrics).join(",");
  const values = Object.values(metrics).join(",");
  return `${headers}\n${values}`;
}
