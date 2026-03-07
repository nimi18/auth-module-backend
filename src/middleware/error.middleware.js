// src/middleware/error.middleware.js
/**
 * Centralized Error Middleware
 * ----------------------------
 * Converts thrown errors into the enterprise error envelope:
 *
 * {
 *   success: false,
 *   error: {
 *     code: "ERROR_CODE",
 *     message: "Human readable message"
 *   }
 * }
 *
 * Internal errors are logged and sanitized before reaching the client.
 */

const logger = require("../config/logger");
const { sendError } = require("../utils/response.util");

function errorMiddleware(err, req, res, next) {
  if (res.headersSent) return next(err);

  const statusCode = err.statusCode || err.status || 500;
  const code =
    err.code || (statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "ERROR");

  if (statusCode >= 500 || !err.isPublic) {
    logger.error(err.message || "Unhandled error", { err });
  }

  const message = err.isPublic ? err.message : "Something went wrong";

  return sendError(res, {
    statusCode,
    code,
    message,
    meta: err.meta || null,
  });
}

module.exports = errorMiddleware;