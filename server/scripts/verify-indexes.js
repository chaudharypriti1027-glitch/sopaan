#!/usr/bin/env node
/**
 * Verifies MongoDB indexes for common query patterns using explain().
 *
 * Usage: node scripts/verify-indexes.js
 * Requires MONGODB_URI (loads from server/.env via dotenv).
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const QUERIES = [
  {
    name: 'Attempt leaderboard aggregate',
    collection: 'attempts',
    run: (db) =>
      db.collection('attempts').aggregate([
        { $match: { accuracy: { $ne: null } } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$userId', avgAccuracy: { $avg: '$accuracy' } } },
        { $limit: 20 },
      ]),
  },
  {
    name: 'Attempt by user timeline',
    collection: 'attempts',
    run: (db) =>
      db.collection('attempts').find({ userId: new mongoose.Types.ObjectId() }).sort({ createdAt: -1 }).limit(50),
  },
  {
    name: 'CurrentAffair published list',
    collection: 'currentaffairs',
    run: (db) =>
      db.collection('currentaffairs').find({ status: 'published' }).sort({ publishedAt: -1 }).limit(20),
  },
  {
    name: 'CurrentAffairDigest by date',
    collection: 'currentaffairdigests',
    run: (db) =>
      db.collection('currentaffairdigests').find({ digestDate: new Date(), status: 'published' }).limit(1),
  },
  {
    name: 'Exam calendar dates',
    collection: 'exams',
    run: (db) =>
      db.collection('exams').aggregate([
        { $match: { status: 'published' } },
        { $unwind: '$importantDates' },
        { $match: { 'importantDates.date': { $gte: new Date() } } },
        { $sort: { 'importantDates.date': 1 } },
        { $limit: 50 },
      ]),
  },
  {
    name: 'FlashcardReview due cards',
    collection: 'flashcardreviews',
    run: (db) =>
      db.collection('flashcardreviews').find({ userId: new mongoose.Types.ObjectId(), dueDate: { $lte: new Date() } }),
  },
  {
    name: 'PlannerSession by user date',
    collection: 'plannersessions',
    run: (db) =>
      db.collection('plannersessions').find({ userId: new mongoose.Types.ObjectId(), date: new Date() }).sort({ startTime: 1 }),
  },
  {
    name: 'Referral by referrer',
    collection: 'referrals',
    run: (db) =>
      db.collection('referrals').find({ referrerId: new mongoose.Types.ObjectId() }).sort({ createdAt: -1 }).limit(20),
  },
  {
    name: 'PaymentOrder history',
    collection: 'paymentorders',
    run: (db) =>
      db.collection('paymentorders').find({ userId: new mongoose.Types.ObjectId() }).sort({ createdAt: -1 }).limit(20),
  },
  {
    name: 'LiveClass upcoming',
    collection: 'liveclasses',
    run: (db) =>
      db.collection('liveclasses').find({ status: 'scheduled', scheduledAt: { $gte: new Date() } }).sort({ scheduledAt: 1 }).limit(20),
  },
];

function summarize(plan) {
  if (plan?.queryPlanner?.winningPlan) {
    return plan.queryPlanner.winningPlan;
  }

  if (plan?.stages) {
    const stage = plan.stages.find((item) => item.$cursor?.queryPlanner);
    return stage?.$cursor?.queryPlanner?.winningPlan ?? 'unknown';
  }

  return plan?.executionStats?.executionStages?.stage ?? 'unknown';
}

async function main() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MONGODB_URI is required');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  console.log('Index verification (explain plans)\n');

  let issues = 0;

  for (const query of QUERIES) {
    const cursor = query.run(db);
    const explain = await cursor.explain('executionStats');
    const plan = summarize(explain);
    const ok = !String(plan).toLowerCase().includes('collscan');
    const marker = ok ? 'OK' : 'WARN';

    if (!ok) {
      issues += 1;
    }

    console.log(`[${marker}] ${query.name}`);
    console.log(`      collection=${query.collection} plan=${plan}\n`);
  }

  await mongoose.disconnect();

  if (issues > 0) {
    console.log(`${issues} query pattern(s) may need index tuning (COLLSCAN detected).`);
    process.exit(1);
  }

  console.log('All checked query patterns avoid collection scans.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
