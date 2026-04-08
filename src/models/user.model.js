// src/models/user.model.js
/**
 * User model
 * ----------
 * Designed for:
 * - local authentication
 * - social login account linking
 * - scalable future extension (roles, profile data, verification flags)
 */

const mongoose = require("mongoose");

const ALLOWED_PROVIDERS = ["google", "facebook"];

const providerSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ALLOWED_PROVIDERS,
      required: true,
      trim: true,
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
      lowercase: true,
      trim: true,
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
  {
    timestamps: true,
    versionKey: false,
  }
);

// Unique email constraint
userSchema.index({ email: 1 }, { unique: true });

// Prevent the same provider account from being linked multiple times
userSchema.index(
  { "providers.provider": 1, "providers.providerId": 1 },
  { unique: true, sparse: true }
);

userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    providers: this.providers || [],
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

userSchema.set("toJSON", {
  transform: function transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;