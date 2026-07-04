import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { Mentor } from '../src/models/Mentor.js';
import { getSeedAdminUser } from '../src/seed/adminConfig.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';

describe('admin console auth', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('rejects student token on admin stats', async () => {
    const student = await createTestUser({
      email: 'student-admin-gate@test.com',
      password: 'Password123!',
      role: 'student',
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: student.email, password: 'Password123!' })
      .expect(200);

    expect(login.body.profile.role).toBe('student');

    await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(403);
  });

  it('allows admin login and stats access', async () => {
    const admin = await createTestUser({
      email: `admin-console-${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'admin',
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'Password123!' })
      .expect(200);

    expect(login.body.profile.role).toBe('admin');

    await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);
  });

  it('exposes dev login hint email', async () => {
    const seed = getSeedAdminUser();
    const res = await request(app).get('/admin/login-hint.json').expect(200);
    expect(res.body.email).toBe(seed.email);
  });

  it('lists students for admin', async () => {
    const admin = await createTestUser({
      email: `admin-students-${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'admin',
    });
    await createTestUser({
      email: `student-list-${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'student',
      name: 'List Student',
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'Password123!' })
      .expect(200);

    const res = await request(app)
      .get('/api/admin/students')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);

    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it('lists mentors for admin without audit populate errors', async () => {
    const admin = await createTestUser({
      email: `admin-mentors-${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'admin',
    });
    const mentorUser = await createTestUser({
      email: `mentor-list-${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'mentor',
      name: 'Mentor List',
    });
    await Mentor.create({
      userId: mentorUser._id,
      expertise: ['UPSC'],
      bio: 'Test mentor',
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'Password123!' })
      .expect(200);

    const res = await request(app)
      .get('/api/admin/mentors?limit=50')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);

    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.some((row) => row.userId?.name === 'Mentor List')).toBe(true);
  });
});
