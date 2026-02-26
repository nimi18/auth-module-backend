// test/auth.forgot-reset.test.js
const { expect } = require("chai");
const { signup, forgotPassword, resetPassword, login } = require("./helpers/factories");

const ResetToken = require("../src/models/passwordResetToken.model");

describe("Auth - Forgot/Reset Password", function () {
  it("forgot-password should return generic message for existing email", async function () {
    const app = global.__APP__();

    await signup(app, { name: "FP User", email: "fp@example.com", password: "Test@12345" });

    const res = await forgotPassword(app, "fp@example.com");

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("success", true);
    expect(res.body).to.have.property("data");
    expect(res.body.data).to.have.property("message");

    const tokens = await ResetToken.find({});
    expect(tokens.length).to.equal(1);
    expect(tokens[0]).to.have.property("used", false);
  });

  it("forgot-password should return generic message for non-existing email and not create token", async function () {
    const app = global.__APP__();

    const res = await forgotPassword(app, "missing@example.com");

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("success", true);
    expect(res.body).to.have.property("data");
    expect(res.body.data).to.have.property("message");

    const tokens = await ResetToken.find({});
    expect(tokens.length).to.equal(0);
  });

  it("reset-password should reject invalid token", async function () {
    const app = global.__APP__();

    await signup(app, { name: "RP User", email: "rp@example.com", password: "Test@12345" });

    const res = await resetPassword(app, {
      email: "rp@example.com",
      token: "invalidtoken",
      password: "New@12345",
    });

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property("success", false);
    expect(res.body).to.have.property("error");
    expect(res.body.error).to.have.property("code", "RESET_TOKEN_INVALID");
  });

  it("reset-password should succeed and allow login with new password (captures real token in test mode)", async function () {
    const app = global.__APP__();

    await signup(app, {
      name: "Real Token User",
      email: "real@example.com",
      password: "Test@12345",
    });

    const fpRes = await forgotPassword(app, "real@example.com");

    expect(fpRes.status).to.equal(200);
    expect(fpRes.body).to.have.property("success", true);
    expect(fpRes.body).to.have.property("data");
    expect(fpRes.body.data).to.have.property("message");

    // In NODE_ENV=test, service returns resetToken (test-only)
    expect(fpRes.body.data).to.have.property("resetToken");
    const token = fpRes.body.data.resetToken;

    const resetRes = await resetPassword(app, {
      email: "real@example.com",
      token,
      password: "New@12345",
    });

    expect(resetRes.status).to.equal(200);
    expect(resetRes.body).to.have.property("success", true);
    expect(resetRes.body).to.have.property("data");
    expect(resetRes.body.data).to.have.property("message");

    const loginRes = await login(app, { email: "real@example.com", password: "New@12345" });
    expect(loginRes.status).to.equal(200);
    expect(loginRes.body).to.have.property("success", true);
    expect(loginRes.body).to.have.property("data");
    expect(loginRes.body.data).to.have.property("token");
    expect(loginRes.body.data).to.have.property("user");
    expect(loginRes.body.data.user.email).to.equal("real@example.com");
  });

  it("reset-password should block token reuse (captures real token in test mode)", async function () {
    const app = global.__APP__();

    await signup(app, {
      name: "Reuse Token User",
      email: "reuse@example.com",
      password: "Test@12345",
    });

    const fpRes = await forgotPassword(app, "reuse@example.com");

    expect(fpRes.status).to.equal(200);
    expect(fpRes.body).to.have.property("success", true);
    expect(fpRes.body).to.have.property("data");
    expect(fpRes.body.data).to.have.property("resetToken");

    const token = fpRes.body.data.resetToken;

    // first reset should succeed
    const resetRes1 = await resetPassword(app, {
      email: "reuse@example.com",
      token,
      password: "New@12345",
    });

    expect(resetRes1.status).to.equal(200);
    expect(resetRes1.body).to.have.property("success", true);

    // second reset with same token must fail
    const resetRes2 = await resetPassword(app, {
      email: "reuse@example.com",
      token,
      password: "Another@12345",
    });

    expect(resetRes2.status).to.equal(400);
    expect(resetRes2.body).to.have.property("success", false);
    expect(resetRes2.body).to.have.property("error");
    expect(resetRes2.body.error).to.have.property("code", "RESET_TOKEN_INVALID");
  });
});