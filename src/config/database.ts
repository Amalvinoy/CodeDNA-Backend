import mongoose from 'mongoose';
import { env } from './env';

const DATABASE_NAME = 'CodeDNA';

let isConnected = false;

export const connectDatabase = async (): Promise<boolean> => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return true;
  }

  const uri = env.MONGODB_URI;

  if (!uri) {
    console.warn(
      '⚠️ MONGODB_URI is not defined in environment variables. Database connection skipped.'
    );
    isConnected = false;
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: DATABASE_NAME,
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });

    isConnected = true;
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.error('❌ MongoDB Connection Error:', error instanceof Error ? error.message : error);
    return false;
  }
};

export const isDatabaseConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

export const disconnectDatabase = async (): Promise<void> => {
  if (!isConnected && mongoose.connection.readyState === 0) return;

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB disconnected successfully.');
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('⚠️ MongoDB connection lost.');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  console.log('🔄 MongoDB connection restored.');
});
