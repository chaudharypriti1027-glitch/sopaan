import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { signAccessToken } from '../src/utils/jwt.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';

const PHONE = '+919876543210';

function authHeader(user) {
  return { Authorization: `Bearer ${signAccessToken(user)}` };
}

describe('GET/PUT /api/me', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('GET /api/me returns shared Profile shape', async () => {
    const user = await User.create({
      name: 'Priya',
      phone: PHONE,
      state: 'Gujarat',
      targetExam: 'SSC CGL',
      onboardingComplete: true,
    });

    const response = await request(app).get('/api/me').set(authHeader(user));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: String(user._id),
      name: 'Priya',
      phone: PHONE,
      state: 'Gujarat',
      targetExam: 'SSC CGL',
      language: 'en',
    });
    expect(response.body.passwordHash).toBeUndefined();
  });

  it('PUT /api/me updates fields and sets onboardingComplete when core fields present', async () => {
    const user = await User.create({
      name: 'Student',
      phone: PHONE,
      onboardingComplete: false,
    });

    const response = await request(app)
      .put('/api/me')
      .set(authHeader(user))
      .send({
        name: 'Arjun Patel',
        state: 'Maharashtra',
        targetExam: 'UPSC CSE',
        category: 'GEN',
        language: 'hi',
        educationLevel: 'Graduate',
        examDate: '2026-12-01T00:00:00.000Z',
      });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Arjun Patel');
    expect(response.body.state).toBe('Maharashtra');
    expect(response.body.targetExam).toBe('UPSC CSE');
    expect(response.body.category).toBe('GEN');
    expect(response.body.language).toBe('hi');
    expect(response.body.educationLevel).toBe('Graduate');
    expect(response.body.examDate).toBe('2026-12-01T00:00:00.000Z');

    const refreshed = await User.findById(user._id);
    expect(refreshed?.onboardingComplete).toBe(true);
  });

  it('GET /api/me after PUT returns saved details on subsequent opens', async () => {
    const user = await User.create({
      name: 'Student',
      phone: PHONE,
      onboardingComplete: false,
    });

    await request(app)
      .put('/api/me')
      .set(authHeader(user))
      .send({
        name: 'Saved User',
        state: 'Gujarat',
        targetExam: 'SSC CGL',
      });

    const getResponse = await request(app).get('/api/me').set(authHeader(user));

    expect(getResponse.body.name).toBe('Saved User');
    expect(getResponse.body.state).toBe('Gujarat');
    expect(getResponse.body.targetExam).toBe('SSC CGL');
  });

  it('POST /api/me/avatar uploads and returns profile with avatarUrl', async () => {
    const user = await User.create({
      name: 'Avatar User',
      phone: PHONE,
      state: 'Gujarat',
      targetExam: 'SSC CGL',
    });

    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );

    const response = await request(app)
      .post('/api/me/avatar')
      .set(authHeader(user))
      .attach('avatar', pngBuffer, {
        filename: 'avatar.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(200);
    expect(response.body.avatarUrl).toEqual(expect.stringMatching(/^https:\/\//));
    expect(response.body.name).toBe('Avatar User');
  });

  it('requires authentication', async () => {
    const response = await request(app).get('/api/me');
    expect(response.status).toBe(401);
  });
});

describe('GET /api/me/summary', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('returns live profile summary counts', async () => {
    const { CourseProgress } = await import('../src/models/CourseProgress.js');
    const { Badge } = await import('../src/models/Badge.js');
    const { Attempt } = await import('../src/models/Attempt.js');
    const { Course } = await import('../src/models/Course.js');
    const { Test } = await import('../src/models/Test.js');
    const { Question } = await import('../src/models/Question.js');

    const user = await User.create({
      name: 'Summary User',
      phone: '+919911223344',
      state: 'Gujarat',
      targetExam: 'SSC CGL',
      coins: 420,
      level: 3,
      streak: { current: 12 },
    });

    const course = await Course.create({
      title: 'Quant Basics',
      subject: 'Math',
      examTags: ['SSC-CGL'],
      language: 'en',
      lessons: [{ title: 'Intro', order: 1 }],
      status: 'published',
    });

    await CourseProgress.create({
      userId: user._id,
      courseId: course._id,
      completedLessons: [],
      progressPercent: 0,
    });

    await Badge.create({
      userId: user._id,
      key: 'streak-7',
      earnedAt: new Date(),
    });

    const test = await Test.create({
      title: 'Mini mock',
      subject: 'Math',
      difficulty: 'easy',
      durationSec: 600,
      type: 'mock',
      examTag: 'SSC-CGL',
      createdBy: user._id,
      status: 'published',
    });

    const question = await Question.create({
      subject: 'Math',
      topic: 'Arithmetic',
      difficulty: 'easy',
      text: '2 + 2 = ?',
      options: [
        { key: 'A', text: '3' },
        { key: 'B', text: '4' },
        { key: 'C', text: '5' },
        { key: 'D', text: '6' },
      ],
      correctKey: 'B',
      source: 'official',
      status: 'published',
    });

    await Attempt.create({
      userId: user._id,
      testId: test._id,
      answers: [
        { questionId: question._id, selectedKey: 'A', correct: false },
        { questionId: question._id, selectedKey: 'B', correct: true },
      ],
      score: 0,
      accuracy: 0,
    });

    const response = await request(app).get('/api/me/summary').set(authHeader(user));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      courses: 1,
      achievements: 1,
      mistakes: 1,
      coins: 420,
      level: 3,
      streak: 12,
      savedQuestions: 0,
      downloads: 0,
      xp: 0,
      accuracy: 0,
    });
  });
});
