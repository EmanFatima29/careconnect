import { asyncHandler } from "../middleware/errorHandler.js";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import Prescription from "../models/prescriptionModel.js";

const requireDoctor = (req, res) => {
  const role = req.user?.roles;
  if (role !== "doctor" && role !== "admin" && role !== "superadmin") {
    res.status(403).json({ error: "Doctor access required" });
    return false;
  }
  return true;
};

export const getDoctorPatients = asyncHandler(async (req, res) => {
  if (!requireDoctor(req, res)) return;

  const doctorId = req.user?.userId;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
  const skip  = (page - 1) * limit;

  // Unique patients from prescriptions this doctor issued
  const pipeline = [
    { $match: { doctorId: new mongoose.Types.ObjectId(doctorId) } },
    { $group: { _id: "$patientId" } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "patient",
      },
    },
    { $unwind: "$patient" },
    {
      $project: {
        _id: "$patient._id",
        name: "$patient.name",
        email: "$patient.email",
        profilePic: "$patient.profilePic",
        status: "$patient.status",
        lastSeen: "$patient.lastSeen",
      },
    },
  ];

  const [patients, totalAgg] = await Promise.all([
    Prescription.aggregate(pipeline),
    Prescription.aggregate([
      { $match: { doctorId: new mongoose.Types.ObjectId(doctorId) } },
      { $group: { _id: "$patientId" } },
      { $count: "total" },
    ]),
  ]);

  return res.status(200).json({ patients, total: totalAgg[0]?.total || 0, page, limit });
});

export const getDoctorStats = asyncHandler(async (req, res) => {
  if (!requireDoctor(req, res)) return;

  const doctorId = req.user?.userId;
  const doctorObjId = new mongoose.Types.ObjectId(doctorId);

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [patientCount, prescriptionsThisWeek, doctorUser] = await Promise.all([
    Prescription.distinct("patientId", { doctorId: doctorObjId }),
    Prescription.countDocuments({ doctorId: doctorObjId, createdAt: { $gte: weekAgo } }),
    User.findById(doctorId).select("ratingSummary doctorProfile").lean(),
  ]);

  return res.status(200).json({
    totalPatients: patientCount.length,
    prescriptionsThisWeek,
    averageRating: doctorUser?.ratingSummary?.averageRating || 0,
    totalRatings:  doctorUser?.ratingSummary?.totalRatings  || 0,
    verified: doctorUser?.doctorProfile?.verified || false,
  });
});

export const getDoctorPrescriptions = asyncHandler(async (req, res) => {
  if (!requireDoctor(req, res)) return;

  const doctorId = req.user?.userId;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
  const skip  = (page - 1) * limit;

  const [prescriptions, total] = await Promise.all([
    Prescription.find({ doctorId })
      .populate("patientId", "name email profilePic")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Prescription.countDocuments({ doctorId }),
  ]);

  return res.status(200).json({ prescriptions, total, page, limit });
});
