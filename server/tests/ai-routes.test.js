import { jest, beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

const mockSolveDoubt = jest.fn(async ({ question }) => ({
  explanation: `Mock explanation for: ${question}`,
}));

const mockGenerateTest = jest.fn(async ({ subject, topic }) => ({
  id: 'mock-test-id',
  title: `${subject} — ${topic}`,
  questionCount: 5,
}));

const mockGenerateMultiSectionExam = jest.fn(async ({ title }) => ({
  id: 'mock-exam-id',
  title,
  sections: [],
}));

const mockEvaluateAnswer = jest.fn(async () => ({
  score: 12,
  subScores: { content: 4, structure: 4, clarity: 4 },
  feedback: ['Clear structure', 'Add more examples'],
}));

jest.unstable_mockModule('../../src/services/ai/doubtSolver.js', () => ({
  solveDoubt: mockSolveDoubt,
}));

const mockGenerateQuestionBatch = jest.fn(async () => []);

jest.unstable_mockModule('../../src/services/ai/testGenerator.js', () => ({
  generateTest: mockGenerateTest,
  generateQuestionBatch: mockGenerateQuestionBatch,
  generateMultiSectionExam: mockGenerateMultiSectionExam,
  SECONDS_PER_QUESTION: 90,
}));

jest.unstable_mockModule('../../src/services/ai/answerEvaluator.js', () => ({
  evaluateAnswer: mockEvaluateAnswer,
}));

const { default: app } = await import('../src/app.js');
const { User } = await import('../src/models/User.js');
const { clearTestDatabase, setupTestDatabase, teardownTestDatabase } = await import(
  './helpers/db.js'
);
const { withPrivacyConsent } = await import('./helpers/privacy.js');

async function createAuthedUser({ premium = false } = {}) {
  const email = `ai_${Date.now()}@example.com`;
  const signup = await request(app).post('/api/auth/signup').send(withPrivacyConsent({
    name: 'AI User',
    email,
    password: 'Password123!',
  }));

  if (premium) {
    await User.findByIdAndUpdate(signup.body.user.id, {
      isPremium: true,
      premiumPlan: 'monthly',
      premiumExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  }

  return {
    token: signup.body.accessToken,
    userId: signup.body.user.id,
  };
}

describe('AI routes', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
    jest.clearAllMocks();
  });

  it('POST /api/ai/ask returns mocked doubt explanation', async () => {
    const { token } = await createAuthedUser();

    const response = await request(app)
      .post('/api/ai/ask')
      .set('Authorization', `Bearer ${token}`)
      .send({ question: 'What is GDP?', language: 'en' });

    expect(response.status).toBe(200);
    expect(response.body.explanation).toContain('Mock explanation for: What is GDP?');
    expect(mockSolveDoubt).toHaveBeenCalledWith(
      expect.objectContaining({ question: 'What is GDP?', language: 'en' }),
    );
  });

  it('POST /api/ai/generate-test returns mocked test payload', async () => {
    const { token } = await createAuthedUser();

    const response = await request(app)
      .post('/api/ai/generate-test')
      .set('Authorization', `Bearer ${token}`)
      .send({
        subject: 'Polity',
        topic: 'Constitution',
        difficulty: 'medium',
        count: 5,
        examTag: 'UPSC',
        language: 'hi',
      });

    expect(response.status).toBe(201);
    expect(response.body.title).toContain('Polity');
    expect(mockGenerateTest).toHaveBeenCalled();
  });

  it('POST /api/ai/evaluate-answer blocks free users with quota exceeded and allows pro users', async () => {
    const { token: freeToken } = await createAuthedUser();
    const blocked = await request(app)
      .post('/api/ai/evaluate-answer')
      .set('Authorization', `Bearer ${freeToken}`)
      .send({
        question: 'Discuss federalism in India.',
        answerText: 'Federalism divides power between centre and states.',
      });

    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('QUOTA_EXCEEDED');
    expect(blocked.body.error.details?.feature).toBe('ai_evaluate');
    expect(blocked.body.error.details?.paywallMessage).toMatch(/Upgrade to Sopaan Pro/i);

    const { token } = await createAuthedUser({ premium: true });
    const response = await request(app)
      .post('/api/ai/evaluate-answer')
      .set('Authorization', `Bearer ${token}`)
      .send({
        question: 'Discuss federalism in India.',
        answerText: 'Federalism divides power between centre and states.',
        language: 'en',
      });

    expect(response.status).toBe(200);
    expect(response.body.score).toBe(12);
    expect(mockEvaluateAnswer).toHaveBeenCalled();
  });
});
