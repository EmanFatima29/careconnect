/**
 * Standardized Response Handler
 * All API responses should follow this format
 */

/**
 * Success Response Format:
 * {
 *   success: true,
 *   statusCode: 200,
 *   message: "Operation successful",
 *   data: {...} | [...] | null
 * }
 */
export const sendSuccess = (
  res,
  data = null,
  message = "Success",
  statusCode = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    data,
  });
};

/**
 * Error Response Format:
 * {
 *   success: false,
 *   statusCode: 400,
 *   message: "Error message",
 *   errors: [{ ward: "email", message: "Invalid email" }] | null
 * }
 */
export const sendError = (
  res,
  message = "Error",
  statusCode = 500,
  errors = null,
) => {
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: errors || null,
  });
};

/**
 * Validation Error Response
 */
export const sendValidationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    statusCode: 400,
    message: "Validation failed",
    errors: Array.isArray(errors) ? errors : [{ message: String(errors) }],
  });
};

/**
 * Not Found Response
 */
export const sendNotFound = (res, message = "Resource not found") => {
  return sendError(res, message, 404);
};

/**
 * Unauthorized Response
 */
export const sendUnauthorized = (res, message = "Unauthorized") => {
  return sendError(res, message, 401);
};

/**
 * Conflict Response (e.g., duplicate entry)
 */
export const sendConflict = (res, message = "Conflict") => {
  return sendError(res, message, 409);
};
