import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { Attempt } from '../src/models/Attempt.js';
import { Test } from '../src/models/Test.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';

describe('Leaderboard API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  async function loginToken(user) {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'Password123!' });
    return login.body.token;
  }

  it('requires authentication', async () => {
    const response = await request(app).get('/api/leaderboard');
    expect(response.status).toBe(401);
  });

  it('returns ranked entries, pagination and the requesting user standing', async () => {
    const creator = await createTestUser({ name: 'Creator', email: 'creator@test.com' });
    const top = await createTestUser({ name: 'Top Scorer', email: 'top@test.com' });
    const runnerUp = await createTestUser({ name: 'Runner Up', email: 'runner@test.com' });
    const viewer = await createTestUser({ name: 'Viewer', email: 'viewer@test.com' });

    const test = await Test.create({
      title: 'Leaderboard mock',
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

    await Attempt.create({
      userId: top._id,
      testId: test._id,
      answers: [],
      score: 40,
      accuracy: 95,
      totalTimeSec: 1800,
    });
    await Attempt.create({
      userId: runnerUp._id,
      testId: test._id,
      answers: [],
      score: 30,
      accuracy: 80,
      totalTimeSec: 1800,
    });

    const token = await loginToken(viewer);

    const response = await request(app)
      .get('/api/leaderboard')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);

    // Regression guard: the mobile app reads `items`, not `entries`.
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.entries).toBeUndefined();
    expect(response.body.pagination).toMatchObject({
      total: 2,
      limit: expect.any(Number),
      offset: 0,
      hasMore: false,
    });

    expect(response.body.items).toHaveLength(2);
    expect(response.body.items[0]).toMatchObject({
      rank: 1,
      name: 'Top Scorer',
      avgAccuracy: 95,
    });
    expect(response.body.items[1]).toMatchObject({
      rank: 2,
      name: 'Runner Up',
      avgAccuracy: 80,
    });

    expect(response.body.you).toMatchObject({
      rank: null,
      name: 'Viewer',
      avgAccuracy: 0,
      attempts: 0,
    });
    expect(response.body.updatedAt).toEqual(expect.any(String));
    expect(response.body.period).toBe('all-time');
    expect(response.body.meta).toMatchObject({
      totalPlayers: 2,
      onlineNow: expect.any(Number),
      season: {
        label: expect.stringContaining('SEASON'),
        endsAt: expect.any(String),
      },
    });
    expect(response.body.items[0].rankDelta).toBeDefined();
  });

  it('ranks the requesting user relative to everyone else even off the current page', async () => {
    const creator = await createTestUser({ name: 'Creator', email: 'creator2@test.com' });
    const top = await createTestUser({ name: 'Top Scorer', email: 'top2@test.com' });
    const viewer = await createTestUser({ name: 'Middling Viewer', email: 'viewer2@test.com' });

    const test = await Test.create({
      title: 'Leaderboard mock 2',
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

    await Attempt.create({
      userId: top._id,
      testId: test._id,
      answers: [],
      score: 40,
      accuracy: 95,
      totalTimeSec: 1800,
    });
    await Attempt.create({
      userId: viewer._id,
      testId: test._id,
      answers: [],
      score: 25,
      accuracy: 60,
      totalTimeSec: 1800,
    });

    const token = await loginToken(viewer);

    const response = await request(app)
      .get('/api/leaderboard')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.you).toMatchObject({
      rank: 2,
      name: 'Middling Viewer',
      avgAccuracy: 60,
      attempts: 1,
    });
  });
});
