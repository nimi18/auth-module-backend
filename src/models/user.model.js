// src/models/user.model.js
/**
 * User Model
 * ----------
 * Enterprise notes:
 * - email is unique + normalized (lowercase + trim)
 * - passwordHash is optional (null for social-only accounts)
 * - providers stores linked social identities
 * - `name` is required (per your requirement)
 */

const mongoose = require("mongoose");

const providerSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ["google", "facebook"],
      required: true,
    },
    providerId: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 1,
      maxlength: 120,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      default: null,
    },
    providers: {
      type: [providerSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Prevent duplicate provider links (same provider + providerId)
userSchema.index(
  { "providers.provider": 1, "providers.providerId": 1 },
  { unique: true, sparse: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;