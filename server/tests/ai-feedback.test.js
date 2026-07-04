import { jest, beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

const mockSolveDoubt = jest.fn(async ({ question }) => ({
  explanation: `Mock explanation for: ${question}`,
}));

jest.unstable_mockModule('../../src/services/ai/doubtSolver.js', () => ({
  solveDoubt: mockSolveDoubt,
}));

jest.unstable_mockModule('../../src/services/ai/testGenerator.js', () => ({
  generateTest: jest.fn(),
  generateQuestionBatch: jest.fn(),
  generateMultiSectionExam: jest.fn(),
  SECONDS_PER_QUESTION: 90,
}));

jest.unstable_mockModule('../../src/services/ai/answerEvaluator.js', () => ({
  evaluateAnswer: jest.fn(async () => ({
    score: 8,
    subScores: { content: 8, structure: 7, clarity: 8 },
    feedback: ['Add more examples'],
  })),
}));

const { default: app } = await import('../src/app.js');
const { User } = await import('../src/models/User.js');
const { AiModelFeedback } = await import('../src/models/AiModelFeedback.js');
const { AnswerEvaluation } = await import('../src/models/AnswerEvaluation.js');
const { Notification } = await import('../src/models/Notification.js');
const { clearTestDatabase, setupTestDatabase, teardownTestDatabase } = await import(
  './helpers/db.js'
);
const { withPrivacyConsent } = await import('./helpers/privacy.js');

async function createAuthedUser({ role = 'student' } = {}) {
  const email = `ai_feedback_${Date.now()}_${Math.random()}@example.com`;
  const signup = await request(app).post('/api/auth/signup').send(withPrivacyConsent({
    name: 'AI User',
    email,
    password: 'Password123!',
  }));

  if (role === 'admin') {
    await User.findByIdAndUpdate(signup.body.user.id, { role: 'admin' });
  }

  return {
    token: signup.body.accessToken,
    userId: signup.body.user.id,
  };
}

describe('AI feedback routes', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('POST /api/ai/report stores flagged output for admin review', async () => {
    const { token } = await createAuthedUser();

    const response = await request(app)
      .post('/api/ai/report')
      .set('Authorization', `Bearer ${token}`)
      .send({
        feature: 'doubt_solver',
        reason: 'inaccurate',
        inputSummary: 'What is GDP?',
        outputSnapshot: { explanation: 'Wrong answer' },
        userComment: 'This seems incorrect',
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toMatch(/flagged for review/i);

    const feedback = await AiModelFeedback.findOne().lean();
    expect(feedback?.feature).toBe('doubt_solver');
    expect(feedback?.status).toBe('pending');
  });

  it('GET /api/admin/ai-feedback lists pending flagged evaluations', async () => {
    const { token: userToken, userId } = await createAuthedUser();

    await request(app)
      .post('/api/ai/report')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        feature: 'answer_evaluation',
        reason: 'inaccurate',
        inputSummary: 'Discuss federalism',
        maxMarks: 15,
        outputSnapshot: {
          score: 6,
          maxMarks: 15,
          subScores: { content: 6, structure: 5, clarity: 6 },
          feedback: ['Too brief'],
        },
      });

    const { token: adminToken } = await createAuthedUser({ role: 'admin' });
    const response = await request(app)
      .get('/api/admin/ai-feedback?status=pending&feature=answer_evaluation')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.items.length).toBe(1);
    expect(response.body.items[0].aiGrade).toBe(6);
    expect(response.body.items[0].student.name).toBe('AI User');

    const kept = await request(app)
      .patch(`/api/admin/ai-feedback/${response.body.items[0].id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'keep' });

    expect(kept.status).toBe(200);
    expect(kept.body.status).toBe('reviewed');
    expect(kept.body.reviewAction).toBe('keep');

    const feedback = await AiModelFeedback.findOne({ userId }).lean();
    expect(feedback?.status).toBe('reviewed');

    const evaluation = await AnswerEvaluation.findOne({ userId }).lean();
    expect(evaluation?.reviewStatus).toBe('kept');
    expect(evaluation?.score).toBe(6);

    const listed = await request(app)
      .get('/api/admin/ai-feedback?status=pending')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listed.body.items).toHaveLength(0);
  });

  it('PATCH override updates evaluation grade and notifies the student', async () => {
    const { token: userToken, userId } = await createAuthedUser();

    const report = await request(app)
      .post('/api/ai/report')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        feature: 'answer_evaluation',
        reason: 'inaccurate',
        inputSummary: 'Explain GST',
        maxMarks: 10,
        outputSnapshot: {
          score: 3,
          subScores: { content: 3, structure: 2, clarity: 3 },
          feedback: ['Missed key points'],
        },
      });

    expect(report.status).toBe(201);

    const { token: adminToken } = await createAuthedUser({ role: 'admin' });
    const feedbackId = report.body.id;

    const overridden = await request(app)
      .patch(`/api/admin/ai-feedback/${feedbackId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'override', grade: 7, note: 'Strong structure after review' });

    expect(overridden.status).toBe(200);
    expect(overridden.body.reviewAction).toBe('override');
    expect(overridden.body.finalGrade).toBe(7);
    expect(overridden.body.effectiveGrade).toBe(7);
    expect(overridden.body.outputSnapshot.score).toBe(7);

    const evaluation = await AnswerEvaluation.findOne({ userId }).lean();
    expect(evaluation?.score).toBe(7);
    expect(evaluation?.reviewStatus).toBe('overridden');

    const notification = await Notification.findOne({ userId }).lean();
    expect(notification?.title).toMatch(/score was updated/i);
    expect(notification?.body).toMatch(/Strong structure after review/);
  });

  it('rejects override without grade', async () => {
    const { token: userToken } = await createAuthedUser();
    const report = await request(app)
      .post('/api/ai/report')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        feature: 'answer_evaluation',
        outputSnapshot: { score: 4, subScores: { content: 4, structure: 4, clarity: 4 }, feedback: ['x'] },
      });

    const { token: adminToken } = await createAuthedUser({ role: 'admin' });

    const response = await request(app)
      .patch(`/api/admin/ai-feedback/${report.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'override' });

    expect(response.status).toBe(400);
    expect(response.body.error?.code).toBe('VALIDATION_ERROR');
  });
});
