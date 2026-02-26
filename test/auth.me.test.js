const { expect } = require("chai");
const { signup, me } = require("./helpers/factories");

describe("Auth - /me", function () {
  it("should return user for valid token", async function () {
    const app = global.__APP__();
    const signupRes = await signup(app, {
      name: "Me User",
      email: "me@example.com",
      password: "Test@12345",
    });

    const jwt = signupRes.body.data.token;
    const res = await me(app, jwt);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("success", true);
    expect(res.body).to.have.property("data");
    expect(res.body.data).to.have.property("user");
    expect(res.body.data.user).to.have.property("email", "me@example.com");
  });

  it("should reject missing token", async function () {
    const app = global.__APP__();
    const res = await require("supertest")(app).get("/api/auth/me");

    expect([401, 403]).to.include(res.status);
    expect(res.body).to.have.property("success", false);
    expect(res.body).to.have.property("error");
    expect(res.body.error).to.have.property("code");
    expect(res.body.error).to.have.property("message");
  });
});