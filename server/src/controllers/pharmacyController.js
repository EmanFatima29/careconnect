import { asyncHandler } from "../middleware/errorHandler.js";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import Prescription from "../models/prescriptionModel.js";

const requirePharmacy = (req, res) => {
  const role = req.user?.roles;
  if (role !== "pharmacy" && role !== "admin" && role !== "superadmin") {
    res.status(403).json({ error: "Pharmacy access required" });
    return false;
  }
  return true;
};

export const getPharmacyStats = asyncHandler(async (req, res) => {
  if (!requirePharmacy(req, res)) return;

  const pharmacyId = req.user?.userId;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [prescribedCount, prescriptionsThisWeek, pharmacyUser] = await Promise.all([
    Prescription.countDocuments({ status: "Prescribed" }),
    Prescription.countDocuments({ createdAt: { $gte: weekAgo } }),
    User.findById(pharmacyId).select("ratingSummary pharmacyProfile").lean(),
  ]);

  return res.status(200).json({
    availablePrescriptions: prescribedCount,
    prescriptionsThisWeek,
    averageRating: pharmacyUser?.ratingSummary?.averageRating || 0,
    totalRatings: pharmacyUser?.ratingSummary?.totalRatings || 0,
    verified: pharmacyUser?.pharmacyProfile?.verified || false,
    operatingHours: pharmacyUser?.pharmacyProfile?.operatingHours || null,
    services: pharmacyUser?.pharmacyProfile?.services || [],
  });
});

export const getPharmacyPrescriptions = asyncHandler(async (req, res) => {
  if (!requirePharmacy(req, res)) return;

  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
  const skip  = (page - 1) * limit;
  const status = req.query.status || "Prescribed";

  const [prescriptions, total] = await Promise.all([
    Prescription.find({ status })
      .populate("patientId", "name email profilePic")
      .populate("doctorId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Prescription.countDocuments({ status }),
  ]);

  return res.status(200).json({ prescriptions, total, page, limit });
});
