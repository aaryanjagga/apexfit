const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;

    // Detect if placeholder is left or no URI provided
    const isPlaceholder = !mongoUri || mongoUri.includes('PASTE_YOUR_MONGODB_CONNECTION_STRING_HERE');

    if (isPlaceholder) {
      console.log('⚠️  [MongoDB] MONGODB_URI not configured or using placeholder.');
      console.log('⚡ [MongoDB] Spinning up in-memory MongoDB for local test & development...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        mongoUri = memoryServer.getUri();
        console.log(`✅ [MongoDB] In-Memory MongoDB running at: ${mongoUri}`);
      } catch (err) {
        console.error('❌ [MongoDB] Failed to start MongoMemoryServer fallback:', err.message);
        throw err;
      }
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });

    console.log(`🚀 [MongoDB] Connected successfully: ${conn.connection.host} (DB: ${conn.connection.name})`);
    return conn;
  } catch (error) {
    console.error(`❌ [MongoDB] Connection error: ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
    console.log('🛑 [MongoDB] Disconnected.');
  } catch (err) {
    console.error('Error disconnecting MongoDB:', err);
  }
};

module.exports = { connectDB, disconnectDB };
