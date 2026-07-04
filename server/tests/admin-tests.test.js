import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { Test } from '../src/models/Test.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';

describe('admin test moderation', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  async function loginAdmin() {
    const admin = await createTestUser({
      email: `admin-tests-${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'admin',
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'Password123!' })
      .expect(200);

    return { admin, token: login.body.token };
  }

  it('lists pending tests and moderates with action', async () => {
    const { admin, token } = await loginAdmin();

    const pending = await Test.create({
      title: 'Pending Mock',
      subject: 'Quant',
      topic: 'Mixed',
      difficulty: 'medium',
      durationSec: 1800,
      questions: [],
      type: 'mock',
      examTag: 'SSC CGL',
      createdBy: admin._id,
      status: 'pending_review',
    });

    const list = await request(app)
      .get('/api/admin/tests/pending')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(list.body.items.some((row) => row.id === pending._id.toString())).toBe(true);

    await request(app)
      .post(`/api/admin/tests/${pending._id}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'approve' })
      .expect(200);

    const updated = await Test.findById(pending._id).lean();
    expect(updated.status).toBe('published');

    const after = await request(app)
      .get('/api/admin/tests/pending')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(after.body.items.some((row) => row.id === pending._id.toString())).toBe(false);
  });

  it('keeps AI drafts in pending queue and out of live catalog', async () => {
    const { admin, token } = await loginAdmin();

    const draft = await Test.create({
      title: 'SSC CGL Full Mock · AI',
      subject: 'Mixed',
      topic: 'All Sections',
      difficulty: 'medium',
      durationSec: 2700,
      questions: [],
      type: 'mock',
      examTag: 'SSC CGL',
      createdBy: admin._id,
      status: 'pending_review',
    });

    const pending = await request(app)
      .get('/api/admin/tests/pending')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(pending.body.items.some((row) => row.id === draft._id.toString())).toBe(true);
    expect(pending.body.items.find((row) => row.id === draft._id.toString())?.source).toBe(
      'AI generator',
    );
    expect(await Test.countDocuments({ status: 'published' })).toBe(0);
  });
});
