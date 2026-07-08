import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { withPrivacyConsent } from './helpers/privacy.js';

describe('Planner generate API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  async function signupToken() {
    const response = await request(app)
      .post('/api/auth/signup')
      .send(
        withPrivacyConsent({
          name: 'Planner User',
          email: `planner_${Date.now()}@test.com`,
          password: 'Password123!',
        }),
      )
    expect(response.status).toBe(201);
    return response.body.accessToken;
  }

  it('generates a plan for users without an existing student profile', async () => {
    const token = await signupToken();

    const response = await request(app)
      .post('/api/planner/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(201);
    expect(response.body.summary).toEqual(expect.any(String));
    expect(Array.isArray(response.body.sessions)).toBe(true);
    expect(response.body.sessions.length).toBeGreaterThan(0);
    expect(response.body.meta).toMatchObject({
      dailyGoalMinutes: expect.any(Number),
    });
  });
});
