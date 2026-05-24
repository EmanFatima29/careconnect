import { asyncHandler } from "../middleware/errorHandler.js";
import logger from "../../lib/logger.js";
import Visit from "../models/visitModel.js";
import User from "../models/userModel.js";
import Prescription from "../models/prescriptionModel.js";
import mongoose from "mongoose";
import { logActivity } from "../services/activityLogService.js";

/**
 * POST /api/visits — Create a visit. Auto-verifies GPS proximity.
 */
export const createVisit = asyncHandler(async (req, res) => {
  const visitorId = req.user?.userId;
  if (!visitorId) return res.status(401).json({ error: "Unauthorized" });

  const { patientId, prescriptionId, latitude, longitude, notes, photos, duration } = req.body;
  if (!patientId) return res.status(400).json({ error: "patientId is required" });

  let gpsVerified = false;
  let proximityDistance = null;

  if (latitude && longitude) {
    try {
      const patient = await User.findById(patientId).select("location").lean();
      if (patient?.location?.coordinates) {
        const [fLng, fLat] = patient.location.coordinates;
        const R = 6371000;
        const dLat = ((fLat - latitude) * Math.PI) / 180;
        const dLng = ((fLng - longitude) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((latitude * Math.PI) / 180) *
            Math.cos((fLat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        proximityDistance = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
        gpsVerified = proximityDistance <= 500;
      }
    } catch (err) {
      logger.error("[Visit] GPS verification failed:", err.message);
    }
  }

  const visit = await Visit.create({
    visitorId,
    patientId,
    prescriptionId: prescriptionId || null,
    location: latitude && longitude ? { type: "Point", coordinates: [longitude, latitude] } : undefined,
    gpsVerified,
    proximityDistance,
    notes: notes || "",
    photos: photos || [],
    duration: duration || null,
  });

  await logActivity({
    req,
    action: "visit.create",
    entityType: "Visit",
    entityId: visit._id,
    metadata: { patientId, gpsVerified, proximityDistance },
  });

  res.status(201).json({ success: true, visit });
});

/**
 * GET /api/visits
 */
export const getVisits = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const role = req.query.role || "visitor";
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const page = Math.max(parseInt(req.query.page) || 1, 1);

  const filter = role === "patient" ? { patientId: userId } : { visitorId: userId };

  const [visits, total] = await Promise.all([
    Visit.find(filter)
      .populate("visitorId", "name email profilePic")
      .populate("patientId", "name email profilePic location")
      .populate("prescriptionId", "name dosage status")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Visit.countDocuments(filter),
  ]);

  res.json({ success: true, visits, total, page, totalPages: Math.ceil(total / limit) });
});

/**
 * GET /api/visits/:id
 */
export const getVisitById = asyncHandler(async (req, res) => {
  const visit = await Visit.findById(req.params.id)
    .populate("visitorId", "name email profilePic")
    .populate("patientId", "name email profilePic")
    .populate("prescriptionId", "name dosage status area");
  if (!visit) return res.status(404).json({ error: "Visit not found" });
  res.json({ success: true, visit });
});

/**
 * GET /api/visits/analytics — Acreage analytics and visit stats.
 */
export const getVisitAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const [visitStats, cropStats, visitTimeline] = await Promise.all([
    Visit.aggregate([
      { $match: { visitorId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalVisits: { $sum: 1 },
          verifiedVisits: { $sum: { $cond: ["$gpsVerified", 1, 0] } },
          uniquePatients: { $addToSet: "$patientId" },
          avgDuration: { $avg: "$duration" },
        },
      },
      {
        $project: {
          _id: 0,
          totalVisits: 1,
          verifiedVisits: 1,
          uniquePatientCount: { $size: "$uniquePatients" },
          avgDuration: { $round: ["$avgDuration", 1] },
        },
      },
    ]),
    Prescription.aggregate([
      { $match: { ownerId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: "$name", totalArea: { $sum: "$area" }, count: { $sum: 1 } } },
      { $sort: { totalArea: -1 } },
    ]),
    Visit.aggregate([
      { $match: { visitorId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, week: { $week: "$createdAt" } },
          count: { $sum: 1 },
          date: { $first: "$createdAt" },
        },
      },
      { $sort: { "_id.year": -1, "_id.week": -1 } },
      { $limit: 12 },
    ]),
  ]);

  res.json({
    success: true,
    visits: visitStats[0] || { totalVisits: 0, verifiedVisits: 0, uniquePatientCount: 0, avgDuration: 0 },
    acreage: cropStats,
    timeline: visitTimeline,
  });
});
