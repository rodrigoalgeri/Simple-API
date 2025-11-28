const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    mongoServer = await MongoMemoryServer.create();
  }
  const connUri = uri || mongoServer.getUri();
  await mongoose.connect(connUri, { dbName: process.env.MONGODB_DB || 'orders' });
  return mongoose.connection;
}

module.exports = { connectDB };

