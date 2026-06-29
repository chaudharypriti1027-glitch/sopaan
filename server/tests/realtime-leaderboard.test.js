import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import { Attempt } from '../src/models/Attempt.js';
import { Test } from '../src/models/Test.js';
import { buildLiveMockLeaderboard } from '../src/realtime/liveLeaderboard.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';

describe('live mock leaderboard', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('ranks attempts by score then time', async () => {
    const creator = await createTestUser({
      name: 'Creator',
      email: 'creator@test.com',
      passwordHash: 'hash',
      role: 'student',
    });

    const test = await Test.create({
      title: 'Live mock',
      subject: 'Math',
      topic: 'Algebra',
      difficulty: 'easy',
      durationSec: 3600,
      examTag: 'SSC',
      type: 'mock',
      status: 'published',
      createdBy: creator._id,
      questions: [],
    });

    const fast = await createTestUser({
      name: 'Fast Finisher',
      email: 'fast@test.com',
      passwordHash: 'hash',
      role: 'student',
    });
    const top = await createTestUser({
      name: 'Top Scorer',
      email: 'top@test.com',
      passwordHash: 'hash',
      role: 'student',
    });

    await Attempt.create({
      userId: top._id,
      testId: test._id,
      answers: [],
      score: 40,
      accuracy: 100,
      totalTimeSec: 1800,
    });
    await Attempt.create({
      userId: fast._id,
      testId: test._id,
      answers: [],
      score: 38,
      accuracy: 95,
      totalTimeSec: 900,
    });

    const entries = await buildLiveMockLeaderboard(test._id);

    expect(entries[0].name).toBe('Top Scorer');
    expect(entries[0].rank).toBe(1);
    expect(entries[1].name).toBe('Fast Finisher');
  });
});
