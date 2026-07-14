import { jest, beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

const mockSuggestPracticeOptions = jest.fn(async () => ({
  suggestions: [
    {
      subject: 'General Studies',
      topic: 'Indian Polity',
      difficulty: 'medium',
      mode: 'adaptive',
      count: 10,
      reason: 'Polity showed up in recent weak areas.',
    },
    {
      subject: 'Quantitative Aptitude',
      topic: 'Percentages',
      difficulty: 'easy',
      mode: 'standard',
      count: 8,
      reason: 'Quick quant warm-up for SSC speed.',
    },
  ],
  source: 'ai',
}));

jest.unstable_mockModule('../../src/services/ai/practiceSuggestions.js', () => ({
  suggestPracticeOptions: mockSuggestPracticeOptions,
  collectPracticeSuggestionContext: jest.fn(),
}));

jest.unstable_mockModule('../../src/services/ai/doubtSolver.js', () => ({
  solveDoubt: jest.fn(),
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
const { clearTestDatabase, setupTestDatabase, teardownTestDatabase } = await import(
  './helpers/db.js'
);
const { withPrivacyConsent } = await import('./helpers/privacy.js');

async function createAuthedUser() {
  const email = `practice_ai_${Date.now()}@example.com`;
  const signup = await request(app).post('/api/auth/signup').send(withPrivacyConsent({
    name: 'Practice User',
    email,
    password: 'Password123!',
  }));

  return {
    token: signup.body.accessToken,
    userId: signup.body.user.id,
  };
}

describe('POST /api/ai/practice-suggestions', () => {
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

  it('returns AI practice option suggestions', async () => {
    const { token } = await createAuthedUser();

    const response = await request(app)
      .post('/api/ai/practice-suggestions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        examTag: 'SSC-CGL',
        subject: 'General Studies',
        topic: 'History',
        language: 'en',
      });

    expect(response.status).toBe(200);
    expect(response.body.suggestions).toHaveLength(2);
    expect(response.body.suggestions[0].topic).toBe('Indian Polity');
    expect(mockSuggestPracticeOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        examTag: 'SSC-CGL',
        subject: 'General Studies',
        topic: 'History',
        language: 'en',
      }),
    );
  });
});
