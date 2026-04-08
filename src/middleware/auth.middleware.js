// src/middleware/auth.middleware.js
/**
 * Authentication Middleware
 * -------------------------
 * - Extracts JWT
 * - Verifies token
 * - Checks Redis blacklist
 * - Attaches user to request
 */

const { verifyToken } = require("../utils/jwt.util");
const AppError = require("../utils/appError");
const {
  isTokenBlacklisted,
} = require("../services/tokenBlacklist.service");
const errorCodes = require("../constants/errorCodes");

async function requireAuth(req, res, next) {
  const header = String(req.headers.authorization || "");
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new AppError("Unauthorized", 401, "UNAUTHORIZED", true));
  }

  try {
    // ✅ NEW: check blacklist
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      return next(
        new AppError("Token is invalidated", 401, "TOKEN_BLACKLISTED", true)
      );
    }

    const payload = verifyToken(token);
    req.user = payload;

    return next();
  } catch (_err) {
    return next(new AppError("Token is invalidated",401,errorCodes.TOKEN_BLACKLISTED,true));
  }
}

module.exports = { requireAuth };