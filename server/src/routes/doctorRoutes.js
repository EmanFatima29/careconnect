import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  getDoctorPatients,
  getDoctorStats,
  getDoctorPrescriptions,
} from "../controllers/doctorController.js";

const router = express.Router();

router.get("/patients",       authenticate, getDoctorPatients);
router.get("/stats",          authenticate, getDoctorStats);
router.get("/prescriptions",  authenticate, getDoctorPrescriptions);

export default router;
