// src/services/auth.service.js
/**
 * Auth Service (Enterprise-grade)
 * --------------------------------
 * Responsibilities:
 * - Signup (local)
 * - Login (local)
 * - Forgot Password (issue reset token + email)
 * - Reset Password (verify reset token + update password + mark token used)
 *
 * Notes:
 * - Uses repository layer for persistence (userRepo/resetRepo)
 * - Uses AppError for consistent error responses
 * - Prevents email enumeration (forgot password returns generic message)
 * - Stores only token HASH in DB (never raw token)
 * - In NODE_ENV=test, returns resetToken to enable unskipping pending tests later
 */

const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userRepo = require("../repositories/user.repo");
const resetRepo = require("../repositories/resetToken.repo");

const AppError = require("../utils/appError");
const { signToken } = require("../utils/jwt.util");

// Keep mail delivery non-blocking and non-fatal for auth flows
const { sendPasswordResetEmail } = require("./mailer.service");

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const BCRYPT_ROUNDS = 10;

/**
 * Normalize email for consistent storage and lookups.
 * @param {string} email
 * @returns {string}
 */
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/**
 * Enterprise password policy (simple but strong baseline).
 * Your test passwords already satisfy this: "Test@12345".
 *
 * Rules:
 * - at least 8 chars
 * - at least 1 uppercase, 1 lowercase, 1 digit
 * - at least 1 special char
 *
 * @param {string} password
 * @returns {boolean}
 */
function validatePassword(password) {
  const p = String(password || "");
  if (p.length < 8) return false;
  if (!/[A-Z]/.test(p)) return false;
  if (!/[a-z]/.test(p)) return false;
  if (!/[0-9]/.test(p)) return false;
  if (!/[^A-Za-z0-9]/.test(p)) return false;
  return true;
}

/**
 * userRepo.findByEmail() safety wrapper.
 * Some repos return `findOne`, some return `find` array.
 * We normalize to a single user doc or null.
 */
async function findUserByEmail(email) {
  const res = await userRepo.findByEmail(email);
  if (!res) return null;
  if (Array.isArray(res)) return res[0] || null;
  return res; // findOne style
}

/**
 * Best-effort token invalidation for a user.
 * Uses repo if available, otherwise tries direct model access (fallback).
 */
async function invalidateOldResetTokens(userId) {
  if (!userId) return;

  // Prefer repository function(s) if present
  if (typeof resetRepo.deleteAllForUser === "function") {
    await resetRepo.deleteAllForUser(userId);
    return;
  }

  if (typeof resetRepo.deleteManyForUser === "function") {
    await resetRepo.deleteManyForUser(userId);
    return;
  }

  // Fallback: if repo doesn’t expose delete, we can still invalidate by marking used
  // (This fallback avoids breaking older repo implementations.)
  if (typeof resetRepo.invalidateAllForUser === "function") {
    await resetRepo.invalidateAllForUser(userId);
    return;
  }

  // Final fallback: try direct model (only if repo doesn't provide)
  try {
    // eslint-disable-next-line global-require
    const ResetToken = require("../models/passwordResetToken.model");
    await ResetToken.updateMany({ userId, used: false }, { $set: { used: true } });
  } catch (_) {
    // Ignore — token invalidation is best-effort
  }
}

/**
 * SIGNUP (Local)
 * Requires: name, email, password
 * Returns: { user, token }
 */
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

  const existing = await findUserByEmail(email);
  if (existing) {
    throw new AppError("Email already exists", 400, "EMAIL_EXISTS", true);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await userRepo.createUser({
    name,
    email,
    passwordHash,
    providers: [],
  });

  const token = signToken(user);
  return { user, token };
}

/**
 * LOGIN (Local)
 * Requires: email, password
 * Returns: { user, token }
 */
async function login(payload) {
  const email = normalizeEmail(payload?.email);
  const password = String(payload?.password || "");

  if (!email || !password) {
    throw new AppError("Email and password are required", 400, "VALIDATION_ERROR", true);
  }

  const user = await findUserByEmail(email);
  if (!user || !user.passwordHash) {
    // Do NOT reveal whether email exists
    throw new AppError("Invalid credentials", 400, "INVALID_CREDENTIALS", true);
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new AppError("Invalid credentials", 400, "INVALID_CREDENTIALS", true);
  }

  const token = signToken(user);
  return { user, token };
}

/**
 * FORGOT PASSWORD
 * - Always returns a generic message (prevents email enumeration)
 * - Creates a token ONLY if user exists
 * - Stores token hash in DB (not raw token)
 */
async function sendPasswordReset(emailRaw) {
  const email = normalizeEmail(emailRaw);
  if (!email) {
    throw new AppError("Email is required", 400, "VALIDATION_ERROR", true);
  }

  const generic = { message: "If an account exists, a reset link has been sent." };

  const user = await findUserByEmail(email);
  if (!user) {
    // Do not reveal existence
    return generic;
  }

  // Invalidate old tokens for this user (best-effort)
  await invalidateOldResetTokens(user._id);

  // Create token (store only SHA256 hash)
  const resetToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await resetRepo.createResetToken({
    userId: user._id,
    tokenHash,
    expiresAt,
    used: false,
  });

  // Never fail forgot-password due to email provider issues
  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetToken,
    });
  } catch (_) {
    // swallow errors — auth flow must not break due to mail failure
  }

  // Enable pending tests later (test-mode only)
  if (process.env.NODE_ENV === "test") {
    return { ...generic, resetToken };
  }

  return generic;
}

/**
 * RESET PASSWORD
 * Requires: email, token, password
 * - Validates token exists + unused + not expired
 * - Updates user password
 * - Marks token used
 */
async function resetPassword(payload) {
  const email = normalizeEmail(payload?.email);
  const token = String(payload?.token || "").trim();
  const password = String(payload?.password || "");

  if (!email || !token || !password) {
    throw new AppError("Email, token and password are required", 400, "VALIDATION_ERROR", true);
  }

  if (!validatePassword(password)) {
    throw new AppError("Password does not meet requirements", 400, "VALIDATION_ERROR", true);
  }

  const user = await findUserByEmail(email);
  if (!user) {
    // Do not reveal existence
    throw new AppError("Invalid or expired reset token", 400, "RESET_TOKEN_INVALID", true);
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const tokenDoc = await resetRepo.findValidResetToken(user._id, tokenHash);
  if (!tokenDoc) {
    throw new AppError("Invalid or expired reset token", 400, "RESET_TOKEN_INVALID", true);
  }

  user.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await user.save();

  await resetRepo.markUsed(tokenDoc);

  return { message: "Password updated successfully" };
}

module.exports = {
  signup,
  login,
  sendPasswordReset,
  resetPassword,
};