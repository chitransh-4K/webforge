import mongoose from 'mongoose';

let isInMemoryFallback = false;

export function getIsInMemoryFallback() {
  return isInMemoryFallback;
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '' && uri !== 'memory') {
    try {
      console.log(`[DB] Connecting to MongoDB at ${uri.replace(/\/\/.*@/, '//<credentials>@')}...`);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log('[DB] Connected to MongoDB successfully.');
      return;
    } catch (err) {
      console.warn('[DB] Failed to connect to MONGODB_URI. Falling back to built-in in-memory store:', err.message);
    }
  }

  // Use mongodb-memory-server for local dev without external MongoDB
  console.log('[DB] No external MONGODB_URI configured. Starting in-memory MongoDB...');
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const memUri = mongod.getUri();
    await mongoose.connect(memUri);
    isInMemoryFallback = true;
    console.log(`[DB] Connected to in-memory MongoDB at ${memUri}`);
  } catch (err) {
    console.error('[DB] Failed to start in-memory MongoDB:', err.message);
    console.warn('[DB] Server will start without database. Auth and cloud features will not work.');
    isInMemoryFallback = true;
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
