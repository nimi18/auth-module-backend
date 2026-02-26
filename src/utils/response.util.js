// src/utils/response.util.js
/**
 * Response helpers (Enterprise response format)
 *
 * Success:
 *   { success: true, data: {...} }
 *
 * Error:
 *   { success: false, error: { code, message } }
 */

function ok(res, data = {}, status = 200) {
  return res.status(status).json({
    success: true,
    data,
  });
}

function fail(res, { statusCode = 500, code = "INTERNAL_SERVER_ERROR", message = "Something went wrong" } = {}) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

module.exports = { ok, fail };