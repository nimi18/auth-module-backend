// src/config/env.js
/**
 * Centralized environment configuration (enterprise-style).
 * - Loads .env via dotenv (only once)
 * - Validates required env vars
 * - Exposes typed, normalized config values
 */

const path = require("path");
const dotenv = require("dotenv");

// Load env early (index.js also imports env, but dotenv is idempotent)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function required(name) {
  const val = process.env[name];
  if (!val || String(val).trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return val;
}

function optional(name, def = "") {
  const val = process.env[name];
  return val == null || String(val).trim() === "" ? def : val;
}

function toInt(value, def) {
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : def;
}

const NODE_ENV = optional("NODE_ENV", "development");
const IS_PROD = NODE_ENV === "production";
const IS_TEST = NODE_ENV === "test";

const PORT = toInt(optional("PORT", "4000"), 4000);

// DB
const MONGODB_URI = required("MONGODB_URI");

// Auth
const JWT_SECRET = required("JWT_SECRET");
const JWT_EXPIRES_IN = optional("JWT_EXPIRES_IN", "1h");

// CORS
const FRONTEND_URL = optional("FRONTEND_URL", "*");

// Social
const GOOGLE_CLIENT_ID = optional("GOOGLE_CLIENT_ID", "");
const FACEBOOK_APP_ID = optional("FACEBOOK_APP_ID", "");
const FACEBOOK_APP_SECRET = optional("FACEBOOK_APP_SECRET", "");

// Email (optional in dev/test; real required in prod if you enable sending)
const BREVO_API_KEY = optional("BREVO_API_KEY", "");
const BREVO_SENDER_EMAIL = optional("BREVO_SENDER_EMAIL", "no-reply@example.com");

module.exports = {
  NODE_ENV,
  IS_PROD,
  IS_TEST,
  PORT,
  MONGODB_URI,

  JWT_SECRET,
  JWT_EXPIRES_IN,

  FRONTEND_URL,

  GOOGLE_CLIENT_ID,
  FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET,

  BREVO_API_KEY,
  BREVO_SENDER_EMAIL,
};