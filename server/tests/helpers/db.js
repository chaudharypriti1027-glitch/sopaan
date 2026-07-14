import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../src/config/db.js';
import { resetPlatformSettingsCache } from '../../src/services/platformSettingsService.js';

/** Serialize all test DB mutations — prevents overlapping clears. */
let dbQueue = Promise.resolve();

function runExclusive(task) {
  const next = dbQueue.then(task, task);
  dbQueue = next.catch(() => undefined);
  return next;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withDbRetry(task, { retries = 4, baseDelayMs = 25 } = {}) {
  let lastError;
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      return await task();
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      const retryable = /being dropped|not primary|connection|interrupted|closed/i.test(message);
      if (!retryable || attempt === retries - 1) {
        throw err;
      }
      await sleep(baseDelayMs * (attempt + 1));
    }
  }
  throw lastError;
}

async function clearAllCollections() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  const collections = Object.values(mongoose.connection.collections);
  for (const collection of collections) {
    await withDbRetry(() => collection.deleteMany({}));
  }
}

export async function setupTestDatabase() {
  await runExclusive(async () => {
    if (mongoose.connection.readyState === 0) {
      await connectDatabase();
    }
  });
}

export async function clearTestDatabase() {
  await runExclusive(async () => {
    await clearAllCollections();
    resetPlatformSettingsCache();
  });
}

/** Per-suite cleanup — keep the shared in-memory connection open between files. */
export async function teardownTestDatabase() {
  await runExclusive(async () => {
    await clearAllCollections();
    resetPlatformSettingsCache();
  });
}

/** Called once from Jest globalTeardown after all suites finish. */
export async function disconnectTestDatabase() {
  await runExclusive(async () => {
    await clearAllCollections();
    resetPlatformSettingsCache();
    await disconnectDatabase();
  });
}
