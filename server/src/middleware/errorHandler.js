/**
 * Global Error Handling Middleware
 * Catches all errors and returns standardized format
 */

import { sendError } from "../../utils/responseHandler.js";
import logger from "../../lib/logger.js";

export const errorHandler = (err, req, res, next) => {
  logger.error("❌ Error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      ward: e.path,
      message: e.message,
    }));
    return sendError(res, "Validation failed", 400, errors);
  }

  // Mongoose Cast Error (Invalid ID)
  if (err.name === "CastError") {
    return sendError(res, `Invalid ${err.kind}: ${err.value}`, 400);
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const ward = Object.keys(err.keyValue)[0];
    return sendError(res, `${ward} already exists`, 409);
  }

  // JWT Errors
  if (err.name === "JsonWebTokenError") {
    return sendError(res, "Invalid token", 401);
  }

  if (err.name === "TokenExpiredError") {
    return sendError(res, "Token expired", 401);
  }

  // Zod Validation Error
  if (err.name === "ZodError") {
    const errors = err.errors.map((e) => ({
      ward: e.path.join("."),
      message: e.message,
    }));
    return sendError(res, "Validation failed", 400, errors);
  }

  // Custom API Errors
  if (err.statusCode) {
    return sendError(res, err.message, err.statusCode, err.errors || null);
  }

  // Generic Server Error
  return sendError(res, "Internal server error", 500);
};

/**
 * Async Handler to wrap async route handlers
 * Automatically catches errors and passes to error handler
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
