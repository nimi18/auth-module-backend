// src/models/passwordResetToken.model.js
/**
 * PasswordResetToken Model
 * ------------------------
 * Enterprise design:
 * - Stores ONLY hashed reset tokens
 * - Prevents token reuse via `used`
 * - TTL index auto-cleans expired tokens
 */

const mongoose = require("mongoose");

const passwordResetTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

/**
 * TTL index:
 * MongoDB automatically deletes the document when expiresAt < now
 * (TTL monitor runs roughly every 60 seconds)
 */
passwordResetTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

/**
 * Optimized lookup for reset flow
 */
passwordResetTokenSchema.index({
  userId: 1,
  tokenHash: 1,
  used: 1,
});

const PasswordResetToken = mongoose.model(
  "PasswordResetToken",
  passwordResetTokenSchema
);

module.exports = PasswordResetToken;