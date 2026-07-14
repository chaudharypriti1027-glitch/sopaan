import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';

async function loginAdmin() {
  const admin = await createTestUser({
    email: `admin-sys-${Date.now()}@test.com`,
    password: 'Password123!',
    role: 'admin',
  });

  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: admin.email, password: 'Password123!' })
    .expect(200);

  return login.body.token;
}

describe('GET /api/admin/system-check', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('returns health, integration, and content checks for admins', async () => {
    const token = await loginAdmin();

    const response = await request(app)
      .get('/api/admin/system-check')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'api' }),
        expect.objectContaining({ id: 'mongodb' }),
        expect.objectContaining({ id: 'uploads' }),
      ]),
    );
    expect(response.body.content).toMatchObject({
      coursesPublished: expect.any(Number),
      mediaTotal: expect.any(Number),
    });
    expect(response.body.assessedAt).toBeTruthy();
  });
});
