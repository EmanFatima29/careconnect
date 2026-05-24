import express from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  getUserStatistics,
  getCropSummaries,
  getChatUsageStats,
  listActivityLogs,
  getPendingVerifications,
  verifyProfessional,
  rejectProfessional,
  getHealthcareStats,
} from "../controllers/adminController.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get("/stats/users",          getUserStatistics);
router.get("/stats/prescriptions",  getCropSummaries);
router.get("/stats/chats",          getChatUsageStats);
router.get("/activity-logs",        listActivityLogs);

// Healthcare admin
router.get("/pending-verifications",  getPendingVerifications);
router.get("/stats/healthcare",       getHealthcareStats);
router.patch("/verify/:userId",       verifyProfessional);
router.patch("/reject/:userId",       rejectProfessional);

export default router;
