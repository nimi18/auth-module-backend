// src/controllers/auth.controller.js
/**
 * Auth Controller
 * ---------------
 * Thin controller layer:
 * - validates request shape where appropriate
 * - delegates business logic to services
 * - returns enterprise response envelope
 *
 * All success responses use:
 *   { success: true, data: ... }
 *
 * All error responses are handled centrally by error middleware.
 */

const authService = require("../services/auth.service");
const { blacklistToken } = require("../services/tokenBlacklist.service");
const AppError = require("../utils/appError");
const { sendSuccess } = require("../utils/response.util");

/**
 * Infer a fallback name from email when not provided.
 * This helps keep "name required everywhere" consistent in persistence.
 */
function inferName(name, email) {
  const trimmedName = String(name || "").trim();
  if (trimmedName) return trimmedName;

  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (normalizedEmail.includes("@")) {
    return normalizedEmail.split("@")[0] || "User";
  }

  return "User";
}

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Signup (local)
 *     description: Creates a local user account and returns a JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Nimita Malhotra"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "test1@example.com"
 *               password:
 *                 type: string
 *                 example: "Test@12345"
 *             required: [name, email, password]
 *     responses:
 *       200:
 *         description: Signup successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/EnvelopeSuccessAuth"
 *       400:
 *         description: Validation error or duplicate email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/EnvelopeError"
 */
async function signup(req, res) {
  const email = req.body?.email;
  const password = req.body?.password;
  const name = inferName(req.body?.name, email);

  if (!name || !email || !password) {
    throw new AppError(
      "Name, email and password are required",
      400,
      "VALIDATION_ERROR",
      true
    );
  }

  const result = await authService.signup({ name, email, password });

  return sendSuccess(
    res,
    {
      user: {
        id: result.user._id,
        name: result.user.name,
        email: result.user.email,
      },
      token: result.token,
    },
    200
  );
}

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login (local)
 *     description: Authenticates a local user and returns an access token and refresh token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "test2@example.com"
 *               password:
 *                 type: string
 *                 example: "Test@12345"
 *             required: [email, password]
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/EnvelopeSuccessAuth"
 *       400:
 *         description: Invalid credentials or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/EnvelopeError"
 */
async function login(req, res) {
  const email = req.body?.email;
  const password = req.body?.password;

  if (!email || !password) {
    throw new AppError(
      "Email and password are required",
      400,
      "VALIDATION_ERROR",
      true
    );
  }

  const result = await authService.login({ email, password });

  return sendSuccess(
    res,
    {
      user: {
        id: result.user._id,
        name: result.user.name,
        email: result.user.email,
      },
      token: result.accessToken,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
    200
  );
}

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Password]
 *     summary: Forgot password
 *     description: Always returns a generic message to prevent email enumeration. If the user exists, a reset token is created and an email is triggered.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "fp@example.com"
 *             required: [email]
 *     responses:
 *       200:
 *         description: Generic forgot-password response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/EnvelopeSuccessForgotPassword"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/EnvelopeError"
 */
async function forgotPassword(req, res) {
  const email = req.body?.email;

  if (!email) {
    throw new AppError(
      "Email is required",
      400,
      "VALIDATION_ERROR",
      true
    );
  }

  const result = await authService.sendPasswordReset(email);

  return sendSuccess(res, result);
}

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags: [Password]
 *     summary: Reset password
 *     description: Resets password using a valid reset token and blocks token reuse.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "rp@example.com"
 *               token:
 *                 type: string
 *                 example: "reset_token_from_email"
 *               password:
 *                 type: string
 *                 example: "New@12345"
 *             required: [email, token, password]
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/EnvelopeSuccessMessage"
 *       400:
 *         description: Invalid or expired token, or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/EnvelopeError"
 */
async function resetPassword(req, res) {
  const email = req.body?.email;
  const token = req.body?.token || req.body?.resetToken;
  const password = req.body?.password || req.body?.newPassword;

  if (!email || !token || !password) {
    throw new AppError(
      "Email, token and password are required",
      400,
      "VALIDATION_ERROR",
      true
    );
  }

  const result = await authService.resetPassword({
    email,
    token,
    password,
  });

  return sendSuccess(res, result);
}

/**
 * @openapi
 * /api/auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     description: Accepts a valid refresh token and returns a new access token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "refresh_token_from_login"
 *             required: [refreshToken]
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/EnvelopeSuccessMessage"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/EnvelopeError"
 *       401:
 *         description: Invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/EnvelopeError"
 */
async function refreshToken(req, res) {
  const refreshTokenValue = req.body?.refreshToken;

  if (!refreshTokenValue) {
    throw new AppError(
      "Refresh token is required",
      400,
      "VALIDATION_ERROR",
      true
    );
  }

  const result = await authService.refreshAccessToken(refreshTokenValue);

  return sendSuccess(
    res,
    {
      token: result.accessToken,
      accessToken: result.accessToken,
    },
    200
  );
}

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout current user
 *     description: Blacklists the current access token and deletes the provided refresh token.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "refresh_token_from_login"
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/EnvelopeSuccessMessage"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/EnvelopeError"
 */
async function logout(req, res) {
  const header = String(req.headers.authorization || "");
  const [scheme, token] = header.split(" ");
  const refreshTokenValue = req.body?.refreshToken;

  if (scheme !== "Bearer" || !token) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED", true);
  }

  await blacklistToken(token);

  if (refreshTokenValue) {
    await authService.logoutUser(refreshTokenValue);
  }

  return sendSuccess(res, { message: "Logged out successfully" });
}

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user
 *     description: Returns the authenticated user derived from the JWT token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/EnvelopeSuccessMe"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/EnvelopeError"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/EnvelopeError"
 */
async function me(req, res) {
  const userId = req.user?.sub;

  if (!userId) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED", true);
  }

  const user = await authService.getUserById(userId);

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND", true);
  }

  return sendSuccess(
    res,
    {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        providers: user.providers || [],
      },
    },
    200
  );
}

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  me,
};