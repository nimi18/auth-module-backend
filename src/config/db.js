// src/config/db.js
/**
 * MongoDB connection (Mongoose) - production friendly:
 * - Clear logs
 * - Safe options
 * - Throws on failure so service doesn't start half-broken
 */

const mongoose = require("mongoose");
const logger = require("./logger");
const { MONGODB_URI } = require("./env");

mongoose.set("strictQuery", true);

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      autoIndex: false, // ✅ avoid index builds on startup in prod
      serverSelectionTimeoutMS: 10_000,
    });

    logger.info("MongoDB connected");
  } catch (err) {
    logger.error("MongoDB connection failed", { err });
    throw err;
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    logger.info("MongoDB disconnected");
  } catch (err) {
    logger.error("MongoDB disconnect failed", { err });
  }
}

module.exports = { connectDB, disconnectDB };