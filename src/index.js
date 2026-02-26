// src/index.js
/**
 * Service entrypoint:
 * - Connect DB
 * - Start HTTP server
 * - Graceful shutdown on SIGINT/SIGTERM
 */

const createApp = require("./app");
const logger = require("./config/logger");
const { connectDB, disconnectDB } = require("./config/db");
const { PORT, NODE_ENV } = require("./config/env");

async function start() {
  await connectDB();

  const app = createApp();

  const server = app.listen(PORT, () => {
    logger.info("Auth service started", { port: PORT, nodeEnv: NODE_ENV });
  });

  // Graceful shutdown
  async function shutdown(signal) {
    logger.warn("Shutdown signal received", { signal });

    server.close(async () => {
      await disconnectDB();
      logger.info("Server closed");
      process.exit(0);
    });

    // Force shutdown if stuck
    setTimeout(() => {
      logger.error("Force shutdown (timeout)");
      process.exit(1);
    }, 10_000).unref();
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((err) => {
  logger.error("Failed to start service", { err });
  process.exit(1);
});