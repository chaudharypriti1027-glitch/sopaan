import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { Exam } from '../src/models/Exam.js';
import { Goal } from '../src/models/Goal.js';
import { User } from '../src/models/User.js';
import { signAccessToken } from '../src/utils/jwt.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';

function authHeader(user) {
  return { Authorization: `Bearer ${signAccessToken(user)}` };
}

describe('GET /api/exam-plan', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('returns 400 when no exam goal is set', async () => {
    const user = await User.create({
      name: 'No Goal',
      email: `nog_${Date.now()}@test.com`,
      passwordHash: 'hash',
    });

    const response = await request(app)
      .get('/api/exam-plan')
      .set(authHeader(user));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('GOAL_NOT_SET');
  });

  it('returns full exam plan with synced goal and exam details', async () => {
    const examDate = new Date('2026-12-15T00:00:00.000Z');

    const exam = await Exam.create({
      name: 'SSC CGL',
      code: 'SSC-CGL',
      category: 'SSC',
      description: 'Combined Graduate Level',
      stages: [
        { name: 'Tier 1', order: 1 },
        { name: 'Tier 2', order: 2 },
        { name: 'Physical Test', order: 3 },
      ],
      importantDates: [{ label: 'Tier 1 Exam', date: examDate, type: 'exam' }],
      vacancies: 12000,
      cutoffs: [{ year: 2024, category: 'GEN', marks: 142 }],
      status: 'published',
    });

    const user = await User.create({
      name: 'Planner Student',
      email: `plan_${Date.now()}@test.com`,
      passwordHash: 'hash',
      targetExam: 'SSC CGL',
      examDate,
    });

    const response = await request(app)
      .get('/api/exam-plan')
      .set(authHeader(user));

    expect(response.status).toBe(200);
    expect(response.body.goal.examName).toBe('SSC CGL');
    expect(response.body.goal.daysLeft).toEqual(expect.any(Number));
    expect(response.body.exam.id).toBe(String(exam._id));
    expect(response.body.physicalPrep.hasPhysicalStage).toBe(true);
    expect(response.body.aiAdvice.summary).toEqual(expect.any(String));
    expect(response.body.aiAdvice.dreamMessage).toEqual(expect.any(String));
    expect(Array.isArray(response.body.today.sessions)).toBe(true);
    expect(Array.isArray(response.body.weeklySchedule)).toBe(true);
    expect(response.body.weeklySchedule).toHaveLength(7);
    expect(response.body.weeklySchedule[0]).toMatchObject({
      date: expect.any(String),
      dayLabel: expect.any(String),
      theme: expect.any(String),
      tasks: expect.any(Array),
    });
    expect(response.body.weekPlanProgress).toMatchObject({
      completed: expect.any(Number),
      total: expect.any(Number),
      progressPct: expect.any(Number),
    });
    expect(response.body.roadmap.stages.length).toBeGreaterThan(0);

    const refreshedUser = await User.findById(user._id);
    expect(refreshedUser.activeGoalId).toBeTruthy();

    const goal = await Goal.findById(refreshedUser.activeGoalId);
    expect(goal.examName).toBe('SSC CGL');
  });

  it('returns exam plan for a custom typed exam without catalog match', async () => {
    const examDate = new Date('2026-09-20T00:00:00.000Z');

    const user = await User.create({
      name: 'Custom Exam Student',
      email: `custom_${Date.now()}@test.com`,
      passwordHash: 'hash',
      targetExam: 'MPPSC',
      examDate,
    });

    const response = await request(app)
      .get('/api/exam-plan')
      .set(authHeader(user));

    expect(response.status).toBe(200);
    expect(response.body.goal.examName).toBe('MPPSC');
    expect(response.body.goal.examTrack).toBe('MPPSC');
    expect(response.body.exam).toBeNull();
    expect(response.body.aiAdvice.summary).toContain('MPPSC');

    const refreshedUser = await User.findById(user._id);
    expect(refreshedUser.activeGoalId).toBeTruthy();

    const goal = await Goal.findById(refreshedUser.activeGoalId);
    expect(goal.examName).toBe('MPPSC');
    expect(goal.examId).toBeUndefined();
  });

  it('resolves exam plan when profile goal is Other but user targetExam is valid', async () => {
    const examDate = new Date('2026-10-10T00:00:00.000Z');

    const user = await User.create({
      name: 'Other Profile Student',
      email: `other_profile_${Date.now()}@test.com`,
      passwordHash: 'hash',
      targetExam: 'SSC CGL',
      examDate,
    });

    const { StudentProfile } = await import('../src/models/StudentProfile.js');
    await StudentProfile.create({
      userId: user._id,
      goal: { examTrack: 'Other', targetYear: 2026 },
      targetYear: 2026,
    });

    const response = await request(app)
      .get('/api/exam-plan')
      .set(authHeader(user));

    expect(response.status).toBe(200);
    expect(response.body.goal.examName).toBe('SSC CGL');
    expect(response.body.goal.examTrack).toBe('SSC CGL');
    expect(response.body.weeklySchedule).toHaveLength(7);
  });
});
