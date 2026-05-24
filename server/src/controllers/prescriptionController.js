import { asyncHandler } from "../middleware/errorHandler.js";
import mongoose from "mongoose";
import { z } from "zod";
import Prescription from "../models/prescriptionModel.js";
import User from "../models/userModel.js";
import { logActivity } from "../services/activityLogService.js";
import { sendPushNotification } from "../services/pushService.js";
import logger from "../../lib/logger.js";

const isAdminRole = (role) => role === "admin" || role === "superadmin";

const createPrescriptionSchema = z
  .object({
    name: z.string().min(1).max(120),
    dosage: z.string().max(120).optional().default(""),
    duration: z.union([z.number(), z.string()]).optional(),
    startDate: z.union([z.string(), z.date()]).optional(),
    status: z.enum(["Prescribed", "Active", "Completed", "Archived"]).optional(),
    notes: z.string().max(2000).optional().default(""),
    // Admin-only override
    ownerId: z.string().optional(),
  })
  .strict();

const updatePrescriptionSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    dosage: z.string().max(120).optional(),
    duration: z.union([z.number(), z.string(), z.null()]).optional(),
    startDate: z.union([z.string(), z.date(), z.null()]).optional(),
    status: z.enum(["Prescribed", "Active", "Completed", "Archived"]).optional(),
    notes: z.string().max(2000).optional(),
  })
  .strict();

function coerceDuration(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === "number") return value;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  if (Number.isNaN(num)) throw new Error("Invalid duration");
  return num;
}

function coerceDate(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value instanceof Date) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid startDate");
  return d;
}

function getRequester(req) {
  return {
    userId: req.user?.userId,
    email: req.user?.email,
    role: req.user?.roles,
    isAdmin: isAdminRole(req.user?.roles),
  };
}

