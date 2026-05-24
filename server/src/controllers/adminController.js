import { asyncHandler } from "../middleware/errorHandler.js";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import Prescription from "../models/prescriptionModel.js";
import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";
import ActivityLog from "../models/activityLogModel.js";
import Appointment from "../models/appointmentModel.js";

const clampInt = (value, fallback, { min, max }) => {
  const n = parseInt(String(value ?? ""), 10);
  const v = Number.isFinite(n) ? n : fallback;
  return Math.max(min, Math.min(max, v));
};

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const getDateRange = (req, { defaultDaysBack = 30 } = {}) => {
  const to = parseDate(req.query.to) || new Date();
  const from =
    parseDate(req.query.from) ||
    new Date(to.getTime() - defaultDaysBack * 24 * 60 * 60 * 1000);
  return { from, to };
};

const dayKeyExpr = (ward) => ({
  $dateToString: { format: "%Y-%m-%d", date: ward, timezone: "UTC" },
});

export const getUserStatistics = asyncHandler(async (req, res) => {
  try {
    const { from, to } = getDateRange(req, { defaultDaysBack: 30 });

    const [
      totalUsers,
      byRole,
      byAccount,
      byOnlineStatus,
      newUsersInRange,
      newUsersByDay,
    ] = await Promise.all([
      User.countDocuments({}),
      User.aggregate([
        { $group: { _id: "$roles", count: { $sum: 1 } } },
        { $project: { _id: 0, role: "$_id", count: 1 } },
        { $sort: { count: -1, role: 1 } },
      ]),
      User.aggregate([
        { $group: { _id: "$account", count: { $sum: 1 } } },
        { $project: { _id: 0, account: "$_id", count: 1 } },
        { $sort: { count: -1, account: 1 } },
      ]),
      User.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { _id: 0, status: "$_id", count: 1 } },
        { $sort: { count: -1, status: 1 } },
      ]),
      User.countDocuments({ joined: { $gte: from, $lte: to } }),
      User.aggregate([
        { $match: { joined: { $gte: from, $lte: to } } },
        { $group: { _id: dayKeyExpr("$joined"), count: { $sum: 1 } } },
        { $project: { _id: 0, day: "$_id", count: 1 } },
        { $sort: { day: 1 } },
      ]),
    ]);

    return res.status(200).json({
      totalUsers,
      byRole,
      byAccount,
      byOnlineStatus,
      range: { from, to },
      newUsersInRange,
      newUsersByDay,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export const getCropSummaries = asyncHandler(async (req, res) => {
  try {
    const { from, to } = getDateRange(req, { defaultDaysBack: 30 });

    const [
      totalPrescriptions,
      prescriptionsCreatedInRange,
      byStatus,
      topByCount,
    ] = await Promise.all([
      Prescription.countDocuments({}),
      Prescription.countDocuments({ createdAt: { $gte: from, $lte: to } }),
      Prescription.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { _id: 0, status: "$_id", count: 1 } },
        { $sort: { count: -1, status: 1 } },
      ]),
      Prescription.aggregate([
        { $group: { _id: "$name", count: { $sum: 1 } } },
        { $project: { _id: 0, name: "$_id", count: 1 } },
        { $sort: { count: -1, name: 1 } },
        { $limit: 10 },
      ]),
    ]);

    return res.status(200).json({
      totalPrescriptions,
      range: { from, to },
      prescriptionsCreatedInRange,
      byStatus,
      topByCount,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export const getChatUsageStats = asyncHandler(async (req, res) => {
  try {
    const { from, to } = getDateRange(req, { defaultDaysBack: 30 });

    const [
      totalChats,
      groupChats,
      totalMessages,
      chatsCreatedInRange,
      messagesInRange,
      messagesByDay,
      distinctActiveChats,
      distinctActiveSenders,
      topSenders,
    ] = await Promise.all([
      Chat.countDocuments({}),
      Chat.countDocuments({ isGroup: true }),
      Message.countDocuments({}),
      Chat.countDocuments({ createdAt: { $gte: from, $lte: to } }),
      Message.countDocuments({ createdAt: { $gte: from, $lte: to } }),
      Message.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: dayKeyExpr("$createdAt"), count: { $sum: 1 } } },
        { $project: { _id: 0, day: "$_id", count: 1 } },
        { $sort: { day: 1 } },
      ]),
      Message.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: "$chatId" } },
        { $count: "count" },
      ]),
      Message.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: "$senderId" } },
        { $count: "count" },
      ]),
      Message.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: "$senderId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            senderId: "$_id",
            count: 1,
            name: "$user.name",
            email: "$user.email",
          },
        },
      ]),
    ]);

    const directChats = totalChats - groupChats;

    return res.status(200).json({
      range: { from, to },
      chats: {
        total: totalChats,
        group: groupChats,
        direct: directChats,
        createdInRange: chatsCreatedInRange,
      },
      messages: {
        total: totalMessages,
        inRange: messagesInRange,
        byDay: messagesByDay,
      },
      activity: {
        activeChatsInRange: distinctActiveChats?.[0]?.count || 0,
        activeSendersInRange: distinctActiveSenders?.[0]?.count || 0,
        topSenders,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export const listActivityLogs = asyncHandler(async (req, res) => {
  try {
    const page = clampInt(req.query.page, 1, { min: 1, max: 1_000_000 });
    const limit = clampInt(req.query.limit, 50, { min: 1, max: 100 });
    const skip = (page - 1) * limit;

    const { from, to } = getDateRange(req, { defaultDaysBack: 30 });

    const filter = {
      createdAt: { $gte: from, $lte: to },
    };

    if (typeof req.query.action === "string" && req.query.action.trim()) {
      filter.action = req.query.action.trim();
    }

    if (
      typeof req.query.entityType === "string" &&
      req.query.entityType.trim()
    ) {
      filter.entityType = req.query.entityType.trim();
    }

    if (typeof req.query.status === "string" && req.query.status.trim()) {
      filter.status = req.query.status.trim();
    }

    if (typeof req.query.actorId === "string" && req.query.actorId.trim()) {
      if (!mongoose.Types.ObjectId.isValid(req.query.actorId)) {
        return res.status(400).json({ error: "Invalid actorId" });
      }
      filter.actorId = new mongoose.Types.ObjectId(req.query.actorId);
    }

    const [total, items] = await Promise.all([
      ActivityLog.countDocuments(filter),
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res
      .status(200)
      .json({ page, limit, total, range: { from, to }, items });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ── Healthcare Admin Endpoints ─────────────────────────────────────────

/**
 * GET /api/admin/pending-verifications
 * List doctors and pharmacies awaiting admin approval (verified=false).
 */
export const getPendingVerifications = asyncHandler(async (req, res) => {
  const [doctors, pharmacies] = await Promise.all([
    User.find({ roles: "doctor", "doctorProfile.verified": false })
      .select("name email createdAt doctorProfile profilePic")
      .sort({ createdAt: -1 })
      .lean(),
    User.find({ roles: "pharmacy", "pharmacyProfile.verified": false })
      .select("name email createdAt pharmacyProfile profilePic")
      .sort({ createdAt: -1 })
      .lean(),
  ]);
  return res.status(200).json({ doctors, pharmacies, total: doctors.length + pharmacies.length });
});

/**
 * PATCH /api/admin/verify/:userId
 * Approve a doctor or pharmacy — sets their profile.verified = true.
 */
export const verifyProfessional = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (user.roles === "doctor") {
    user.doctorProfile = user.doctorProfile || {};
    user.doctorProfile.verified = true;
  } else if (user.roles === "pharmacy") {
    user.pharmacyProfile = user.pharmacyProfile || {};
    user.pharmacyProfile.verified = true;
  } else {
    return res.status(400).json({ error: "User is not a doctor or pharmacy" });
  }
  await user.save();
  return res.status(200).json({ success: true, userId: user._id, roles: user.roles });
});

/**
 * PATCH /api/admin/reject/:userId
 * Reject a doctor or pharmacy — keeps verified=false and marks rejection.
 */
export const rejectProfessional = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (!["doctor", "pharmacy"].includes(user.roles)) {
    return res.status(400).json({ error: "User is not a doctor or pharmacy" });
  }
  await user.save();
  return res.status(200).json({ success: true, userId: user._id, status: "rejected" });
});

/**
 * GET /api/admin/healthcare-stats
 * Platform-level healthcare statistics for the admin dashboard.
 */
export const getHealthcareStats = asyncHandler(async (req, res) => {
  const [
    doctorCount,
    verifiedDoctors,
    pharmacyCount,
    verifiedPharmacies,
    appointmentCount,
    prescriptionCount,
  ] = await Promise.all([
    User.countDocuments({ roles: "doctor" }),
    User.countDocuments({ roles: "doctor", "doctorProfile.verified": true }),
    User.countDocuments({ roles: "pharmacy" }),
    User.countDocuments({ roles: "pharmacy", "pharmacyProfile.verified": true }),
    Appointment.countDocuments(),
    Prescription.countDocuments(),
  ]);

  return res.status(200).json({
    doctors:      { total: doctorCount,   verified: verifiedDoctors,   pending: doctorCount - verifiedDoctors },
    pharmacies:   { total: pharmacyCount, verified: verifiedPharmacies, pending: pharmacyCount - verifiedPharmacies },
    appointments: appointmentCount,
    prescriptions: prescriptionCount,
  });
});
