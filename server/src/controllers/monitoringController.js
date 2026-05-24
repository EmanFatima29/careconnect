import { asyncHandler } from "../middleware/errorHandler.js";
import { sendSuccess, sendError } from "../../utils/responseHandler.js";
import logger from "../../lib/logger.js";
import {
  processAndSaveMedia,
  getUserMedia,
  formatMediaResponse,
} from "../services/mediaService.js";
import Prescription from "../models/prescriptionModel.js";
import { detectPrescriptionDisease } from "../services/symptomAnalysisService.js";
import { getFieldHealth } from "../services/diagnosticService.js";

/**
 * POST /api/monitoring/upload
 * Upload a ward monitoring image to Cloudinary with responsive variants.
 * Saves media to MongoDB linked to the uploading user.
 */
export const uploadMonitoringImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendError(res, "No image file provided", 400);
  }

  const userId = req.user?.userId;
  if (!userId) {
    return sendError(res, "Unauthorized", 401);
  }

  try {
    const mediaResult = await processAndSaveMedia({
      file: req.file,
      userId,
      context: "monitoring",
      relatedTo: { model: "User", id: userId },
    });

    logger.log(
      `[Monitoring] Uploaded image for user ${userId}: ${mediaResult.originalName}`,
    );

    return sendSuccess(res, formatMediaResponse(mediaResult));
  } catch (error) {
    logger.error("[Monitoring] Upload failed:", error);
    return sendError(res, "Failed to process upload", 500);
  }
});

/**
 * GET /api/monitoring/images
 * Get all monitoring images for the current user.
 */
export const getMonitoringImages = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return sendError(res, "Unauthorized", 401);
  }

  try {
    const limit = parseInt(req.query.limit) || 50;
    const images = await getUserMedia(userId, "monitoring", limit);
    return sendSuccess(res, {
      images: images.map(formatMediaResponse),
      total: images.length,
    });
  } catch (error) {
    logger.error("[Monitoring] Failed to fetch images:", error);
    return sendError(res, "Failed to fetch images", 500);
  }
});

/**
 * POST /api/monitoring/analyze-disease/:prescriptionId
 * Analyze uploaded image for prescription diseases using Agent Prescription API (free).
 */
export const analyzePrescriptionDisease = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return sendError(res, "Unauthorized", 401);

  const { prescriptionId } = req.params;
  const imageUrl = req.body.imageUrl;
  if (!imageUrl) return sendError(res, "imageUrl is required", 400);

  try {
    const result = await detectCropDisease(imageUrl);
    if (!result) return sendError(res, "Disease detection service unavailable", 503);

    // Update prescription health history
    if (prescriptionId) {
      await Prescription.findByIdAndUpdate(prescriptionId, {
        $push: {
          healthHistory: {
            date: new Date(),
            diseaseDetected: result.disease,
            confidence: result.confidence,
            recommendations: result.treatment ? [result.treatment] : [],
            source: "photo",
          },
        },
        $set: {
          "currentHealth.status": result.disease ? "stressed" : "healthy",
          "currentHealth.lastChecked": new Date(),
        },
      });
    }

    return sendSuccess(res, result);
  } catch (error) {
    logger.error("[Monitoring] Disease analysis failed:", error);
    return sendError(res, "Analysis failed", 500);
  }
});

/**
 * GET /api/monitoring/diagnostic/:prescriptionId
 * Get diagnostic health data from Sentinel GreenReport Plus (free).
 */
export const getSatelliteData = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return sendError(res, "Unauthorized", 401);

  const prescription = await Prescription.findById(req.params.prescriptionId).lean();
  if (!prescription) return sendError(res, "Prescription not found", 404);

  const coords = prescription.location?.coordinates;
  if (!coords || (coords[0] === 0 && coords[1] === 0)) {
    return sendError(res, "Prescription location not set", 400);
  }

  const days = parseInt(req.query.days) || 30;

  try {
    const result = await getFieldHealth({
      latitude: coords[1],
      longitude: coords[0],
      prescriptionType: prescription.name?.toLowerCase(),
      days,
    });

    if (!result) return sendError(res, "Diagnostic service unavailable", 503);

    await Prescription.findByIdAndUpdate(req.params.prescriptionId, {
      $push: {
        healthHistory: {
          date: new Date(),
          vitals: result.currentNDVI,
          healthStatus: result.healthStatus,
          source: "diagnostic",
        },
      },
      $set: {
        "currentHealth.vitals": result.currentNDVI,
        "currentHealth.status": result.healthStatus,
        "currentHealth.lastChecked": new Date(),
      },
    });

    return sendSuccess(res, result);
  } catch (error) {
    logger.error("[Monitoring] Diagnostic data failed:", error);
    return sendError(res, "Diagnostic analysis failed", 500);
  }
});

/**
 * GET /api/monitoring/health-report/:prescriptionId
 * Unified prescription health report — combines diagnostic + symptom analysis history.
 */
export const getPatientHealthReport = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return sendError(res, "Unauthorized", 401);

  const prescription = await Prescription.findById(req.params.prescriptionId).lean();
  if (!prescription) return sendError(res, "Prescription not found", 404);

  return sendSuccess(res, {
    prescriptionId: prescription._id,
    name: prescription.name,
    dosage: prescription.dosage,
    area: prescription.area,
    status: prescription.status,
    currentHealth: prescription.currentHealth || {},
    healthHistory: (prescription.healthHistory || []).slice(-20),
  });
});
