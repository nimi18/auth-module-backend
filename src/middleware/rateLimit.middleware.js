// src/middleware/rateLimit.middleware.js
/**
 * Rate limiting middleware (enterprise-friendly).
 *
 * IMPORTANT:
 * - In test environment, rate limits are disabled to avoid flaky tests (429).
 * - In production, sensible defaults are applied.
 */

const rateLimit = require("express-rate-limit");

const isTestEnv = process.env.NODE_ENV === "test";

/**
 * No-op limiter for tests.
 */
function passthroughLimiter(req, res, next) {
  return next();
}

/**
 * Factory to build a limiter.
 */
function buildLimiter({ windowMs, max, message, code }) {
  if (isTestEnv) return passthroughLimiter;

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      // enterprise error shape
      res.status(429).json({
        success: false,
        error: {
          code: code || "RATE_LIMIT_EXCEEDED",
          message: message || "Too many requests, please try again later.",
        },
      });
    },
  });
}

// You can tune these later as your production requirements evolve.
const signupLimiter = buildLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: "Too many signup attempts. Please try again later.",
  code: "SIGNUP_RATE_LIMIT",
});

const loginLimiter = buildLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many login attempts. Please try again later.",
  code: "LOGIN_RATE_LIMIT",
});

const forgotLimiter = buildLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: "Too many password reset requests. Please try again later.",
  code: "FORGOT_PASSWORD_RATE_LIMIT",
});

module.exports = {
  signupLimiter,
  loginLimiter,
  forgotLimiter,
};