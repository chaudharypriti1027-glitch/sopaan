import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../src/config/db.js';

export async function setupTestDatabase() {
  await connectDatabase();
}

export async function clearTestDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
  }
}

export async function teardownTestDatabase() {
  await clearTestDatabase();
  await disconnectDatabase();
}
