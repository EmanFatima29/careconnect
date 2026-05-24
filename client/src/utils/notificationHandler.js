import logger from "@/lib/logger";
/**
 * Notification System Utilities
 * Location: /client/src/utils/notificationHandler.js
 * Handles notifications for analytics events
 *
 * Note: Requires notistack or similar notification library
 * Install: npm install notistack
 */

/**
 * Toast notification types
 */
export const TOAST_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
};

/**
 * Predefined notification messages
 */
export const NOTIFICATION_MESSAGES = {
  // Success
  ANALYTICS_LOADED: "Analytics data loaded successfully",
  DATA_REFRESHED: "Analytics data refreshed",
  EXPORT_SUCCESS: "Analytics exported successfully",
  SETTINGS_SAVED: "Settings saved successfully",

  // Errors
  ANALYTICS_LOAD_FAILED: "Failed to load analytics data",
  DATA_REFRESH_FAILED: "Failed to refresh analytics data",
  EXPORT_FAILED: "Failed to export analytics",
  SETTINGS_SAVE_FAILED: "Failed to save settings",
  NETWORK_ERROR: "Network error: Please check your connection",
  TIMEOUT_ERROR: "Request timeout: Server took too long to respond",

  // Warnings
  NO_DATA: "No data available",
  PARTIAL_DATA: "Some data could not be loaded",
  RETRYING: "Retrying request",
};

/**
 * Create notification utility class (when using notistack)
 * Usage in component:
 *
 * import { useSnackbar } from 'notistack';
 * const { enqueueSnackbar } = useSnackbar();
 * createNotification(enqueueSnackbar, 'ANALYTICS_LOADED');
 */
export const createNotification = (
  enqueueSnackbar,
  messageKey,
  customMessage = null,
) => {
  const message = customMessage || NOTIFICATION_MESSAGES[messageKey];
  const variant =
    messageKey.includes("FAILED") || messageKey.includes("ERROR")
      ? TOAST_TYPES.ERROR
      : messageKey.includes("RETRYING") || messageKey.includes("PARTIAL")
        ? TOAST_TYPES.WARNING
        : TOAST_TYPES.SUCCESS;

  if (enqueueSnackbar) {
    enqueueSnackbar(message, {
      variant,
      anchorOrigin: {
        vertical: "bottom",
        horizontal: "right",
      },
      autoHideDuration: variant === TOAST_TYPES.ERROR ? 6000 : 4000,
    });
  } else {
    logger.log(`[Notification] ${variant}: ${message}`);
  }
};

/**
 * Notification hooks pattern for React components
 * Usage in component:
 *
 * const { notify, notifySuccess, notifyError, notifyLoading } = useNotifications();
 * notifySuccess('Data loaded!');
 */
export const createNotificationHooks = (enqueueSnackbar) => {
  return {
    // Generic notification
    notify: (message, variant = TOAST_TYPES.INFO) => {
      createNotification(enqueueSnackbar, null, message);
    },

    // Success notification
    notifySuccess: (message = NOTIFICATION_MESSAGES.SETTINGS_SAVED) => {
      if (enqueueSnackbar) {
        enqueueSnackbar(message, { variant: TOAST_TYPES.SUCCESS });
      }
    },

    // Error notification
    notifyError: (
      message = NOTIFICATION_MESSAGES.SETTINGS_SAVE_FAILED,
      error = null,
    ) => {
      const fullMessage = error ? `${message}: ${error}` : message;
      if (enqueueSnackbar) {
        enqueueSnackbar(fullMessage, {
          variant: TOAST_TYPES.ERROR,
          autoHideDuration: 6000,
        });
      } else {
        logger.error(`[Notification Error] ${fullMessage}`);
      }
    },

    // Warning notification
    notifyWarning: (message = NOTIFICATION_MESSAGES.PARTIAL_DATA) => {
      if (enqueueSnackbar) {
        enqueueSnackbar(message, { variant: TOAST_TYPES.WARNING });
      }
    },

    // Loading notification (progress)
    notifyLoading: (message = "Loading...") => {
      if (enqueueSnackbar) {
        enqueueSnackbar(message, {
          variant: TOAST_TYPES.INFO,
          persist: true,
        });
      }
    },
  };
};

/**
 * Notification system for analytics operations
 * Standalone usage without notistack
 */
export class NotificationCenter {
  constructor() {
    this.notifications = [];
    this.listeners = [];
  }

  /**
   * Subscribe to notification changes
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Emit notification to all listeners
   */
  emit(notification) {
    this.notifications.push({
      ...notification,
      id: Date.now(),
      timestamp: new Date(),
    });
    this.listeners.forEach((listener) => listener(notification));
  }

  /**
   * Show success notification
   */
  success(message) {
    this.emit({
      type: TOAST_TYPES.SUCCESS,
      message,
    });
  }

  /**
   * Show error notification
   */
  error(message, error = null) {
    const fullMessage = error ? `${message}: ${error}` : message;
    this.emit({
      type: TOAST_TYPES.ERROR,
      message: fullMessage,
    });
  }

  /**
   * Show warning notification
   */
  warning(message) {
    this.emit({
      type: TOAST_TYPES.WARNING,
      message,
    });
  }

  /**
   * Show info notification
   */
  info(message) {
    this.emit({
      type: TOAST_TYPES.INFO,
      message,
    });
  }

  /**
   * Clear all notifications
   */
  clear() {
    this.notifications = [];
    this.listeners.forEach((listener) =>
      listener({ type: "clear", message: "" }),
    );
  }

  /**
   * Get all notifications
   */
  getAll() {
    return this.notifications;
  }
}

/**
 * Global notification center instance
 */
export const notificationCenter = new NotificationCenter();

/**
 * Notification patterns helper
 */
export const notificationPatterns = {
  /**
   * Handle API call with notifications
   */
  async withNotifications(
    asyncFn,
    { onSuccess, onError, onLoading, successMsg, errorMsg },
  ) {
    try {
      if (onLoading) onLoading();
      const result = await asyncFn();
      if (onSuccess) onSuccess(result);
      notificationCenter.success(
        successMsg || NOTIFICATION_MESSAGES.SETTINGS_SAVED,
      );
      return result;
    } catch (error) {
      if (onError) onError(error);
      notificationCenter.error(
        errorMsg || NOTIFICATION_MESSAGES.SETTINGS_SAVE_FAILED,
        error.message,
      );
      throw error;
    }
  },

  /**
   * Retry operation with notifications
   */
  async withRetry(asyncFn, maxRetries = 3, delayMs = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await asyncFn();
      } catch (error) {
        if (attempt === maxRetries) {
          notificationCenter.error(
            `Failed after ${maxRetries} attempts`,
            error.message,
          );
          throw error;
        }
        notificationCenter.warning(
          `${NOTIFICATION_MESSAGES.RETRYING} (${attempt}/${maxRetries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  },
};

export default {
  TOAST_TYPES,
  NOTIFICATION_MESSAGES,
  createNotification,
  createNotificationHooks,
  NotificationCenter,
  notificationCenter,
  notificationPatterns,
};
