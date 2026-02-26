// src/repositories/user.repo.js
/**
 * User Repository
 * ---------------
 * Purpose:
 * - Keep DB concerns out of services/controllers
 * - Ensure consistent return types
 */

const User = require("../models/user.model");

/**
 * @param {string} email
 * @returns {Promise<User|null>}
 */
function findByEmail(email) {
  if (!email) return Promise.resolve(null);
  return User.findOne({ email });
}

/**
 * @param {string} provider
 * @param {string} providerId
 * @returns {Promise<User|null>}
 */
function findByProvider(provider, providerId) {
  if (!provider || !providerId) return Promise.resolve(null);

  return User.findOne({
    providers: { $elemMatch: { provider, providerId } },
  });
}

/**
 * @param {object} data
 * @returns {Promise<User>}
 */
function createUser(data) {
  return User.create(data);
}

/**
 * @param {User} user
 * @returns {Promise<User>}
 */
function saveUser(user) {
  return user.save();
}

module.exports = {
  findByEmail,
  findByProvider,
  createUser,
  saveUser,
};