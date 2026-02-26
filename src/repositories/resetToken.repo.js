// src/repositories/resetToken.repo.js
/**
 * Reset Token Repository
 * ----------------------
 * Handles password reset token persistence and lookup.
 */

const PasswordResetToken = require("../models/passwordResetToken.model");

/**
 * Create a reset token record.
 * @param {object} data
 * @returns {Promise<PasswordResetToken>}
 */
function createResetToken(data) {
  return PasswordResetToken.create(data);
}

/**
 * Find a valid reset token for a given user.
 * Valid means:
 * - used: false
 * - expiresAt: > now
 * - tokenHash matches
 *
 * @param {string|ObjectId} userId
 * @param {string} tokenHash
 * @returns {Promise<PasswordResetToken|null>}
 */
function findValidResetToken(userId, tokenHash) {
  return PasswordResetToken.findOne({
    userId,
    tokenHash,
    used: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
}

/**
 * Mark a token document as used.
 * @param {PasswordResetToken} tokenDoc
 * @returns {Promise<PasswordResetToken>}
 */
function markUsed(tokenDoc) {
  tokenDoc.used = true;
  return tokenDoc.save();
}

/**
 * Invalidate all tokens for a user (best practice before issuing a new one)
 * @param {string|ObjectId} userId
 * @returns {Promise<any>}
 */
function deleteAllForUser(userId) {
  return PasswordResetToken.deleteMany({ userId });
}

module.exports = {
  createResetToken,
  findValidResetToken,
  markUsed,
  deleteAllForUser,
};