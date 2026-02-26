// src/controllers/auth.controller.js
const authService = require("../services/auth.service");
const AppError = require("../utils/appError");
const { ok } = require("../utils/response.util");

/**
 * Helper: infer name from email if not provided.
 * Keeps "name required everywhere" true in DB even if client forgets it.
 */
function inferName(name, email) {
  const n = String(name || "").trim();
  if (n) return n;

  const e = String(email || "").trim().toLowerCase();
  if (e.includes("@")) return e.split("@")[0] || "User";

  return "User";
}

/**
 * POST /api/auth/signup
 * Body: { name, email, password }
 */
async function signup(req, res) {
  const email = req.body?.email;
  const password = req.body?.password;

  // Name required everywhere (you confirmed ✅)
  const name = inferName(req.body?.name, email);

  if (!name || !email || !password) {
    throw new AppError("Name, email and password are required", 400, "VALIDATION_ERROR", true);
  }

  const result = await authService.signup({ name, email, password });

  return ok(
    res,
    {
      user: { id: result.user._id, name: result.user.name, email: result.user.email },
      token: result.token,
    },
    200 // you can change to 201 later; update tests accordingly if you do
  );
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res) {
  const email = req.body?.email;
  const password = req.body?.password;

  const result = await authService.login({ email, password });

  return ok(res, {
    user: { id: result.user._id, name: result.user.name, email: result.user.email },
    token: result.token,
  });
}

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 * Response data: { message } (+ resetToken in test mode)
 */
async function forgotPassword(req, res) {
  const email = req.body?.email;

  const result = await authService.sendPasswordReset(email);
  // result = { message } or { message, resetToken } in test mode

  return ok(res, result, 200);
}

/**
 * POST /api/auth/reset-password
 * Body: { email, token, password }
 * Response data: { message }
 */
async function resetPassword(req, res) {
  const email = req.body?.email;
  const token = req.body?.token;
  const password = req.body?.password;

  if (!email || !token || !password) {
    throw new AppError("Email, token and password are required", 400, "VALIDATION_ERROR", true);
  }

  const result = await authService.resetPassword({ email, token, password });
  // result currently returns { message: "Password updated successfully" }

  return ok(res, result, 200);
}

/**
 * GET /api/auth/me
 * Requires: Authorization: Bearer <jwt>
 */
async function me(req, res) {
  return ok(res, { user: req.user }, 200);
}

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
  me,
};