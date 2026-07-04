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
      role: 'creator',
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

  it('returns admin reports with daily series', async () => {
    const admin = await createTestUser({
      email: `admin-reports-${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'admin',
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'Password123!' })
      .expect(200);

    const stats = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);

    expect(Array.isArray(stats.body.attemptsDaily)).toBe(true);
    expect(stats.body.attemptsDaily).toHaveLength(14);
    expect(typeof stats.body.mrrPaise).toBe('number');
    expect(typeof stats.body.questionsPublished).toBe('number');

    const attempts = await request(app)
      .get('/api/admin/stats/attempts?days=14')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);

    expect(attempts.body.days).toBe(14);
    expect(Array.isArray(attempts.body.series)).toBe(true);
    expect(attempts.body.series).toHaveLength(14);

    const reports = await request(app)
      .get('/api/admin/reports')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);

    expect(Array.isArray(reports.body.signupsDaily)).toBe(true);
    expect(reports.body.revenue).toBeTruthy();
  });

  it('returns student detail for admin', async () => {
    const admin = await createTestUser({
      email: `admin-student-detail-${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'admin',
    });
    const student = await createTestUser({
      email: `student-detail-${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'student',
      name: 'Detail Student',
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'Password123!' })
      .expect(200);

    const res = await request(app)
      .get(`/api/admin/students/${student._id}`)
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);

    expect(res.body.name).toBe('Detail Student');
    expect(res.body.id).toBe(student._id.toString());
  });

  it('includes role in JWT access token', async () => {
    const admin = await createTestUser({
      email: `admin-jwt-${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'admin',
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'Password123!' })
      .expect(200);

    const jwt = await import('jsonwebtoken');
    const { env } = await import('../src/config/env.js');
    const payload = jwt.default.verify(login.body.token, env.jwtSecret);

    expect(payload.role).toBe('admin');
    expect(payload.sub).toBe(admin._id.toString());
  });

  it('records audit log on admin mutation', async () => {
    const { AuditLog } = await import('../src/models/AuditLog.js');
    const admin = await createTestUser({
      email: `admin-audit-${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'admin',
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'Password123!' })
      .expect(200);

    await request(app)
      .post('/api/admin/audit/test')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);

    const logs = await AuditLog.find({ actor: admin._id, action: 'test', resource: 'audit' }).lean();
    expect(logs).toHaveLength(1);
    expect(logs[0].meta?.method).toBe('POST');
  });
});
