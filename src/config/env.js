// src/config/env.js
/**
 * Environment Configuration
 * -------------------------
 * Centralized access point for all environment variables.
 *
 * Design goals:
 * - Safe defaults for local development
 * - Predictable shape for the rest of the application
 * - Easy to validate and extend later
 */

const dotenv = require("dotenv");

// Load .env automatically outside test mode.
// Tests usually set environment explicitly through their own setup.
if (process.env.NODE_ENV !== "test") {
  dotenv.config();
}

function toInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PROD = NODE_ENV === "production";

const PORT = toInt(process.env.PORT, 4000);

const FRONTEND_URL = process.env.FRONTEND_URL || "*";
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

const RESPONSE_ENVELOPE = process.env.RESPONSE_ENVELOPE || "1";
const APP_BASE_URL =
  process.env.APP_BASE_URL || `http://localhost:${PORT}`;

module.exports = {
  NODE_ENV,
  IS_PROD,
  PORT,
  FRONTEND_URL,
  MONGODB_URI,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  GOOGLE_CLIENT_ID,
  FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET,
  BREVO_API_KEY,
  BREVO_SENDER_EMAIL,
  RESPONSE_ENVELOPE,
  APP_BASE_URL,
};