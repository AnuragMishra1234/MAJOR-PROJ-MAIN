import mongoose from 'mongoose';

/**
 * Connect to MongoDB Atlas.
 * Retries automatically via Mongoose's built-in reconnect behavior.
 * Will NOT crash the server on failure — logs and continues so health
 * endpoint remains reachable.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('[DB] ❌  MONGO_URI environment variable is not set.');
    return;
  }

  if (uri.includes('<db_password>')) {
    console.warn('[DB] ⚠️  MONGO_URI contains placeholder <db_password>. MongoDB will NOT connect until the real password is provided.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[DB] ✅  MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[DB] ❌  MongoDB connection failed: ${error.message}`);
    // Do not crash the process — allow the server to boot without DB
    // so health check and non-DB routes still respond.
  }
};

export default connectDB;
