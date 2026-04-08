// src/config/env.js
/**
 * Environment Configuration
 * -------------------------
 * Centralized environment access with:
 * - safe defaults for local development
 * - optional startup validation
 * - production warnings for insecure fallbacks
 * - a consistent config surface for the rest of the app
 */

const dotenv = require("dotenv");

if (process.env.NODE_ENV !== "test") {
  dotenv.config();
}

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return fallback;

  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "y", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "n", "off"].includes(normalized)) return false;

  return fallback;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

const NODE_ENV = process.env.NODE_ENV || "development";
const IS_DEV = NODE_ENV === "development";
const IS_TEST = NODE_ENV === "test";
const IS_PROD = NODE_ENV === "production";

const PORT = toInt(process.env.PORT, 4000);

const FRONTEND_URL = process.env.FRONTEND_URL || "*";
const APP_FRONTEND_URL =
  process.env.APP_FRONTEND_URL || "http://localhost:5173";
const APP_BASE_URL = process.env.APP_BASE_URL || `http://localhost:${PORT}`;

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/auth_module";

const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || "";
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || "";

const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const BREVO_SENDER_EMAIL =
  process.env.BREVO_SENDER_EMAIL || "no-reply@example.com";
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || "Auth Module";

const RESPONSE_ENVELOPE = process.env.RESPONSE_ENVELOPE || "1";
const ENABLE_SWAGGER = toBool(process.env.ENABLE_SWAGGER, !IS_TEST);
const ENABLE_REQUEST_LOGGING = toBool(
  process.env.ENABLE_REQUEST_LOGGING,
  !IS_TEST
);

/**
 * Future-ready Redis config.
 * Redis is optional for now, but these values let us integrate it
 * cleanly in the next step without redesigning env structure.
 */
const REDIS_ENABLED = toBool(process.env.REDIS_ENABLED, false);
const REDIS_URL = process.env.REDIS_URL || "";
const REDIS_PREFIX = process.env.REDIS_PREFIX || "auth_module";

/**
 * Validate runtime configuration.
 * - In production, fail fast on critical missing/insecure values.
 * - In development, allow local defaults but surface warnings.
 */
function validateEnv() {
  const errors = [];
  const warnings = [];

  if (!isNonEmptyString(MONGODB_URI)) {
    errors.push("MONGODB_URI is required.");
  }

  if (!isNonEmptyString(JWT_SECRET)) {
    errors.push("JWT_SECRET is required.");
  }

  if (IS_PROD && JWT_SECRET === "change_me_in_production") {
    errors.push("JWT_SECRET must be set to a secure value in production.");
  }

  if (IS_PROD && FRONTEND_URL === "*") {
    warnings.push(
      'FRONTEND_URL is "*" in production. Restrict CORS to your frontend domain.'
    );
  }

  if (REDIS_ENABLED && !isNonEmptyString(REDIS_URL)) {
    errors.push("REDIS_URL is required when REDIS_ENABLED=true.");
  }

  if (errors.length > 0) {
    const message =
      `Environment validation failed:\n- ${errors.join("\n- ")}` +
      (warnings.length
        ? `\nWarnings:\n- ${warnings.join("\n- ")}`
        : "");

    throw new Error(message);
  }

  if (!IS_TEST && warnings.length > 0) {
    warnings.forEach((warning) => {
      console.warn(`[env warning] ${warning}`);
    });
  }
}

module.exports = {
  NODE_ENV,
  IS_DEV,
  IS_TEST,
  IS_PROD,
  PORT,
  FRONTEND_URL,
  APP_FRONTEND_URL,
  APP_BASE_URL,
  MONGODB_URI,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  GOOGLE_CLIENT_ID,
  FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET,
  BREVO_API_KEY,
  BREVO_SENDER_EMAIL,
  BREVO_SENDER_NAME,
  RESPONSE_ENVELOPE,
  ENABLE_SWAGGER,
  ENABLE_REQUEST_LOGGING,
  REDIS_ENABLED,
  REDIS_URL,
  REDIS_PREFIX,
  validateEnv
};