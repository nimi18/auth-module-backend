// src/services/auth.service.js
/**
 * Auth Service
 * ------------
 * Responsibilities:
 * - Signup (local)
 * - Login (local)
 * - Forgot Password
 * - Reset Password
 */

const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userRepo = require("../repositories/user.repo");
const resetRepo = require("../repositories/resetToken.repo");
const refreshRepo = require("../repositories/refreshToken.repo");

const AppError = require("../utils/appError");
const { signToken } = require("../utils/jwt.util");
const { sendPasswordResetEmail } = require("./mailer.service");

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const BCRYPT_ROUNDS = 10;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function validatePassword(password) {
  const p = String(password || "");

  if (p.length < 8) return false;
  if (!/[A-Z]/.test(p)) return false;
  if (!/[a-z]/.test(p)) return false;
  if (!/[0-9]/.test(p)) return false;
  if (!/[^A-Za-z0-9]/.test(p)) return false;

  return true;
}

async function findUserByEmail(email) {
  const result = await userRepo.findByEmail(email);

  if (!result) return null;
  if (Array.isArray(result)) return result[0] || null;

  return result;
}

function getStoredPasswordHash(user) {
  if (!user) return null;

  if (typeof user.passwordHash === "string" && user.passwordHash.trim()) {
    return user.passwordHash;
  }

  if (typeof user.password === "string" && user.password.trim()) {
    return user.password;
  }

  return null;
}

async function getUserById(userId) {
  if (!userId) return null;

  if (typeof userRepo.findById === "function") {
    return userRepo.findById(userId);
  }

  try {
    const User = require("../models/user.model");
    return await User.findById(userId);
  } catch (_) {
    return null;
  }
}

async function invalidateOldResetTokens(userId) {
  if (!userId) return;

  if (typeof resetRepo.deleteAllForUser === "function") {
    await resetRepo.deleteAllForUser(userId);
    return;
  }

  if (typeof resetRepo.deleteManyForUser === "function") {
    await resetRepo.deleteManyForUser(userId);
    return;
  }

  if (typeof resetRepo.invalidateAllForUser === "function") {
    await resetRepo.invalidateAllForUser(userId);
    return;
  }

  try {
    const ResetToken = require("../models/passwordResetToken.model");
    await ResetToken.updateMany(
      { userId, used: false },
      { $set: { used: true } }
    );
  } catch (_) {}
}

function generateRefreshToken() {
  return crypto.randomBytes(40).toString("hex");
}

async function signup(payload) {
  const name = String(payload?.name || "").trim();
  const email = normalizeEmail(payload?.email);
  const password = String(payload?.password || "");

  if (!name || !email || !password) {
    throw new AppError(
      "Name, email and password are required",
      400,
      "VALIDATION_ERROR",
      true
    );
  }

  if (!validatePassword(password)) {
    throw new AppError(
      "Password does not meet requirements",
      400,
      "VALIDATION_ERROR",
      true
    );
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new AppError("Email already exists", 400, "EMAIL_EXISTS", true);
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await userRepo.createUser({
    name,
    email,
    passwordHash: hashedPassword,
    password: hashedPassword,
    providers: []
  });

  const token = signToken(user);

  return { user, token };
}

async function login(payload) {
  const email = normalizeEmail(payload?.email);
  const password = String(payload?.password || "");

  if (!email || !password) {
    throw new AppError(
      "Email and password are required",
      400,
      "VALIDATION_ERROR",
      true
    );
  }

  const user = await findUserByEmail(email);
  const storedHash = getStoredPasswordHash(user);

  if (!user || !storedHash) {
    throw new AppError(
      "Invalid credentials",
      400,
      "INVALID_CREDENTIALS",
      true
    );
  }

  const passwordMatches = await bcrypt.compare(password, storedHash);

  if (!passwordMatches) {
    throw new AppError(
      "Invalid credentials",
      400,
      "INVALID_CREDENTIALS",
      true
    );
  }

  const accessToken = signToken(user);
  const refreshToken = generateRefreshToken();

  await refreshRepo.createToken({
    userId: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
}

async function refreshAccessToken(refreshToken) {
  if (!refreshToken) {
    throw new AppError("Refresh token required", 400, "VALIDATION_ERROR", true);
  }

  const tokenDoc = await refreshRepo.findByToken(refreshToken);

  if (!tokenDoc) {
    throw new AppError("Invalid refresh token", 401, "UNAUTHORIZED", true);
  }

  const user = await getUserById(tokenDoc.userId);

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND", true);
  }

  const accessToken = signToken(user);

  return { accessToken };
}

async function logoutUser(refreshToken) {
  if (!refreshToken) return;
  await refreshRepo.deleteByToken(refreshToken);
}

async function sendPasswordReset(emailRaw) {
  const email = normalizeEmail(emailRaw);

  if (!email) {
    throw new AppError("Email is required", 400, "VALIDATION_ERROR", true);
  }

  const genericResponse = {
    message: "If an account exists, a reset link has been sent."
  };

  const user = await findUserByEmail(email);

  if (!user) {
    return genericResponse;
  }

  await invalidateOldResetTokens(user._id);

  const resetToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await resetRepo.createResetToken({
    userId: user._id,
    tokenHash,
    expiresAt,
    used: false
  });

  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetToken
    });
  } catch (_) {}

  if (process.env.NODE_ENV === "test") {
    return {
      ...genericResponse,
      resetToken
    };
  }

  return genericResponse;
}

async function resetPassword(payload) {
  const email = normalizeEmail(payload?.email);
  const token = String(payload?.token || payload?.resetToken || "").trim();
  const password = String(
    payload?.password || payload?.newPassword || ""
  );

  if (!email || !token || !password) {
    throw new AppError(
      "Email, token and password are required",
      400,
      "VALIDATION_ERROR",
      true
    );
  }

  if (!validatePassword(password)) {
    throw new AppError(
      "Password does not meet requirements",
      400,
      "VALIDATION_ERROR",
      true
    );
  }

  const user = await findUserByEmail(email);

  if (!user) {
    throw new AppError(
      "Invalid or expired reset token",
      400,
      "RESET_TOKEN_INVALID",
      true
    );
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const tokenDoc = await resetRepo.findValidResetToken(user._id, tokenHash);

  if (!tokenDoc) {
    throw new AppError(
      "Invalid or expired reset token",
      400,
      "RESET_TOKEN_INVALID",
      true
    );
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  user.passwordHash = hashedPassword;
  user.password = hashedPassword;

  await user.save();
  await resetRepo.markUsed(tokenDoc);

  return {
    message: "Password updated successfully"
  };
}

module.exports = {
  signup,
  login,
  sendPasswordReset,
  resetPassword,
  getUserById,
  refreshAccessToken,
  logoutUser
};