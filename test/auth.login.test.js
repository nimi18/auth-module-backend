const { expect } = require("chai");
const { signup, login } = require("./helpers/factories");

describe("Auth - Login", function () {
  it("should login successfully", async function () {
    const app = global.__APP__();
    await signup(app, {
      name: "Login User",
      email: "test2@example.com",
      password: "Test@12345",
    });

    const res = await login(app, { email: "test2@example.com", password: "Test@12345" });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("success", true);
    expect(res.body).to.have.property("data");
    expect(res.body.data).to.have.property("token");
    expect(res.body.data).to.have.property("user");
    expect(res.body.data.user.email).to.equal("test2@example.com");
  });

  it("should reject wrong password", async function () {
    const app = global.__APP__();
    await signup(app, {
      name: "Wrong Pass User",
      email: "test3@example.com",
      password: "Test@12345",
    });

    const res = await login(app, { email: "test3@example.com", password: "WrongPass" });

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property("success", false);
    expect(res.body).to.have.property("error");
    expect(res.body.error).to.have.property("code", "INVALID_CREDENTIALS");
  });

  it("should reject unknown email", async function () {
    const app = global.__APP__();
    const res = await login(app, { email: "nouser@example.com", password: "Test@12345" });

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property("success", false);
    expect(res.body).to.have.property("error");
    expect(res.body.error).to.have.property("code", "INVALID_CREDENTIALS");
  });
});