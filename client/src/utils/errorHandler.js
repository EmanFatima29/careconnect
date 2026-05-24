import logger from "@/lib/logger";
/**
 * Error Handling Utilities
 * Comprehensive error handling patterns for analytics
 * Location: /client/src/utils/errorHandler.js
 */

/**
 * Handle fetch errors with comprehensive logging
 */
export const handleFetchError = (error, context = "") => {
  if (error.response) {
    // Server responded with error status
    logger.error(`[${context}] Server Error:`, {
      status: error.response.status,
      message: error.response.data?.message || error.message,
      data: error.response.data,
    });
    return (
      error.response.data?.message || `Server error: ${error.response.status}`
    );
  } else if (error.request) {
    // Request made but no response
    logger.error(`[${context}] Network Error:`, error.request);
    return "Network error: No response from server";
  } else if (error.message === "Request timeout") {
    // Custom timeout error
    logger.error(`[${context}] Timeout Error:`, error.message);
    return "Request timeout: Server took too long to respond";
  } else {
    // Other errors
    logger.error(`[${context}] Error:`, error.message);
    return error.message || "An unexpected error occurred";
  }
};

/**
 * Fetch with timeout
 */
export const fetchWithTimeout = (promise, timeoutMs = 5000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeoutMs),
    ),
  ]);
};

/**
 * Retry logic for failed requests
 */
export const retryFetch = async (
  fetchFn,
  maxRetries = 3,
  delayMs = 1000,
  context = "",
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.log(`[${context}] Attempt ${attempt}/${maxRetries}`);
      const result = await fetchWithTimeout(fetchFn());
      return result;
    } catch (error) {
      if (attempt === maxRetries) {
        // Last attempt failed
        throw error;
      }
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      logger.warn(
        `[${context}] Attempt ${attempt} failed, retrying...`,
        error.message,
      );
    }
  }
};

/**
 * Format error message for user display
 */
export const formatErrorMessage = (
  error,
  defaultMessage = "Something went wrong",
) => {
  if (typeof error === "string") {
    return error;
  }
  if (error?.message) {
    return error.message;
  }
  return defaultMessage;
};

/**
 * Create error context for debugging
 */
export const createErrorContext = (error, context = {}) => {
  return {
    timestamp: new Date().toISOString(),
    message: formatErrorMessage(error),
    context,
    stack: error?.stack,
  };
};

/**
 * Validate analytics data response
 */
export const validateAnalyticsData = (data, expectedStructure) => {
  if (!data) {
    throw new Error("No data received");
  }

  for (const key of Object.keys(expectedStructure)) {
    if (!(key in data)) {
      throw new Error(`Missing required ward: ${key}`);
    }
  }

  return true;
};

/**
 * Safe data accessor with fallback
 */
export const safeGet = (data, path, defaultValue = null) => {
  try {
    return (
      path.split(".").reduce((current, prop) => current?.[prop], data) ??
      defaultValue
    );
  } catch {
    return defaultValue;
  }
};

export default {
  handleFetchError,
  fetchWithTimeout,
  retryFetch,
  formatErrorMessage,
  createErrorContext,
  validateAnalyticsData,
  safeGet,
};
