// src/services/tokenBlacklist.service.js
/**
 * Token Blacklist Service (Redis)
 * -------------------------------
 * - Stores invalidated JWTs
 * - Uses Redis with TTL based on token expiry
 * - Used for logout + security enforcement
 */

const jwt = require("jsonwebtoken");
const { getRedis, buildKey } = require("../config/redis");

async function blacklistToken(token) {
  const redis = getRedis();
  if (!redis) return;

  let ttl = 3600; // fallback

  try {
    const decoded = jwt.decode(token);

    if (decoded?.exp) {
      const now = Math.floor(Date.now() / 1000);
      ttl = decoded.exp - now;

      // if already expired, no need to store
      if (ttl <= 0) return;
    }
  } catch (_err) {
    // fallback TTL will be used
  }

  const key = buildKey(`blacklist:${token}`);

  await redis.set(key, "1", "EX", ttl);
}

async function isTokenBlacklisted(token) {
  const redis = getRedis();
  if (!redis) return false;

  const key = buildKey(`blacklist:${token}`);

  const result = await redis.get(key);
  return Boolean(result);
}

module.exports = {
  blacklistToken,
  isTokenBlacklisted,
};