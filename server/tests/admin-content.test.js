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

  it('creates a course with lessons and updates them', async () => {
    const token = await loginAdmin();

    const created = await request(app)
      .post('/api/admin/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Reasoning Mastery',
        subject: 'Reasoning',
        isFree: true,
        status: 'draft',
        lessons: [
          {
            title: 'Intro to puzzles',
            order: 1,
            notes: 'Key patterns for SSC',
            durationSec: 900,
          },
        ],
      })
      .expect(201);

    const courseId = created.body.id ?? created.body._id;
    expect(created.body.lessons).toHaveLength(1);
    expect(created.body.lessons[0].title).toBe('Intro to puzzles');

    const lessonId = created.body.lessons[0]._id ?? created.body.lessons[0].id;

    const updated = await request(app)
      .put(`/api/admin/courses/${courseId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        lessons: [
          {
            _id: lessonId,
            title: 'Intro to puzzles (updated)',
            order: 1,
            videoUrl: 'https://cdn.example.com/lesson-1.mp4',
            durationSec: 1200,
            notes: 'Updated notes',
          },
          {
            title: 'Seating arrangement',
            order: 2,
            notes: 'Practice set included',
          },
        ],
      })
      .expect(200);

    expect(updated.body.lessons).toHaveLength(2);
    expect(updated.body.lessons[0].videoUrl).toContain('lesson-1.mp4');
  });

  it('stores downloadable lesson material for students', async () => {
    const token = await loginAdmin();
    const materialUrl = 'http://localhost:4000/uploads/media/test-notes.pdf';

    const created = await request(app)
      .post('/api/admin/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'GK Capsule',
        subject: 'GK',
        isFree: true,
        status: 'published',
        lessons: [
          {
            title: 'Weekly digest PDF',
            order: 1,
            materialUrl,
            materialName: 'gk-week-1.pdf',
            notes: 'Read the attached PDF before the quiz.',
          },
        ],
      })
      .expect(201);

    const courseId = created.body.id ?? created.body._id;
    expect(created.body.lessons[0].materialUrl).toBe(materialUrl);
    expect(created.body.lessons[0].materialName).toBe('gk-week-1.pdf');

    const student = await createTestUser({
      email: `student-material-${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'student',
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: student.email, password: 'Password123!' })
      .expect(200);

    const detail = await request(app)
      .get(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);

    expect(detail.body.lessons[0].materialUrl).toBe(materialUrl);
    expect(detail.body.lessons[0].materialName).toBe('gk-week-1.pdf');
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
