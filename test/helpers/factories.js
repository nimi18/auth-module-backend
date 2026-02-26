// test/helpers/factories.js
const request = require("supertest");

/**
 * Helpers return the raw supertest response so tests can assert:
 * - res.status
 * - res.body.success
 * - res.body.data / res.body.error
 */

function signup(app, { name, email, password }) {
  return request(app)
    .post("/api/auth/signup")
    .send({
      name: name || "Test User",
      email,
      password,
    });
}

function login(app, { email, password }) {
  return request(app)
    .post("/api/auth/login")
    .send({ email, password });
}

function me(app, jwt) {
  return request(app)
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${jwt}`);
}

function forgotPassword(app, email) {
  return request(app)
    .post("/api/auth/forgot-password")
    .send({ email });
}

function resetPassword(app, { email, token, password }) {
  return request(app)
    .post("/api/auth/reset-password")
    .send({ email, token, password });
}

function socialGoogle(app, token) {
  return request(app)
    .post("/api/auth/social/google")
    .send({ token });
}

function socialFacebook(app, token) {
  return request(app)
    .post("/api/auth/social/facebook")
    .send({ token });
}

module.exports = {
  signup,
  login,
  me,
  forgotPassword,
  resetPassword,
  socialGoogle,
  socialFacebook,
};