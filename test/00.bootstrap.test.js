const { before, after, beforeEach } = require("mocha");
const { globalSetup, globalTeardown, perTestSetup, getApp } = require("./setup");

before(async function () {
  this.timeout(60000); // allow MongoMemoryServer startup
  await globalSetup();
});

beforeEach(async function () {
  await perTestSetup();
});

after(async function () {
  await globalTeardown();
});

global.__APP__ = function () {
  return getApp();
};