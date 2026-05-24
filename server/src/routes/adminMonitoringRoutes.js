import express from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  getMapData,
  getFieldAnalysis,
  getPatientDetails,
} from "../controllers/adminMonitoringController.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get("/map-data", getMapData);
router.get("/prescription/:prescriptionId", getFieldAnalysis);
router.get("/patient/:userId", getPatientDetails);

export default router;
