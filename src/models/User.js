/**
 * Barrel export for User model
 *
 * Purpose:
 * - Allows clean imports like: require("../models/User")
 * - Keeps actual model file lowercase and structured
 * - Avoids filesystem casing issues
 *
 * This pattern is common in enterprise Node.js codebases.
 */

module.exports = require("./user.model");