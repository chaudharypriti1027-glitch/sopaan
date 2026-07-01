import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { withPrivacyConsent } from './helpers/privacy.js';
import { resetRefreshStoreForTests } from '../src/lib/refreshTokenStore.js';

const STRONG_PASSWORD = 'Password123!';

describe('Security hardening', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
    resetRefreshStoreForTests();
  });

  it('rejects weak passwords at signup', async () => {
    const response = await request(app).post('/api/auth/signup').send(withPrivacyConsent({
      name: 'Weak Password User',
      email: 'weak@example.com',
      password: 'password123',
    }));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects passwords without a symbol', async () => {
    const response = await request(app).post('/api/auth/signup').send(withPrivacyConsent({
      name: 'No Symbol User',
      email: 'nosymbol@example.com',
      password: 'Password123',
    }));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rotates refresh tokens on refresh', async () => {
    const signup = await request(app).post('/api/auth/signup').send(withPrivacyConsent({
      name: 'Rotate User',
      email: 'rotate@example.com',
      password: STRONG_PASSWORD,
    }));

    const first = await request(app).post('/api/auth/refresh').send({
      refreshToken: signup.body.refreshToken,
    });

    expect(first.status).toBe(200);
    expect(first.body.refreshToken).toEqual(expect.any(String));
    expect(first.body.refreshToken).not.toBe(signup.body.refreshToken);

    const second = await request(app).post('/api/auth/refresh').send({
      refreshToken: first.body.refreshToken,
    });

    expect(second.status).toBe(200);
  });

  it('detects refresh token reuse and revokes the session family', async () => {
    const signup = await request(app).post('/api/auth/signup').send(withPrivacyConsent({
      name: 'Reuse User',
      email: 'reuse@example.com',
      password: STRONG_PASSWORD,
    }));

    const originalRefresh = signup.body.refreshToken;

    const rotated = await request(app).post('/api/auth/refresh').send({
      refreshToken: originalRefresh,
    });

    expect(rotated.status).toBe(200);

    const reuse = await request(app).post('/api/auth/refresh').send({
      refreshToken: originalRefresh,
    });

    expect(reuse.status).toBe(401);
    expect(reuse.body.error.code).toBe('TOKEN_REUSE');

    const rotatedAgain = await request(app).post('/api/auth/refresh').send({
      refreshToken: rotated.body.refreshToken,
    });

    expect(rotatedAgain.status).toBe(401);
  });

  it('blocks access to another users attempt', async () => {
    await request(app).post('/api/auth/signup').send(withPrivacyConsent({
      name: 'Owner',
      email: 'owner@example.com',
      password: STRONG_PASSWORD,
    }));

    const other = await request(app).post('/api/auth/signup').send(withPrivacyConsent({
      name: 'Other',
      email: 'other@example.com',
      password: STRONG_PASSWORD,
    }));

    const response = await request(app)
      .get('/api/attempts/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${other.body.accessToken}`);

    expect([403, 404]).toContain(response.status);
  });

  it('rejects invalid object ids on attempt routes', async () => {
    const signup = await request(app).post('/api/auth/signup').send(withPrivacyConsent({
      name: 'Invalid Id',
      email: 'invalid-id@example.com',
      password: STRONG_PASSWORD,
    }));

    const response = await request(app)
      .get('/api/attempts/not-an-object-id')
      .set('Authorization', `Bearer ${signup.body.accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