export const listPrescriptions = asyncHandler(async (req, res) => {
  try {
    const { userId, isAdmin } = getRequester(req);
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const limitRaw = req.query.limit;
    const pageRaw = req.query.page;
    const limit = Math.max(1, Math.min(parseInt(limitRaw, 10) || 50, 100));
    const page = Math.max(1, parseInt(pageRaw, 10) || 1);
    const skip = (page - 1) * limit;

    const query = {};
    if (isAdmin && req.query.all === "true") {
      // Admin can view all prescriptions across all users
    } else if (isAdmin && typeof req.query.userId === "string") {
      if (!mongoose.Types.ObjectId.isValid(req.query.userId)) {
        return res.status(400).json({ error: "Invalid userId" });
      }
      query.ownerId = req.query.userId;
    } else {
      query.ownerId = userId;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const total = await Prescription.countDocuments(query);
    const prescriptions = await Prescription.find(query)
      .populate("ownerId", "name email profilePic")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.status(200).json({ prescriptions, page, limit, total });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export const getPrescriptionById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, isAdmin } = getRequester(req);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid prescription id" });
    }

    const prescription = await Prescription.findById(id).lean();
    if (!prescription) return res.status(404).json({ error: "Prescription not found" });

    if (!isAdmin && String(prescription.ownerId) !== String(userId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return res.status(200).json(prescription);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export const getPrescriptionsByUser = asyncHandler(async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const { userId: currentUserId, isAdmin } = getRequester(req);

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    // Only allow users to fetch their own prescriptions or admins to fetch any user's prescriptions
    if (!isAdmin && String(currentUserId) !== String(targetUserId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const limitRaw = req.query.limit;
    const pageRaw = req.query.page;
    const limit = Math.max(1, Math.min(parseInt(limitRaw, 10) || 50, 100));
    const page = Math.max(1, parseInt(pageRaw, 10) || 1);
    const skip = (page - 1) * limit;

    const prescriptions = await Prescription.find({ ownerId: targetUserId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.status(200).json({ prescriptions, page, limit });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export const createPrescription = asyncHandler(async (req, res) => {
  try {
    const { userId, isAdmin } = getRequester(req);
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const parsed = createPrescriptionSchema.parse(req.body);

    const ownerId = (() => {
      if (isAdmin && parsed.ownerId) return parsed.ownerId;
      return userId;
    })();

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ error: "Invalid ownerId" });
    }

    const duration = coerceDuration(parsed.duration);
    const startDate = coerceDate(parsed.startDate);

    const prescription = await Prescription.create({
      ownerId,
      name: parsed.name,
      dosage: parsed.dosage,
      duration: duration === undefined ? null : duration,
      startDate: startDate === undefined ? null : startDate,
      status: parsed.status || "Prescribed",
      notes: parsed.notes,
    });

    await User.updateOne({ _id: ownerId }, { $addToSet: { prescriptions: prescription._id } });

    await logActivity({
      req,
      action: "prescription.create",
      entityType: "Prescription",
      entityId: prescription._id,
      metadata: { ownerId },
    });

    // Notify owner if an admin created a prescription on their behalf
    if (isAdmin && String(ownerId) !== String(userId)) {
      sendPushNotification(
        String(ownerId),
        {
          title: "New Prescription Added",
          body: `A new prescription "${prescription.name}" was added to your account`,
          url: "/prescriptions",
          tag: `prescription-${prescription._id}`,
        },
        "prescription",
      ).catch((err) => logger.error("[Push] prescription create error:", err));
    }

    return res.status(201).json({ prescription });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        issues: error.errors.map((e) => ({
          ward: e.path.join("."),
          message: e.message,
        })),
      });
    }
    return res.status(400).json({ error: error.message });
  }
});

export const updatePrescription = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, isAdmin } = getRequester(req);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid prescription id" });
    }

    const prescription = await Prescription.findById(id);
    if (!prescription) return res.status(404).json({ error: "Prescription not found" });

    if (!isAdmin && String(prescription.ownerId) !== String(userId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const parsed = updatePrescriptionSchema.parse(req.body);

    if ("duration" in parsed) {
      prescription.duration = coerceDuration(parsed.duration);
    }
    if ("startDate" in parsed) {
      prescription.startDate = coerceDate(parsed.startDate);
    }
    if (typeof parsed.name === "string") prescription.name = parsed.name;
    if (typeof parsed.dosage === "string") prescription.dosage = parsed.dosage;
    if (typeof parsed.status === "string") prescription.status = parsed.status;
    if (typeof parsed.notes === "string") prescription.notes = parsed.notes;

    await prescription.save();

    await logActivity({
      req,
      action: "prescription.update",
      entityType: "Prescription",
      entityId: prescription._id,
      metadata: { ownerId: prescription.ownerId },
    });

    // Notify owner if an admin updated their prescription
    if (isAdmin && String(prescription.ownerId) !== String(userId)) {
      sendPushNotification(
        String(prescription.ownerId),
        {
          title: "Prescription Updated",
          body: `Your prescription "${prescription.name}" was updated`,
          url: "/prescriptions",
          tag: `prescription-updated-${prescription._id}`,
        },
        "prescription",
      ).catch((err) => logger.error("[Push] prescription update error:", err));
    }

    return res.status(200).json({ prescription });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        issues: error.errors.map((e) => ({
          ward: e.path.join("."),
          message: e.message,
        })),
      });
    }
    return res.status(400).json({ error: error.message });
  }
});

export const deletePrescription = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, isAdmin } = getRequester(req);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid prescription id" });
    }

    const prescription = await Prescription.findById(id);
    if (!prescription) return res.status(404).json({ error: "Prescription not found" });

    if (!isAdmin && String(prescription.ownerId) !== String(userId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await Prescription.deleteOne({ _id: id });
    await User.updateOne({ _id: prescription.ownerId }, { $pull: { prescriptions: prescription._id } });

    await logActivity({
      req,
      action: "prescription.delete",
      entityType: "Prescription",
      entityId: prescription._id,
      metadata: { ownerId: prescription.ownerId },
    });

    // Notify owner if an admin deleted their prescription
    if (isAdmin && String(prescription.ownerId) !== String(userId)) {
      sendPushNotification(
        String(prescription.ownerId),
        {
          title: "Prescription Deleted",
          body: `Your prescription "${prescription.name}" was deleted`,
          url: "/prescriptions",
          tag: `prescription-deleted-${prescription._id}`,
        },
        "prescription",
      ).catch((err) => logger.error("[Push] prescription delete error:", err));
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
