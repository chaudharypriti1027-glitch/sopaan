import { describe, expect, it, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { signAccessToken } from '../src/utils/jwt.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';

function authHeader(user) {
  return { Authorization: `Bearer ${signAccessToken(user)}` };
}

describe('POST /api/media/image', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('returns 503 when Cloudinary is not configured in tests', async () => {
    const user = await User.create({
      name: 'Media User',
      phone: '+919876543210',
      state: 'Gujarat',
      targetExam: 'SSC CGL',
    });

    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );

    const response = await request(app)
      .post('/api/media/image')
      .set(authHeader(user))
      .attach('image', pngBuffer, {
        filename: 'scan.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('STORAGE_UNAVAILABLE');
  });

  it('requires authentication', async () => {
    const response = await request(app).post('/api/media/image');
    expect(response.status).toBe(401);
  });
});
