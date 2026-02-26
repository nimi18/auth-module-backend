// test/auth.signup.test.js
const { expect } = require("chai");
const { signup } = require("./helpers/factories");

describe("Auth - Signup", function () {
  it("should signup successfully", async function () {
    const app = global.__APP__();
    const res = await signup(app, { name: "Test User", email: "test1@example.com", password: "Test@12345" });

    expect(res.status).to.equal(200); // you can later change API to 201 and update test
    expect(res.body).to.have.property("success", true);
    expect(res.body).to.have.property("data");
    expect(res.body.data).to.have.property("user");
    expect(res.body.data).to.have.property("token");
    expect(res.body.data.user).to.have.property("email", "test1@example.com");
  });

  it("should block duplicate email signup", async function () {
    const app = global.__APP__();
    await signup(app, { name: "Dup User", email: "dup@example.com", password: "Test@12345" });

    const res2 = await signup(app, { name: "Dup User", email: "dup@example.com", password: "Test@12345" });

    expect(res2.status).to.equal(400);
    expect(res2.body).to.have.property("success", false);
    expect(res2.body).to.have.property("error");
    expect(res2.body.error).to.have.property("code", "EMAIL_EXISTS");
    expect(res2.body.error).to.have.property("message");
  });

  it("should reject missing fields", async function () {
    const app = global.__APP__();
    const res = await signup(app, { name: "", email: "", password: "" });

    expect([400, 422]).to.include(res.status);
    expect(res.body).to.have.property("success", false);
    expect(res.body).to.have.property("error");
    expect(res.body.error).to.have.property("message");
    expect(res.body.error).to.have.property("code");
  });
});