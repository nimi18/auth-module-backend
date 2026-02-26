// test/helpers/db.js
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer = null;

async function connectTestDb() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Keep env available (some config reads it)
  process.env.MONGODB_URI = uri;

  await mongoose.connect(uri, {
    dbName: "test",
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });
}

async function clearTestDb() {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  const collections = mongoose.connection.collections;
  const keys = Object.keys(collections);

  for (let i = 0; i < keys.length; i++) {
    const name = keys[i];
    await collections[name].deleteMany({});
  }
}

async function closeTestDb() {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  } finally {
    if (mongoServer) {
      await mongoServer.stop();
      mongoServer = null;
    }
  }
}

module.exports = {
  connectTestDb,
  clearTestDb,
  closeTestDb,
};