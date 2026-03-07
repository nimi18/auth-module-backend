// src/routes/auth.routes.js
/**
 * Auth Routes
 * -----------
 * Public + protected auth endpoints.
 * Business logic lives in controllers/services; routes only map URLs to handlers.
 */

const router = require("express").Router();

const authController = require("../controllers/auth.controller");
const socialController = require("../controllers/socialAuth.controller");

const { requireAuth } = require("../middleware/auth.middleware");
const { asyncHandler } = require("../middleware/async.middleware");
const {
  signupLimiter,
  loginLimiter,
  forgotLimiter,
} = require("../middleware/rateLimit.middleware");

router.post("/signup", signupLimiter, asyncHandler(authController.signup));
router.post("/login", loginLimiter, asyncHandler(authController.login));

router.post(
  "/forgot-password",
  forgotLimiter,
  asyncHandler(authController.forgotPassword)
);

router.post("/reset-password", asyncHandler(authController.resetPassword));

router.post(
  "/social/:provider",
  loginLimiter,
  asyncHandler(socialController.socialLogin)
);

router.get("/me", requireAuth, asyncHandler(authController.me));

module.exports = router;