import express from "express";
import { authenticate } from "../middleware/auth.js";
import { getPharmacyStats, getPharmacyPrescriptions } from "../controllers/pharmacyController.js";

const router = express.Router();

router.get("/stats",         authenticate, getPharmacyStats);
router.get("/prescriptions", authenticate, getPharmacyPrescriptions);

export default router;
