// test/setup.js
const nock = require("nock");
const sinon = require("sinon");
const { connectTestDb, clearTestDb, closeTestDb } = require("./helpers/db");

let app = null;

function getApp() {
  if (!app) {
    // app should be required only after env/db are ready
    const createApp = require("../src/app"); // exports createApp
    app = createApp(); // instantiate express app once
  }
  return app;
}

async function globalSetup() {
  process.env.NODE_ENV = "test";

  process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

  process.env.GOOGLE_CLIENT_ID =
    process.env.GOOGLE_CLIENT_ID || "test_google_client_id";
  process.env.FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || "test_fb_app_id";
  process.env.FACEBOOK_APP_SECRET =
    process.env.FACEBOOK_APP_SECRET || "test_fb_app_secret";

  process.env.BREVO_API_KEY = process.env.BREVO_API_KEY || "test_brevo_key";
  process.env.BREVO_SENDER_EMAIL =
    process.env.BREVO_SENDER_EMAIL || "no-reply@test.com";

  await connectTestDb();

  // Block external calls
  nock.disableNetConnect();
  nock.enableNetConnect("127.0.0.1");
}

async function globalTeardown() {
  nock.cleanAll();
  nock.enableNetConnect();
  sinon.restore();
  await closeTestDb();
}

async function perTestSetup() {
  await clearTestDb();
  sinon.restore();
  nock.cleanAll();
}

module.exports = {
  globalSetup,
  globalTeardown,
  perTestSetup,
  getApp,
};