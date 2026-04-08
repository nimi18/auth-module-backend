// src/repositories/refreshToken.repo.js

const RefreshToken = require("../models/refreshToken.model");

function createToken(data) {
  return RefreshToken.create(data);
}

function findByToken(token) {
  return RefreshToken.findOne({ token });
}

function deleteByToken(token) {
  return RefreshToken.deleteOne({ token });
}

function deleteAllForUser(userId) {
  return RefreshToken.deleteMany({ userId });
}

module.exports = {
  createToken,
  findByToken,
  deleteByToken,
  deleteAllForUser,
};