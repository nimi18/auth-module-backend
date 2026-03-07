// src/utils/response.util.js
/**
 * Response Utility
 * ----------------
 * Centralizes the enterprise response envelope used across the service.
 *
 * Success response shape:
 * {
 *   success: true,
 *   data: { ... }
 * }
 *
 * Error response shape:
 * {
 *   success: false,
 *   error: {
 *     code: "ERROR_CODE",
 *     message: "Human readable message",
 *     ...(optional meta)
 *   }
 * }
 *
 * Why this exists:
 * - Keeps controllers thin and consistent
 * - Makes frontend/API client integration predictable
 * - Ensures tests and runtime share the same contract
 */

function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

function sendError(
  res,
  {
    statusCode = 500,
    code = "INTERNAL_SERVER_ERROR",
    message = "Something went wrong",
    meta = null,
  }
) {
  const error = { code, message };

  if (meta) {
    error.meta = meta;
  }

  return res.status(statusCode).json({
    success: false,
    error,
  });
}

module.exports = {
  sendSuccess,
  sendError,
};