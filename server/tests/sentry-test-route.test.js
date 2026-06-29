import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';

const { default: app } = await import('../src/app.js');

describe('Sentry test route', () => {
  const originalSecret = process.env.SENTRY_TEST_SECRET;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
    if (originalSecret === undefined) {
      delete process.env.SENTRY_TEST_SECRET;
    } else {
      process.env.SENTRY_TEST_SECRET = originalSecret;
    }
  });

  beforeEach(async () => {
    await clearTestDatabase();
    process.env.SENTRY_TEST_SECRET = 'test-sentry-secret';
  });

  it('returns 404 without the test secret header', async () => {
    const response = await request(app).get('/api/health/sentry-test');
    expect(response.status).toBe(404);
  });

  it('throws a test error when the secret header matches', async () => {
    const response = await request(app)
      .get('/api/health/sentry-test')
      .set('x-sentry-test-secret', 'test-sentry-secret');

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
  });
});
