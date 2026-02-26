// src/controllers/socialAuth.controller.js
const AppError = require("../utils/appError");
const socialService = require("../services/socialAuth.service");
const { ok } = require("../utils/response.util");

/**
 * POST /api/auth/social/:provider
 * Params: provider in [google, facebook]
 * Body:
 *   { token: <idToken/accessToken> }
 */
async function socialLogin(req, res) {
  const provider = String(req.params.provider || "").toLowerCase();
  const token = req.body?.token;

  if (!token) {
    throw new AppError("Token is required", 400, "TOKEN_REQUIRED", true);
  }

  let result;

  if (provider === "google") {
    result = await socialService.handleGoogleLogin(token);
  } else if (provider === "facebook") {
    result = await socialService.handleFacebookLogin(token);
  } else {
    throw new AppError("Unsupported provider", 400, "PROVIDER_NOT_SUPPORTED", true);
  }

  return ok(res, {
    user: { id: result.user._id, name: result.user.name, email: result.user.email },
    token: result.token,
  });
}

module.exports = { socialLogin };