/**
 * JWT helpers.
 * Keep signing/verifying in one place.
 */
const jwt = require("jsonwebtoken");
const AppError = require("./appError");
const errorCodes = require("../constants/errorCodes");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/env");

/**
 * Keep payload minimal. You can extend this later if needed.
 */
function signToken(user) {
  if (!JWT_SECRET) {
    throw new AppError("JWT secret is not configured", 500, errorCodes.INTERNAL_SERVER_ERROR, false);
  }

  const payload = {
    sub: String(user._id),
    email: user.email,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  if (!JWT_SECRET) {
    throw new AppError("JWT secret is not configured", 500, errorCodes.INTERNAL_SERVER_ERROR, false);
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    throw new AppError("Unauthorized", 401, errorCodes.UNAUTHORIZED, true);
  }
}

module.exports = { signToken, verifyToken };