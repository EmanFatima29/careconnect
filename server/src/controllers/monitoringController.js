import { asyncHandler } from "../middleware/errorHandler.js";
import { sendSuccess, sendError } from "../../utils/responseHandler.js";
import logger from "../../lib/logger.js";
import {
  processAndSaveMedia,
  getUserMedia,
  formatMediaResponse,
} from "../services/mediaService.js";
import Prescription from "../models/prescriptionModel.js";
import { detectPrescriptionDisease, analyzeSymptoms } from "../services/symptomAnalysisService.js";
import { getFieldHealth, assessPatientVitals, calculateBMI } from "../services/diagnosticService.js";

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
 * Submit prescription image for review (automated analysis placeholder).
 */
export const analyzePrescriptionDisease = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return sendError(res, "Unauthorized", 401);

  const { prescriptionId } = req.params;
  const imageUrl = req.body.imageUrl;
  if (!imageUrl) return sendError(res, "imageUrl is required", 400);

  try {
    const result = await detectPrescriptionDisease(imageUrl, req.body.notes);

    if (prescriptionId) {
      await Prescription.findByIdAndUpdate(prescriptionId, {
        $push: {
          healthHistory: {
            date: new Date(),
            symptomAnalysis: "Image submitted for review",
            recommendations: ["Awaiting doctor review"],
            source: "photo",
          },
        },
        $set: { "currentHealth.lastChecked": new Date() },
      });
    }

    return sendSuccess(res, result);
  } catch (error) {
    logger.error("[Monitoring] Image analysis failed:", error);
    return sendError(res, "Analysis failed", 500);
  }
});

/**
 * GET /api/monitoring/diagnostic/:prescriptionId
 * Get health data derived from stored prescription health history.
 */
export const getSatelliteData = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return sendError(res, "Unauthorized", 401);

  const prescription = await Prescription.findById(req.params.prescriptionId).lean();
  if (!prescription) return sendError(res, "Prescription not found", 404);

  try {
    const result = await getFieldHealth({ prescriptionRecord: prescription });
    if (!result) return sendError(res, "Diagnostic data unavailable", 503);
    return sendSuccess(res, result);
  } catch (error) {
    logger.error("[Monitoring] Diagnostic data failed:", error);
    return sendError(res, "Diagnostic analysis failed", 500);
  }
});

/**
 * POST /api/monitoring/analyze-symptoms
 * Analyze patient-reported symptoms against a healthcare knowledge base.
 */
export const analyzePatientSymptoms = asyncHandler(async (req, res) => {
  const { symptoms, age, gender } = req.body;
  if (!Array.isArray(symptoms) || symptoms.length === 0) {
    return sendError(res, "symptoms array is required", 400);
  }
  const result = analyzeSymptoms({ symptoms, age, gender });
  return sendSuccess(res, result);
});

/**
 * POST /api/monitoring/assess-vitals
 * Assess patient vital signs and return a health score.
 */
export const assessVitals = asyncHandler(async (req, res) => {
  const { heartRate, systolic, diastolic, temperature, oxygenSaturation, weightKg, heightCm } = req.body;
  const bmi = calculateBMI(weightKg, heightCm);
  const result = assessPatientVitals({ heartRate, systolic, diastolic, temperature, oxygenSaturation, bmi });
  return sendSuccess(res, { ...result, bmi });
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
