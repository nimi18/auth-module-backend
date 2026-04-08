// src/index.js
/**
 * Service Entrypoint
 * ------------------
 * Responsibilities:
 * - validate environment
 * - connect database
 * - connect redis
 * - start HTTP server
 * - handle graceful shutdown
 * - log fatal process-level errors
 */

const createApp = require("./app");
const logger = require("./config/logger");
const { connectDB, disconnectDB } = require("./config/db");
const { connectRedis, disconnectRedis } = require("./config/redis");
const { PORT, NODE_ENV, validateEnv } = require("./config/env");

let server = null;
let shuttingDown = false;

async function shutdown(signal, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  try {
    logger.warn("Shutdown signal received", { signal });

    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }

    await disconnectDB();
    await disconnectRedis();

    logger.info("Service shutdown completed", { signal });
    process.exit(exitCode);
  } catch (error) {
    logger.error("Error during shutdown", {
      signal,
      error: error?.message || error
    });
    process.exit(1);
  }
}

async function start() {
  validateEnv();

  await connectDB();
  await connectRedis();

  const app = createApp();

  server = app.listen(PORT, () => {
    logger.info("Auth service started", {
      port: PORT,
      nodeEnv: NODE_ENV
    });
  });

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  process.on("unhandledRejection", async (reason) => {
    logger.error("Unhandled promise rejection", {
      error: reason?.message || reason
    });
    await shutdown("unhandledRejection", 1);
  });

  process.on("uncaughtException", async (error) => {
    logger.error("Uncaught exception", {
      error: error?.message || error
    });
    await shutdown("uncaughtException", 1);
  });
}

start().catch((error) => {
  logger.error("Failed to start service", {
    error: error?.message || error
  });
  process.exit(1);
});