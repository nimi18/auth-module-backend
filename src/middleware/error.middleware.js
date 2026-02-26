// src/middleware/error.middleware.js
const logger = require("../config/logger");
const { fail } = require("../utils/response.util");

/**
 * Central error handler (Enterprise response format)
 * Returns:
 *   { success:false, error:{ code, message } }
 */
function errorMiddleware(err, req, res, next) {
  if (res.headersSent) return next(err);

  const statusCode = err?.statusCode || err?.status || 500;
  const code =
    err?.code || (statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "ERROR");

  const isPublic = Boolean(err?.isPublic);
  const message = isPublic ? (err?.message || "Error") : "Something went wrong";

  // Log only server errors or non-public errors
  if (statusCode >= 500 || !isPublic) {
    logger.error(err?.message || "Unhandled error", { err });
  }

  return fail(res, { statusCode, code, message });
}

module.exports = errorMiddleware;