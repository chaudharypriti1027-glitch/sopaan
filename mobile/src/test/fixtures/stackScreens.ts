import type {
  AttemptDetail,
  CurrentAffair,
  SubmitTestResponse,
  TestDetail,
} from '../../api/types';

export const MOCK_TEST_ID = 'test-mock-1';

export function createMockTest(overrides: Partial<TestDetail> = {}): TestDetail {
  return {
    id: MOCK_TEST_ID,
    title: 'Daily GS Mock',
    subject: 'General Studies',
    type: 'mock',
    durationSec: 600,
    questionCount: 2,
    questions: [
      {
        id: 'q1',
        text: 'What is the capital of India?',
        subject: 'GK',
        options: [
          { key: 'A', text: 'Mumbai' },
          { key: 'B', text: 'New Delhi' },
          { key: 'C', text: 'Kolkata' },
          { key: 'D', text: 'Chennai' },
        ],
        correctKey: 'B',
      },
      {
        id: 'q2',
        text: 'Who wrote the Indian Constitution?',
        subject: 'Polity',
        options: [
          { key: 'A', text: 'Ambedkar' },
          { key: 'B', text: 'Nehru' },
          { key: 'C', text: 'Patel' },
          { key: 'D', text: 'Gandhi' },
        ],
        correctKey: 'A',
      },
    ],
    ...overrides,
  };
}

export function createMockSubmitResult(
  overrides: Partial<SubmitTestResponse> = {},
): SubmitTestResponse {
  return {
    attempt: {
      id: 'attempt-1',
      testId: MOCK_TEST_ID,
      score: 2,
      accuracy: 100,
      totalTimeSec: 120,
      percentile: 92,
      rank: 48,
      weakTopics: [],
    },
    coaching: {
      feedback: 'Strong accuracy — keep revising polity edge cases.',
      weakTopics: ['Indian Polity'],
      actions: ['Review fundamental rights', 'Practice 10 polity questions'],
    },
    answers: [
      {
        questionId: 'q1',
        selectedKey: 'B',
        correct: true,
        timeSec: 30,
        question: {
          text: 'What is the capital of India?',
          topic: 'GK',
          correctKey: 'B',
          explanation: 'New Delhi is the capital.',
          options: [
            { key: 'A', text: 'Mumbai' },
            { key: 'B', text: 'New Delhi' },
            { key: 'C', text: 'Kolkata' },
            { key: 'D', text: 'Chennai' },
          ],
        },
      },
      {
        questionId: 'q2',
        selectedKey: 'A',
        correct: true,
        timeSec: 45,
        question: {
          text: 'Who wrote the Indian Constitution?',
          topic: 'Polity',
          correctKey: 'A',
          options: [
            { key: 'A', text: 'Ambedkar' },
            { key: 'B', text: 'Nehru' },
            { key: 'C', text: 'Patel' },
            { key: 'D', text: 'Gandhi' },
          ],
        },
      },
    ],
    ...overrides,
  };
}

export function createMockAttemptDetail(
  overrides: Partial<AttemptDetail> = {},
): AttemptDetail {
  return {
    id: 'attempt-1',
    test: { id: MOCK_TEST_ID, title: 'Daily GS Mock', subject: 'General Studies' },
    score: 2,
    accuracy: 85,
    percentile: 88,
    rank: 52,
    totalTimeSec: 540,
    weakTopics: ['Economy', 'Environment'],
    aiFeedback: 'You spent more time on polity than economy — rebalance next mock.',
    comparison: {
      you: { score: 2, accuracy: 85, totalTimeSec: 540 },
      topper: { score: 2, accuracy: 100, totalTimeSec: 420 },
      average: { score: 1, accuracy: 62, totalTimeSec: 600 },
    },
    timePerSection: [
      { subject: 'Polity', totalTimeSec: 300, correct: 1, total: 1, accuracy: 100 },
      { subject: 'Economy', totalTimeSec: 240, correct: 0, total: 1, accuracy: 0 },
    ],
    ...overrides,
  };
}

export function createMockCurrentAffair(
  overrides: Partial<CurrentAffair> = {},
): CurrentAffair {
  return {
    id: 'ca-1',
    title: 'RBI keeps repo rate unchanged',
    summary: 'The central bank held rates steady amid inflation concerns.',
    body: '<p>The Reserve Bank of India left the repo rate unchanged at 6.5%.</p>',
    category: 'Economy',
    source: 'PIB',
    sourceUrl: 'https://example.com/rbi-rate',
    publishedAt: '2026-06-20T10:00:00.000Z',
    state: 'National',
    ...overrides,
  };
}

export const MOCK_PREMIUM_PLANS = {
  plans: [
    {
      id: 'monthly' as const,
      label: 'Monthly',
      displayAmount: '₹299/mo',
      description: 'Billed monthly',
      amountPaise: 29900,
    },
    {
      id: 'yearly' as const,
      label: 'Yearly',
      displayAmount: '₹2,499/yr',
      description: 'Best for serious prep',
      amountPaise: 249900,
    },
  ],
};
