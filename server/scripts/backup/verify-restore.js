#!/usr/bin/env node
/**
 * Post-restore verification — collection presence, counts, and index smoke check.
 *
 * Usage:
 *   cd server && npm run backup:verify-restore
 *   MONGODB_URI=mongodb+srv://... npm run backup:verify-restore
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { drConfig } from '../../src/config/drConfig.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('[verify-restore] MONGODB_URI is required');
  process.exit(1);
}

const failures = [];

async function verifyCollection(db, name) {
  const collections = await db.listCollections({ name }).toArray();
  if (collections.length === 0) {
    failures.push(`Collection missing: ${name}`);
    return;
  }

  const count = await db.collection(name).countDocuments();
  const min = drConfig.verifyMinCounts[name] ?? 0;
  if (count < min) {
    failures.push(`Collection ${name}: count ${count} < minimum ${min}`);
  } else {
    console.log(`[verify-restore] OK ${name}: ${count} documents`);
  }
}

async function verifyIndexes(db) {
  const attempts = await db.collection('attempts').indexes();
  if (attempts.length < 2) {
    failures.push('attempts collection has fewer than 2 indexes (expected userId/createdAt)');
  } else {
    console.log(`[verify-restore] OK attempts indexes: ${attempts.length}`);
  }
}

async function main() {
  console.log('[verify-restore] Connecting…');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

  try {
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log('[verify-restore] Ping OK');

    const db = mongoose.connection.db;
    for (const name of drConfig.verifyCollections) {
      await verifyCollection(db, name);
    }
    await verifyIndexes(db);

    if (failures.length > 0) {
      console.error('[verify-restore] FAILED:');
      for (const f of failures) {
        console.error(`  - ${f}`);
      }
      process.exit(1);
    }

    console.log('[verify-restore] All checks passed');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('[verify-restore] Error:', err.message);
  process.exit(1);
});
