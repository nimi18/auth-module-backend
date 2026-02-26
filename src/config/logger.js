// src/config/logger.js
/**
 * Pino logger (enterprise standard for Node services).
 * - Pretty logs in dev
 * - JSON logs in prod (best for observability)
 */

const pino = require("pino");
const { NODE_ENV } = require("./env");

const isProd = NODE_ENV === "production";

const logger = pino(
  {
    level: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
    base: undefined, // remove pid/hostname noise (optional)
  },
  isProd
    ? undefined
    : require("pino-pretty")({
        colorize: true,
        translateTime: "yyyy-mm-dd HH:MM:ss.l o",
        ignore: "pid,hostname",
      })
);

module.exports = logger;