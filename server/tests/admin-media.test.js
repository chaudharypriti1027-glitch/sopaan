import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { Media } from '../src/models/Media.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';

async function loginAdmin() {
  const admin = await createTestUser({
    email: `admin-media-${Date.now()}@test.com`,
    password: 'Password123!',
    role: 'admin',
  });

  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: admin.email, password: 'Password123!' })
    .expect(200);

  return login.body.token;
}

describe('admin media library', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('presigns, uploads directly in dev, lists, and deletes media', async () => {
    const token = await loginAdmin();

    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );

    const presign = await request(app)
      .post('/api/admin/media')
      .set('Authorization', `Bearer ${token}`)
      .send({
        action: 'presign',
        filename: 'cover.png',
        mimeType: 'image/png',
        sizeBytes: png.length,
      })
      .expect(200);

    expect(presign.body.mode).toBe('direct');
    expect(presign.body.uploadToken).toBeTruthy();
    expect(presign.body.publicUrl).toContain('/uploads/');

    const uploaded = await request(app)
      .post('/api/admin/media/upload')
      .set('Authorization', `Bearer ${token}`)
      .field('uploadToken', presign.body.uploadToken)
      .attach('file', png, { filename: 'cover.png', contentType: 'image/png' })
      .expect(201);

    expect(uploaded.body.url).toBeTruthy();
    expect(uploaded.body.type).toBe('image/png');

    const list = await request(app)
      .get('/api/admin/media?kind=image')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0].url).toBe(uploaded.body.url);

    const mediaId = uploaded.body.id ?? uploaded.body._id;

    await request(app)
      .delete(`/api/admin/media/${mediaId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(await Media.countDocuments()).toBe(0);
  });
});
