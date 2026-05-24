import { asyncHandler } from "../middleware/errorHandler.js";
import PushSubscription from "../models/pushSubscriptionModel.js";
import logger from "../../lib/logger.js";
import { VAPID_PUBLIC_KEY } from "../services/pushService.js";

/**
 * GET /api/notifications/vapid-public-key
 * Returns the VAPID public key for the client to subscribe.
 */
export const getVapidPublicKey = asyncHandler(async (req, res) => {
  if (!VAPID_PUBLIC_KEY) {
    return res.status(503).json({ error: "Push notifications not configured" });
  }
  return res.status(200).json({ publicKey: VAPID_PUBLIC_KEY });
});

/**
 * POST /api/notifications/subscribe
 * Register a push subscription for the authenticated user.
 */
export const subscribe = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  const { subscription } = req.body;

  if (
    !subscription?.endpoint ||
    !subscription?.keys?.p256dh ||
    !subscription?.keys?.auth
  ) {
    return res.status(400).json({ error: "Invalid push subscription object" });
  }

  // Upsert — update if same endpoint exists, otherwise create
  await PushSubscription.findOneAndUpdate(
    { userId, "subscription.endpoint": subscription.endpoint },
    {
      userId,
      subscription,
      userAgent: req.headers["user-agent"] || "",
      active: true,
    },
    { upsert: true, new: true },
  );

  logger.log("[Push] Subscription saved for user:", userId);
  return res.status(201).json({ message: "Subscription saved" });
});

/**
 * DELETE /api/notifications/unsubscribe
 * Remove a push subscription.
 */
export const unsubscribe = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  const { endpoint } = req.body;

  if (!endpoint) {
    return res.status(400).json({ error: "endpoint is required" });
  }

  await PushSubscription.findOneAndUpdate(
    { userId, "subscription.endpoint": endpoint },
    { active: false },
  );

  logger.log("[Push] Subscription deactivated for user:", userId);
  return res.status(200).json({ message: "Unsubscribed" });
});
