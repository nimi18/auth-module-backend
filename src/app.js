// src/app.js
/**
 * Express Application Factory
 * ---------------------------
 * Creates and configures the Express application.
 *
 * Includes:
 * - Security headers
 * - CORS
 * - JSON + form parsing
 * - Health + readiness endpoints
 * - Auth routes
 * - Swagger docs (outside test, if enabled)
 * - Centralized 404 + error handling
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const swaggerUi = require("swagger-ui-express");

const authRoutes = require("./routes/auth.routes");
const errorMiddleware = require("./middleware/error.middleware");
const swaggerSpec = require("./config/swagger");
const { FRONTEND_URL, IS_PROD, ENABLE_SWAGGER } = require("./config/env");
const { sendSuccess } = require("./utils/response.util");
const AppError = require("./utils/appError");

function createApp() {
  const app = express();

  app.disable("x-powered-by");

  if (IS_PROD) {
    app.set("trust proxy", 1);
  }

  app.use(helmet());

  app.use(
    cors({
      origin: FRONTEND_URL === "*" ? true : FRONTEND_URL,
      credentials: true
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (req, res) => {
    return sendSuccess(
      res,
      {
        service: "auth-module-backend",
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      },
      200
    );
  });

  app.get("/ready", (req, res) => {
    const dbConnected = mongoose.connection.readyState === 1;

    const statusCode = dbConnected ? 200 : 503;
    const readiness = dbConnected ? "ready" : "not_ready";

    return sendSuccess(
      res,
      {
        service: "auth-module-backend",
        status: readiness,
        database: {
          connected: dbConnected,
          readyState: mongoose.connection.readyState
        },
        timestamp: new Date().toISOString()
      },
      statusCode
    );
  });

  app.use("/api/auth", authRoutes);

  if (ENABLE_SWAGGER) {
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }

  app.use((req, res, next) => {
    next(
      new AppError(
        `Route not found: ${req.method} ${req.originalUrl}`,
        404,
        "ROUTE_NOT_FOUND",
        true
      )
    );
  });

  app.use(errorMiddleware);

  return app;
}

module.exports = createApp;