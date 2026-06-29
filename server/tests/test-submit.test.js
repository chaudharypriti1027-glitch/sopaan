import { jest, beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

jest.unstable_mockModule('../../src/services/ai/coach.js', () => ({
  feedbackForAttempt: jest.fn(async () => ({
    feedback: 'Strong accuracy — revise weak topics next.',
    weakTopics: ['Ratios'],
    actions: ['Review incorrect answers', 'Practice ratio problems'],
  })),
  readinessForGoal: jest.fn(async () => ({
    score: 72,
    summary: 'On track for your target exam.',
    focusAreas: ['Quantitative aptitude'],
  })),
}));

const { default: app } = await import('../src/app.js');
const { clearTestDatabase, setupTestDatabase, teardownTestDatabase } = await import(
  './helpers/db.js'
);
const { createPublishedTest, createTestUser } = await import('./helpers/fixtures.js');
const { withPrivacyConsent } = await import('./helpers/privacy.js');

async function signupAndGetToken() {
  const response = await request(app).post('/api/auth/signup').send(withPrivacyConsent({
    name: 'Test Taker',
    email: `taker_${Date.now()}@example.com`,
    password: 'Password123',
  }));

  return {
    token: response.body.accessToken,
    userId: response.body.user.id,
  };
}

describe('Test submit scoring', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('grades answers and returns score, accuracy, and rank', async () => {
    const { token, userId } = await signupAndGetToken();
    const { test, questions } = await createPublishedTest(userId);

    const answers = questions.map((question) => ({
      questionId: question._id.toString(),
      selectedKey: question.correctKey,
      timeSec: 30,
    }));

    const response = await request(app)
      .post(`/api/tests/${test._id}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ answers });

    expect(response.status).toBe(201);
    expect(response.body.attempt.score).toBe(2);
    expect(response.body.attempt.accuracy).toBe(100);
    expect(response.body.attempt.rank).toBe(1);
    expect(response.body.attempt.aiFeedback).toBe('Strong accuracy — revise weak topics next.');
  });

  it('marks incorrect answers and populates weak topics', async () => {
    const { token, userId } = await signupAndGetToken();
    const { test, questions } = await createPublishedTest(userId);

    const answers = questions.map((question, index) => ({
      questionId: question._id.toString(),
      selectedKey: index === 0 ? 'A' : question.correctKey,
      timeSec: 20,
    }));

    const response = await request(app)
      .post(`/api/tests/${test._id}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ answers });

    expect(response.status).toBe(201);
    expect(response.body.attempt.score).toBe(1);
    expect(response.body.attempt.accuracy).toBe(50);
    expect(response.body.answers.some((answer) => answer.correct === false)).toBe(true);
  });

  it('rejects submit when an answer is missing', async () => {
    const { token, userId } = await signupAndGetToken();
    const { test, questions } = await createPublishedTest(userId);

    const response = await request(app)
      .post(`/api/tests/${test._id}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        answers: [
          {
            questionId: questions[0]._id.toString(),
            selectedKey: 'B',
            timeSec: 10,
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('allows the creator to submit a draft test they generated', async () => {
    const { token, userId } = await signupAndGetToken();
    const { test, questions } = await createPublishedTest(userId, { status: 'draft' });

    const response = await request(app)
      .post(`/api/tests/${test._id}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        answers: questions.map((question) => ({
          questionId: question._id.toString(),
          selectedKey: question.correctKey,
          timeSec: 10,
        })),
      });

    expect(response.status).toBe(201);
    expect(response.body.attempt.score).toBe(2);
  });

  it('returns 404 when a non-owner submits someone else\'s draft test', async () => {
    const owner = await signupAndGetToken();
    const other = await signupAndGetToken();
    const { test, questions } = await createPublishedTest(owner.userId, { status: 'draft' });

    const response = await request(app)
      .post(`/api/tests/${test._id}/submit`)
      .set('Authorization', `Bearer ${other.token}`)
      .send({
        answers: questions.map((question) => ({
          questionId: question._id.toString(),
          selectedKey: question.correctKey,
          timeSec: 10,
        })),
      });

    expect(response.status).toBe(404);
  });

  it('requires authentication', async () => {
    const user = await createTestUser({
      name: 'Creator',
      email: `creator_${Date.now()}@example.com`,
    });

    const { test, questions } = await createPublishedTest(user._id);

    const response = await request(app)
      .post(`/api/tests/${test._id}/submit`)
      .send({
        answers: questions.map((question) => ({
          questionId: question._id.toString(),
          selectedKey: question.correctKey,
          timeSec: 10,
        })),
      });

    expect(response.status).toBe(401);
  });
});
