const mongoose = require('mongoose');

async function connectMongo(uri) {
  if (!uri) return { connected: false };
  await mongoose.connect(uri);
  return { connected: true };
}

module.exports = { connectMongo };

