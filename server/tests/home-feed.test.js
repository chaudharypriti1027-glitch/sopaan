import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { withPrivacyConsent } from './helpers/privacy.js';

describe('Home feed API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  async function signupAndSetGoal() {
    const signup = await request(app).post('/api/auth/signup').send(
      withPrivacyConsent({
        name: 'Feed User',
        email: 'feed@example.com',
        password: 'Password123!',
      }),
    );

    const token = signup.body.accessToken;

    await request(app)
      .put('/api/profile/goal')
      .set('Authorization', `Bearer ${token}`)
      .send({ examTrack: 'SSC CGL', targetYear: 2026 });

    return token;
  }

  it('returns aggregated home feed for authenticated user at GET /api/home', async () => {
    const token = await signupAndSetGoal();

    const response = await request(app)
      .get('/api/home')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.headers.etag).toEqual(`"${response.body.generatedAt}"`);
    expect(response.headers['last-modified']).toEqual(expect.any(String));
    expect(response.body.greeting).toMatchObject({
      name: 'Feed User',
      message: expect.any(String),
      dateLabel: expect.any(String),
      unreadCount: expect.any(Number),
    });
    expect(response.body.streak).toMatchObject({
      current: expect.any(Number),
      best: expect.any(Number),
      freezes: expect.any(Number),
      todayDone: expect.any(Boolean),
    });
    expect(response.body.rank).toMatchObject({
      air: null,
      percentile: null,
      deltaWeek: expect.any(Number),
      ringPct: expect.any(Number),
    });
    expect(Array.isArray(response.body.continue)).toBe(true);
    expect(Array.isArray(response.body.aiNudges)).toBe(true);
    expect(response.body.aiNudges.length).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(response.body.quickActions)).toBe(true);
    expect(response.body.quickActions.length).toBeGreaterThanOrEqual(4);
    expect(Array.isArray(response.body.recommendedTests)).toBe(true);
    expect(Array.isArray(response.body.currentAffairs)).toBe(true);
    expect(response.body.generatedAt).toEqual(expect.any(String));
  });

  it('returns 304 when If-None-Match matches ETag', async () => {
    const token = await signupAndSetGoal();

    const first = await request(app)
      .get('/api/home')
      .set('Authorization', `Bearer ${token}`);

    const second = await request(app)
      .get('/api/home')
      .set('Authorization', `Bearer ${token}`)
      .set('If-None-Match', first.headers.etag);

    expect(second.status).toBe(304);
  });

  it('POST /api/home/refresh busts cache and returns a fresh feed', async () => {
    const token = await signupAndSetGoal();

    const first = await request(app)
      .get('/api/home')
      .set('Authorization', `Bearer ${token}`);

    await new Promise((resolve) => setTimeout(resolve, 5));

    const refreshed = await request(app)
      .post('/api/home/refresh')
      .set('Authorization', `Bearer ${token}`);

    expect(refreshed.status).toBe(200);
    expect(refreshed.body.generatedAt).not.toBe(first.body.generatedAt);
    expect(Array.isArray(refreshed.body.aiNudges)).toBe(true);
  });

  it('keeps GET /api/home/feed as a deprecated alias', async () => {
    const token = await signupAndSetGoal();

    const response = await request(app)
      .get('/api/home/feed')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.greeting.name).toBe('Feed User');
  });

  it('requires authentication', async () => {
    const response = await request(app).get('/api/home');
    expect(response.status).toBe(401);
  });
});
