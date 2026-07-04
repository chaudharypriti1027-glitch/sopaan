import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { CurrentAffair } from '../src/models/CurrentAffair.js';
import { Exam } from '../src/models/Exam.js';
import { Course } from '../src/models/Course.js';
import { Question } from '../src/models/Question.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';

async function loginAdmin() {
  const admin = await createTestUser({
    email: `admin-content-${Date.now()}@test.com`,
    password: 'Password123!',
    role: 'admin',
  });

  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: admin.email, password: 'Password123!' })
    .expect(200);

  return login.body.token;
}

describe('admin content resources', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('creates, updates, publishes, and deletes an exam', async () => {
    const token = await loginAdmin();

    const created = await request(app)
      .post('/api/admin/exams')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'SSC CGL', code: 'ssc-cgl', category: 'SSC', status: 'draft' })
      .expect(201);

    const examId = created.body._id ?? created.body.id;
    expect(created.body.name).toBe('SSC CGL');
    expect(created.body.code).toBe('SSC-CGL');

    await request(app)
      .put(`/api/admin/exams/${examId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Updated overview' })
      .expect(200);

    const published = await request(app)
      .patch(`/api/admin/exams/${examId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'published' })
      .expect(200);

    expect(published.body.status).toBe('published');

    await request(app)
      .delete(`/api/admin/exams/${examId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(await Exam.countDocuments()).toBe(0);
  });

  it('creates and lists courses', async () => {
    const token = await loginAdmin();

    await request(app)
      .post('/api/admin/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Quant Basics', subject: 'Quant', isFree: true, status: 'draft' })
      .expect(201);

    const list = await request(app)
      .get('/api/admin/courses?limit=10')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0].title).toBe('Quant Basics');
    expect(await Course.countDocuments()).toBe(1);
  });

  it('generates AI summary and quiz for a current affair', async () => {
    const token = await loginAdmin();

    const created = await request(app)
      .post('/api/admin/current-affairs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'New education policy update',
        category: 'Polity',
        publishedAt: new Date().toISOString(),
        status: 'draft',
      })
      .expect(201);

    const affairId = created.body._id ?? created.body.id;

    const enriched = await request(app)
      .post(`/api/admin/current-affairs/${affairId}/ai`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(200);

    expect(enriched.body.summary).toBeTruthy();
    expect(enriched.body.quizQuestions?.length ?? 0).toBe(3);

    const affair = await CurrentAffair.findById(affairId).lean();
    expect(affair?.quizQuestions?.length).toBe(3);
    expect(await Question.countDocuments()).toBe(3);
  });
});
