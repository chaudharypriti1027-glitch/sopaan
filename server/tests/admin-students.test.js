import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';

async function loginAdmin() {
  const admin = await createTestUser({
    email: `admin-students-${Date.now()}@test.com`,
    password: 'Password123!',
    role: 'admin',
  });

  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: admin.email, password: 'Password123!' })
    .expect(200);

  return login.body.token;
}

describe('admin students management', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('searches students server-side and exports CSV', async () => {
    const token = await loginAdmin();
    await createTestUser({
      email: `alpha-student-${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'student',
      name: 'Alpha Student',
      targetExam: 'SSC',
    });
    await createTestUser({
      email: `beta-student-${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'student',
      name: 'Beta Student',
      targetExam: 'UPSC',
    });

    const filtered = await request(app)
      .get('/api/admin/students?q=Alpha')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(filtered.body.items).toHaveLength(1);
    expect(filtered.body.items[0].name).toBe('Alpha Student');
    expect(filtered.body.items[0].tier).toBeTruthy();

    const csv = await request(app)
      .get('/api/admin/students/export')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(csv.headers['content-type']).toMatch(/text\/csv/);
    expect(csv.text).toContain('Alpha Student');
    expect(csv.text).toContain('Beta Student');
  });

  it('suspends a student and blocks login', async () => {
    const token = await loginAdmin();
    const student = await createTestUser({
      email: `suspend-student-${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'student',
      name: 'Suspend Me',
    });

    await request(app)
      .patch(`/api/admin/students/${student._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'suspended' })
      .expect(200);

    await request(app)
      .post('/api/auth/login')
      .send({ email: student.email, password: 'Password123!' })
      .expect(403);

    await request(app)
      .patch(`/api/admin/students/${student._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'active' })
      .expect(200);

    await request(app)
      .post('/api/auth/login')
      .send({ email: student.email, password: 'Password123!' })
      .expect(200);
  });
});
