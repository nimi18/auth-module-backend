// src/app.js
/**
 * Express app factory (test-friendly + production-friendly).
 * - Security headers via helmet
 * - CORS configured
 * - JSON + urlencoded enabled
 * - Health endpoint
 * - Error middleware at the end
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/auth.routes");
const errorMiddleware = require("./middleware/error.middleware");
const { FRONTEND_URL, IS_PROD } = require("./config/env");

function createApp() {
  const app = express();

  // If behind reverse proxy (Render/NGINX), enable this for correct IP/rate limit behavior
  if (IS_PROD) app.set("trust proxy", 1);

  app.use(helmet());

  // CORS: allow configured frontend origin; allow all if FRONTEND_URL="*"
  app.use(
    cors({
      origin: FRONTEND_URL === "*" ? true : FRONTEND_URL,
      credentials: true,
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/auth", authRoutes);

  // error handler must be last
  app.use(errorMiddleware);

  return app;
}

module.exports = createApp;