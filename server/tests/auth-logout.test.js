import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { withPrivacyConsent } from './helpers/privacy.js';

describe('Auth logout', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('accepts logout with refresh token', async () => {
    const signup = await request(app).post('/api/auth/signup').send(withPrivacyConsent({
      name: 'Logout User',
      email: 'logout@example.com',
      password: 'Password123!',
    }));

    const response = await request(app).post('/api/auth/logout').send({
      refreshToken: signup.body.refreshToken,
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/logged out/i);
  });
});
