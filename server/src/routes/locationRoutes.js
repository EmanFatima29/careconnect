import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getLocationHistory,
  startSharing,
  stopSharing,
  updateLocation,
  getNearbyUsers,
} from "../controllers/locationController.js";

const router = express.Router();

// Protect all routes
router.use(requireAuth);

router.get("/history/:userId", getLocationHistory);
router.post("/start", startSharing);
router.post("/stop", stopSharing);
router.post("/update", updateLocation);
router.get("/nearby", getNearbyUsers);

export default router;
