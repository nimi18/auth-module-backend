// src/controllers/socialAuth.controller.js
/**
 * Social Auth Controller
 * ----------------------
 * Handles provider-based authentication using route param `:provider`.
 * Supported providers:
 * - google
 * - facebook
 *
 * All responses use the enterprise success envelope.
 */

const AppError = require("../utils/appError");
const socialService = require("../services/socialAuth.service");
const { sendSuccess } = require("../utils/response.util");

/**
 * @openapi
 * /api/auth/social/google:
 *   post:
 *     tags: [Social Auth]
 *     summary: Google login/signup
 *     description: Verifies a Google ID token, creates or links the user account, and returns JWT.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             properties:
 *               token:
 *                 type: string
 *                 example: "google_id_token"
 *             required: [token]
 *     responses:
 *       200:
 *         description: Google authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/EnvelopeSuccessAuth"
 *       400:
 *         description: Invalid token, missing email, or unverified email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/EnvelopeError"
 *
 * /api/auth/social/facebook:
 *   post:
 *     tags: [Social Auth]
 *     summary: Facebook login/signup
 *     description: Validates a Facebook access token, creates or links the user account, and returns JWT.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             properties:
 *               token:
 *                 type: string
 *                 example: "facebook_access_token"
 *             required: [token]
 *     responses:
 *       200:
 *         description: Facebook authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/EnvelopeSuccessAuth"
 *       400:
 *         description: Invalid token or missing email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/EnvelopeError"
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
    throw new AppError(
      "Unsupported provider",
      400,
      "PROVIDER_NOT_SUPPORTED",
      true
    );
  }

  return sendSuccess(res, {
    user: {
      id: result.user._id,
      name: result.user.name,
      email: result.user.email,
    },
    token: result.token,
  });
}

module.exports = { socialLogin };