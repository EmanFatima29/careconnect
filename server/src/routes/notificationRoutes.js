import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
} from "../controllers/notificationController.js";

const router = express.Router();

// Public — client needs VAPID key to subscribe
router.get("/vapid-public-key", getVapidPublicKey);

// Authenticated
router.post("/subscribe", requireAuth, subscribe);
router.delete("/unsubscribe", requireAuth, unsubscribe);

export default router;
