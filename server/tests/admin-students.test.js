import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { Goal } from '../src/models/Goal.js';
import { SubscriptionEntitlement } from '../src/models/SubscriptionEntitlement.js';
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
    expect(csv.text).toContain('premiumPlan');
  });

  it('filters by premium plan and exam tag', async () => {
    const token = await loginAdmin();
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await createTestUser({
      email: `free-student-${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'student',
      name: 'Free Learner',
      targetExam: 'SSC',
      isPremium: false,
    });
    await createTestUser({
      email: `trial-student-${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'student',
      name: 'Trial Learner',
      targetExam: 'UPSC',
      isPremium: true,
      premiumPlan: 'trial',
      premiumExpiresAt: expires,
      premiumTrialUsed: true,
    });
    await createTestUser({
      email: `pro-student-${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'student',
      name: 'Pro Learner',
      targetExam: 'UPSC',
      isPremium: true,
      premiumPlan: 'monthly',
      premiumExpiresAt: expires,
    });

    const trialOnly = await request(app)
      .get('/api/admin/students?premium=trial')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(trialOnly.body.items.map((row) => row.name)).toEqual(['Trial Learner']);
    expect(trialOnly.body.items[0].premiumSource).toBe('trial');

    const proOnly = await request(app)
      .get('/api/admin/students?premium=pro')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(proOnly.body.items.map((row) => row.name)).toEqual(['Pro Learner']);

    const freeOnly = await request(app)
      .get('/api/admin/students?premium=free')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(freeOnly.body.items.map((row) => row.name)).toEqual(['Free Learner']);

    const examFiltered = await request(app)
      .get('/api/admin/students?exam=UPSC')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(examFiltered.body.items).toHaveLength(2);
    expect(examFiltered.body.items.every((row) => row.targetExam === 'UPSC')).toBe(true);
  });

  it('returns rich student detail without secrets', async () => {
    const token = await loginAdmin();
    const expires = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const student = await createTestUser({
      email: `detail-rich-${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'student',
      name: 'Rich Detail Student',
      targetExam: 'NEET',
      examDate: new Date('2026-05-01'),
      isPremium: true,
      premiumPlan: 'trial',
      premiumExpiresAt: expires,
      premiumTrialUsed: true,
      language: 'en',
      educationLevel: 'Graduate',
    });

    await Goal.create({
      user: student._id,
      examName: 'NEET',
      examDate: new Date('2026-05-01'),
      targetRank: 500,
    });

    await SubscriptionEntitlement.create({
      userId: student._id,
      plan: 'trial',
      status: 'cancelled',
      currentPeriodStart: new Date(),
      currentPeriodEnd: expires,
      cancelAtPeriodEnd: true,
      cancelledAt: new Date(),
    });

    const res = await request(app)
      .get(`/api/admin/students/${student._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.name).toBe('Rich Detail Student');
    expect(res.body.targetExam).toBe('NEET');
    expect(res.body.premium.plan).toBe('trial');
    expect(res.body.premium.source).toBe('trial');
    expect(res.body.premium.cancelled).toBe(true);
    expect(res.body.entitlement.status).toBe('cancelled');
    expect(res.body.goals).toHaveLength(1);
    expect(res.body.goals[0].examName).toBe('NEET');
    expect(res.body.goals[0].targetRank).toBe(500);
    expect(Array.isArray(res.body.payments)).toBe(true);
    expect(Array.isArray(res.body.attemptHistory)).toBe(true);
    expect(res.body.passwordHash).toBeUndefined();
    expect(res.body.otp).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|otpSecret|card/i);
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
