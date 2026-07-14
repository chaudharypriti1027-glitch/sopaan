import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { Course } from '../src/models/Course.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';

async function loginStudent() {
  const student = await createTestUser({
    email: `student-courses-${Date.now()}@test.com`,
    password: 'Password123!',
    role: 'student',
  });

  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: student.email, password: 'Password123!' })
    .expect(200);

  return login.body.token;
}

describe('student courses API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('returns only published courses with lesson material fields', async () => {
    await Course.create({
      title: 'Draft course',
      subject: 'Math',
      status: 'draft',
      lessons: [{ title: 'Hidden', order: 1, notes: 'secret' }],
    });

    await Course.create({
      title: 'Published GK',
      subject: 'GK',
      status: 'published',
      isFree: true,
      lessons: [
        {
          title: 'PDF capsule',
          order: 1,
          materialUrl: 'http://localhost:4000/uploads/media/capsule.pdf',
          materialName: 'capsule.pdf',
        },
      ],
    });

    const token = await loginStudent();

    const list = await request(app)
      .get('/api/courses?limit=20')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0].title).toBe('Published GK');

    const courseId = list.body.items[0]._id ?? list.body.items[0].id;
    const detail = await request(app)
      .get(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(detail.body.lessons[0].materialUrl).toContain('capsule.pdf');
    expect(detail.body.lessons[0].materialName).toBe('capsule.pdf');
  });
});
