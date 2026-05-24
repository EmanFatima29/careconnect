import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { uploadMonitoring } from "../middleware/upload.js";
import {
  uploadMonitoringImage,
  getMonitoringImages,
  analyzePrescriptionDisease,
  getSatelliteData,
  getPatientHealthReport,
} from "../controllers/monitoringController.js";

const router = express.Router();

// POST /api/monitoring/upload — upload a single ward monitoring image
router.post(
  "/upload",
  requireAuth,
  uploadMonitoring.single("image"),
  uploadMonitoringImage,
);

// GET /api/monitoring/images — get all monitoring images for current user
router.get("/images", requireAuth, getMonitoringImages);

// Disease detection via Agent Prescription (free)
router.post("/analyze-disease/:prescriptionId", requireAuth, analyzePrescriptionDisease);

// Diagnostic health data via Sentinel GreenReport Plus (free)
router.get("/diagnostic/:prescriptionId", requireAuth, getSatelliteData);

// Unified health report
router.get("/health-report/:prescriptionId", requireAuth, getPatientHealthReport);

export default router;
