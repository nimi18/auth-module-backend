// src/middleware/auth.middleware.js
/**
 * Authentication Middleware
 * -------------------------
 * Extracts and verifies JWT from Authorization header:
 *
 * Authorization: Bearer <token>
 *
 * On success:
 * - attaches decoded payload to req.user
 *
 * On failure:
 * - forwards standardized AppError to error middleware
 */

const { verifyToken } = require("../utils/jwt.util");
const AppError = require("../utils/appError");

function requireAuth(req, res, next) {
  const header = String(req.headers.authorization || "");
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new AppError("Unauthorized", 401, "UNAUTHORIZED", true));
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    return next();
  } catch (_err) {
    return next(new AppError("Unauthorized", 401, "UNAUTHORIZED", true));
  }
}

module.exports = { requireAuth };