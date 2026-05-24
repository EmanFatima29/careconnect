import api from "./api";
import logger from "./logger";

/**
 * Push notification client utilities.
 * Handles service worker registration, subscription management,
 * and permission requests.
 */

let swRegistration = null;

/**
 * Check if push notifications are supported in this browser.
 */
export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Register the push service worker.
 * @returns {ServiceWorkerRegistration | null}
 */
export async function registerServiceWorker() {
  if (!isPushSupported()) {
    logger.warn("[Push] Push notifications not supported");
    return null;
  }

  try {
    swRegistration = await navigator.serviceWorker.register("/sw-push.js", {
      scope: "/",
    });
    logger.log("[Push] Service worker registered");
    return swRegistration;
  } catch (err) {
    logger.error("[Push] Service worker registration failed:", err);
    return null;
  }
}

/**
 * Get the VAPID public key from the server.
 */
async function getVapidPublicKey() {
  const res = await api.get("/api/notifications/vapid-public-key");
  return res.data.publicKey;
}

/**
 * Convert a URL-safe base64 string to a Uint8Array (for applicationServerKey).
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

/**
 * Subscribe the user to push notifications.
 * Requests notification permission if not already granted.
 * @returns {{ success: boolean, subscription?: PushSubscription }}
 */
export async function subscribeToPush() {
  if (!isPushSupported()) {
    return { success: false, reason: "not-supported" };
  }

  // Request permission
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    logger.log("[Push] Permission denied:", permission);
    return { success: false, reason: "permission-denied" };
  }

  try {
    const registration = swRegistration || (await registerServiceWorker());
    if (!registration) {
      return { success: false, reason: "sw-failed" };
    }

    const vapidPublicKey = await getVapidPublicKey();
    if (!vapidPublicKey) {
      return { success: false, reason: "no-vapid-key" };
    }

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      logger.log("[Push] New subscription created");
    } else {
      logger.log("[Push] Using existing subscription");
    }

    // Send subscription to server
    await api.post("/api/notifications/subscribe", {
      subscription: subscription.toJSON(),
    });

    logger.log("[Push] Subscription saved to server");
    return { success: true, subscription };
  } catch (err) {
    logger.error("[Push] Subscription failed:", err);
    return { success: false, reason: "error", error: err.message };
  }
}

/**
 * Unsubscribe from push notifications.
 */
export async function unsubscribeFromPush() {
  if (!swRegistration) return;

  try {
    const subscription = await swRegistration.pushManager.getSubscription();
    if (subscription) {
      await api.delete("/api/notifications/unsubscribe", {
        data: { endpoint: subscription.endpoint },
      });
      await subscription.unsubscribe();
      logger.log("[Push] Unsubscribed successfully");
    }
  } catch (err) {
    logger.error("[Push] Unsubscribe error:", err);
  }
}

/**
 * Get current push notification permission status.
 * @returns {"granted" | "denied" | "default" | "unsupported"}
 */
export function getPushPermissionStatus() {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}
