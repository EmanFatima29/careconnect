import webPush from "web-push";
import PushSubscription from "../models/pushSubscriptionModel.js";
import logger from "../../lib/logger.js";

// Configure web-push with VAPID keys
// Generate keys once: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || "mailto:admin@careconnect.app";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  logger.log("[Push] VAPID keys configured");
} else {
  logger.warn(
    "[Push] VAPID keys not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars.",
  );
  logger.warn("[Push] Generate keys with: npx web-push generate-vapid-keys");
}

/**
 * Send a push notification to a specific user (all their subscriptions).
 * @param {string} userId - Target user ID
 * @param {object} payload - { title, body, icon?, url?, tag? }
 * @param {string} [category="chat"] - Notification category for preference check
 */
export async function sendPushNotification(userId, payload, category = "chat") {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    logger.warn("[Push] Skipping — VAPID keys not configured");
    return;
  }

  // Check user notification preferences
  try {
    const User = (await import("../models/userModel.js")).default;
    const user = await User.findById(userId).select("settings").lean();

    if (user?.settings?.pushNotifications === false) {
      logger.log("[Push] User has push disabled:", userId);
      return;
    }

    const prefMap = {
      chat: "chatNotifications",
      group: "groupNotifications",
      prescription: "prescriptionNotifications",
    };
    const prefKey = prefMap[category];
    if (prefKey && user?.settings?.[prefKey] === false) {
      logger.log(`[Push] User has ${category} notifications disabled:`, userId);
      return;
    }
  } catch (prefErr) {
    logger.warn("[Push] Could not check preferences, proceeding:", prefErr.message);
  }

  const subscriptions = await PushSubscription.find({
    userId,
    active: true,
  });

  if (subscriptions.length === 0) {
    logger.log("[Push] No active subscriptions for user:", userId);
    return;
  }

  const notificationPayload = JSON.stringify({
    title: payload.title || "CareConnect",
    body: payload.body || "",
    icon: payload.icon || "/images/icon-192.png",
    badge: "/images/badge-72.png",
    url: payload.url || "/home",
    tag: payload.tag || "default",
    timestamp: Date.now(),
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(sub.subscription, notificationPayload);
        logger.log("[Push] Sent to:", sub.subscription.endpoint.slice(0, 50));
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Subscription expired or unsubscribed — mark inactive
          logger.log("[Push] Removing expired subscription:", sub._id);
          await PushSubscription.findByIdAndUpdate(sub._id, { active: false });
        } else {
          logger.error("[Push] Send error:", err.statusCode, err.message);
        }
        throw err;
      }
    }),
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  logger.log(
    `[Push] Delivered ${sent}/${subscriptions.length} for user ${userId}`,
  );
}

/**
 * Send push notifications to multiple users.
 * @param {string[]} userIds
 * @param {object} payload
 * @param {string} [category="chat"] - Notification category for preference check
 */
export async function sendPushToMany(userIds, payload, category = "chat") {
  await Promise.allSettled(
    userIds.map((id) => sendPushNotification(id, payload, category)),
  );
}

export { VAPID_PUBLIC_KEY };
