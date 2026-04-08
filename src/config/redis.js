// src/config/redis.js
/**
 * Redis Configuration
 * -------------------
 * - Optional Redis integration
 * - Safe connection handling
 * - Graceful shutdown support
 * - No impact if disabled
 */

const Redis = require("ioredis");
const logger = require("./logger");

const {
  REDIS_ENABLED,
  REDIS_URL,
  REDIS_PREFIX
} = require("./env");

let redis = null;

function createRedisClient() {
  if (!REDIS_ENABLED) {
    logger.info("Redis is disabled");
    return null;
  }

  if (!REDIS_URL) {
    throw new Error("REDIS_URL must be provided when REDIS_ENABLED=true");
  }

  const client = new Redis(REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true
  });

  client.on("connect", () => {
    logger.info("Redis connecting...");
  });

  client.on("ready", () => {
    logger.info("Redis connected");
  });

  client.on("error", (err) => {
    logger.error("Redis error", { err });
  });

  client.on("close", () => {
    logger.warn("Redis connection closed");
  });

  return client;
}

async function connectRedis() {
  if (!REDIS_ENABLED) return;

  redis = createRedisClient();

  try {
    await redis.connect();
  } catch (err) {
    logger.error("Redis connection failed", { err });
    throw err;
  }
}

async function disconnectRedis() {
  if (!redis) return;

  try {
    await redis.quit();
    logger.info("Redis disconnected");
  } catch (err) {
    logger.error("Redis disconnect failed", { err });
  }
}

function getRedis() {
  return redis;
}

function buildKey(key) {
  return `${REDIS_PREFIX}:${key}`;
}

module.exports = {
  connectRedis,
  disconnectRedis,
  getRedis,
  buildKey
};