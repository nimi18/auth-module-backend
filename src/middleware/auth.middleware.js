// src/middleware/auth.middleware.js
/**
 * Auth Middleware
 * ---------------
 * Validates Bearer token and attaches decoded user payload to req.user
 *
 * Error response is handled by error.middleware.js
 */

const { verifyToken } = require("../utils/jwt.util");
const AppError = require("../utils/appError");

function requireAuth(req, res, next) {
  try {
    const header = String(req.headers?.authorization || "");
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED", true);
    }

    const payload = verifyToken(token);
    req.user = payload;

    return next();
  } catch (e) {
    return next(new AppError("Unauthorized", 401, "UNAUTHORIZED", true));
  }
}

module.exports = { requireAuth };