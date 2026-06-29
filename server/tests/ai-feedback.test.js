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
  evaluateAnswer: jest.fn(),
}));

const { default: app } = await import('../src/app.js');
const { User } = await import('../src/models/User.js');
const { AiModelFeedback } = await import('../src/models/AiModelFeedback.js');
const { clearTestDatabase, setupTestDatabase, teardownTestDatabase } = await import(
  './helpers/db.js'
);
const { withPrivacyConsent } = await import('./helpers/privacy.js');

async function createAuthedUser({ role = 'student' } = {}) {
  const email = `ai_feedback_${Date.now()}_${Math.random()}@example.com`;
  const signup = await request(app).post('/api/auth/signup').send(withPrivacyConsent({
    name: 'AI User',
    email,
    password: 'Password123',
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

  it('GET /api/admin/ai-feedback lists pending reports for admins', async () => {
    const { token: userToken } = await createAuthedUser();

    await request(app)
      .post('/api/ai/report')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        feature: 'answer_evaluation',
        outputSnapshot: { score: 0, feedback: ['Off topic'] },
      });

    const { token: adminToken } = await createAuthedUser({ role: 'admin' });
    const response = await request(app)
      .get('/api/admin/ai-feedback?status=pending')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.items.length).toBeGreaterThan(0);
  });
});
