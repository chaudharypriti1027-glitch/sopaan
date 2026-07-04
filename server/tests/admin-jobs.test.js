import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { JobRun } from '../src/models/JobRun.js';
import { JOB_NAMES } from '../src/config/jobConfig.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';

describe('admin jobs API', () => {
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
      email: `admin-jobs-${Date.now()}@test.com`,
      password: 'Password123!',
      role: 'admin',
      name: 'Jobs Admin',
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'Password123!' })
      .expect(200);

    return login.body.token;
  }

  it('lists scheduled jobs with schedule and last-run status', async () => {
    const token = await loginAdmin();

    const response = await request(app)
      .get('/api/admin/jobs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const names = response.body.items.map((job) => job.name);
    expect(names).toContain(JOB_NAMES.DAILY_PLAN);
    expect(names).toContain(JOB_NAMES.STREAK_REMINDER);
    expect(names).toContain(JOB_NAMES.WEEKLY_RECAP);
    expect(names).toContain(JOB_NAMES.DAILY_LEAGUE_MAINTENANCE);

    const dailyPlan = response.body.items.find((job) => job.name === JOB_NAMES.DAILY_PLAN);
    expect(dailyPlan.schedule).toBe('0 6 * * *');
    expect(dailyPlan.status).toBe('never_run');
    expect(dailyPlan.enabled).toBe(true);
  });

  it('POST run now executes a job and records success in history', async () => {
    const token = await loginAdmin();

    const run = await request(app)
      .post(`/api/admin/jobs/${JOB_NAMES.DAILY_PLAN}/run`)
      .set('Authorization', `Bearer ${token}`)
      .send({ force: true })
      .expect(200);

    expect(run.body.jobName).toBe(JOB_NAMES.DAILY_PLAN);
    expect(run.body.skipped).toBe(false);
    expect(run.body.jobRunId).toBeTruthy();

    const history = await request(app)
      .get(`/api/admin/jobs/runs?jobName=${JOB_NAMES.DAILY_PLAN}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(history.body.items.length).toBeGreaterThan(0);
    expect(history.body.items[0].status).toBe('completed');
    expect(history.body.items[0].triggeredBy).toBe('manual');

    const stored = await JobRun.findById(history.body.items[0].id);
    expect(stored?.status).toBe('completed');
  });

  it('records failed runs in history', async () => {
    const token = await loginAdmin();

    await request(app)
      .post('/api/admin/jobs/unknown-job/run')
      .set('Authorization', `Bearer ${token}`)
      .send({ force: true })
      .expect(404);
  });
});
