import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createVisit,
  getVisits,
  getVisitById,
  getVisitAnalytics,
} from "../controllers/visitController.js";

const router = express.Router();

router.post("/", requireAuth, createVisit);
router.get("/analytics", requireAuth, getVisitAnalytics);
router.get("/:id", requireAuth, getVisitById);
router.get("/", requireAuth, getVisits);

export default router;
