import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { Mentor } from '../src/models/Mentor.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';

async function loginAdmin() {
  const admin = await createTestUser({
    email: `admin-mentor-crud-${Date.now()}@test.com`,
    password: 'Password123!',
    role: 'admin',
  });

  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: admin.email, password: 'Password123!' })
    .expect(200);

  return login.body.token;
}

describe('admin mentors CRUD', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('creates an active mentor visible to students and hides after deactivate', async () => {
    const token = await loginAdmin();

    const created = await request(app)
      .post('/api/admin/mentors')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Guide Mentor',
        subjects: ['Quant', 'Reasoning'],
        bio: 'SSC specialist',
        rate: 499,
        avatarUrl: 'https://cdn.sopaan.dev/avatars/guide.jpg',
      })
      .expect(201);

    expect(created.body.name).toBe('Guide Mentor');
    expect(created.body.isActive).toBe(true);

    const student = await createTestUser({
      email: `mentor-student-${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'student',
    });
    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: student.email, password: 'Password123!' })
      .expect(200);

    const studentList = await request(app)
      .get('/api/mentors?limit=20')
      .set('Authorization', `Bearer ${studentLogin.body.token}`)
      .expect(200);
    expect(studentList.body.items.some((row) => row.name === 'Guide Mentor')).toBe(true);

    const mentorId = created.body.id ?? created.body._id;

    await request(app)
      .patch(`/api/admin/mentors/${mentorId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isActive: false })
      .expect(200);

    const hidden = await request(app)
      .get('/api/mentors?limit=20')
      .set('Authorization', `Bearer ${studentLogin.body.token}`)
      .expect(200);
    expect(hidden.body.items.some((row) => row.name === 'Guide Mentor')).toBe(false);

    const adminList = await request(app)
      .get('/api/admin/mentors')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(adminList.body.items.some((row) => row.id === mentorId && row.isActive === false)).toBe(
      true,
    );

    expect(await Mentor.countDocuments()).toBe(1);
  });

  it('updates mentor profile fields', async () => {
    const token = await loginAdmin();

    const created = await request(app)
      .post('/api/admin/mentors')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Before Edit',
        subjects: ['Polity'],
      })
      .expect(201);

    const mentorId = created.body.id ?? created.body._id;

    const updated = await request(app)
      .put(`/api/admin/mentors/${mentorId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'After Edit',
        subjects: ['History', 'Polity'],
        rate: 799,
      })
      .expect(200);

    expect(updated.body.name).toBe('After Edit');
    expect(updated.body.rate).toBe(799);
    expect(updated.body.subjects).toEqual(['History', 'Polity']);
  });
});
