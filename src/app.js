// src/app.js
/**
 * Express Application Factory
 * ---------------------------
 * Creates the configured Express app instance.
 *
 * Includes:
 * - Helmet security headers
 * - CORS configuration
 * - JSON + urlencoded body parsing
 * - Health endpoint
 * - Auth routes
 * - Swagger UI (disabled in test)
 * - Centralized error handling
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const swaggerUi = require("swagger-ui-express");

const authRoutes = require("./routes/auth.routes");
const errorMiddleware = require("./middleware/error.middleware");
const swaggerSpec = require("./config/swagger");
const { FRONTEND_URL, IS_PROD } = require("./config/env");
const { sendSuccess } = require("./utils/response.util");

function createApp() {
  const app = express();

  if (IS_PROD) {
    app.set("trust proxy", 1);
  }

  app.use(helmet());

  app.use(
    cors({
      origin: FRONTEND_URL === "*" ? true : FRONTEND_URL,
      credentials: true,
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (req, res) => {
    return sendSuccess(res, {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/auth", authRoutes);

  if (process.env.NODE_ENV !== "test") {
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }

  app.use(errorMiddleware);

  return app;
}

module.exports = createApp;