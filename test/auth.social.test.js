const { expect } = require("chai");
const sinon = require("sinon");
const nock = require("nock");
const { socialGoogle, socialFacebook, signup } = require("./helpers/factories");

const { OAuth2Client } = require("google-auth-library");

describe("Auth - Social Logins", function () {
  it("google: should reject missing token", async function () {
    const app = global.__APP__();
    const res = await require("supertest")(app).post("/api/auth/social/google").send({});

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property("success", false);
    expect(res.body).to.have.property("error");
    expect(res.body.error.code).to.equal("TOKEN_REQUIRED");
  });

  it("google: should create new user for valid token", async function () {
    const app = global.__APP__();

    const stub = sinon.stub(OAuth2Client.prototype, "verifyIdToken").resolves({
      getPayload: function () {
        return {
          sub: "google-sub-1",
          email: "guser@example.com",
          email_verified: true,
          name: "Google User",
        };
      },
    });

    const res = await socialGoogle(app, "fake_google_id_token");

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("success", true);
    expect(res.body).to.have.property("data");
    expect(res.body.data).to.have.property("token");
    expect(res.body.data.user.email).to.equal("guser@example.com");

    stub.restore();
  });

  it("google: should reject unverified email", async function () {
    const app = global.__APP__();

    const stub = sinon.stub(OAuth2Client.prototype, "verifyIdToken").resolves({
      getPayload: function () {
        return {
          sub: "google-sub-2",
          email: "unverified@example.com",
          email_verified: false,
        };
      },
    });

    const res = await socialGoogle(app, "fake_google_id_token");

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property("success", false);
    expect(res.body).to.have.property("error");
    expect(res.body.error.code).to.equal("SOCIAL_EMAIL_NOT_VERIFIED");

    stub.restore();
  });

  it("facebook: should create new user for valid access token", async function () {
    const app = global.__APP__();

    nock("https://graph.facebook.com")
      .get("/debug_token")
      .query(true)
      .reply(200, { data: { is_valid: true } });

    nock("https://graph.facebook.com")
      .get("/me")
      .query(true)
      .reply(200, { id: "fb-id-1", email: "fbuser@example.com", name: "FB User" });

    const res = await socialFacebook(app, "fake_fb_access_token");

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("success", true);
    expect(res.body).to.have.property("data");
    expect(res.body.data.user.email).to.equal("fbuser@example.com");
    expect(res.body.data).to.have.property("token");
  });

  it("facebook: should reject when email is missing", async function () {
    const app = global.__APP__();

    nock("https://graph.facebook.com")
      .get("/debug_token")
      .query(true)
      .reply(200, { data: { is_valid: true } });

    nock("https://graph.facebook.com")
      .get("/me")
      .query(true)
      .reply(200, { id: "fb-id-2" });

    const res = await socialFacebook(app, "fake_fb_access_token");

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property("success", false);
    expect(res.body).to.have.property("error");
    expect(res.body.error.code).to.equal("SOCIAL_EMAIL_REQUIRED");
  });

  it("social linking: should link provider to existing local user (no duplicate user)", async function () {
    const app = global.__APP__();

    await signup(app, { name: "Link User", email: "link@example.com", password: "Test@12345" });

    const stub = sinon.stub(OAuth2Client.prototype, "verifyIdToken").resolves({
      getPayload: function () {
        return {
          sub: "google-sub-link",
          email: "link@example.com",
          email_verified: true,
        };
      },
    });

    const res = await socialGoogle(app, "fake_google_id_token");
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("success", true);
    expect(res.body.data.user.email).to.equal("link@example.com");

    const User = require("../src/models/user.model");
    const users = await User.find({ email: "link@example.com" });
    expect(users.length).to.equal(1);

    stub.restore();
  });
});