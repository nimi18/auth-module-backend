// src/models/User.js
/**
 * Barrel export for User model.
 *
 * Why keep this file?
 * - Maintains clean imports like require("../models/User")
 * - Preserves compatibility with existing code
 * - Avoids accidental casing/import issues across platforms
 */

module.exports = require("./user.model");