// src/utils/appError.js

/**
 * Enterprise-friendly application error.
 *
 * Usage:
 *   throw new AppError("Email already exists", 400, "EMAIL_EXISTS", true)
 *
 * - message: client-safe message (if isPublic=true)
 * - statusCode: HTTP status code
 * - code: stable machine-readable error code
 * - isPublic: whether message should be returned to client
 * - meta: optional details (avoid leaking in production unless needed)
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_SERVER_ERROR", isPublic = false, meta = null) {
    super(message || "Error");

    this.name = "AppError";
    this.statusCode = Number(statusCode) || 500;
    this.code = code || (this.statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "ERROR");
    this.isPublic = Boolean(isPublic);
    this.meta = meta || null;

    Error.captureStackTrace?.(this, AppError);
  }
}

module.exports = AppError;