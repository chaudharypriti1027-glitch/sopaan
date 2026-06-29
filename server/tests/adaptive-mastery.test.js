import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import { Question } from '../src/models/Question.js';
import { TopicMastery } from '../src/models/TopicMastery.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';
import { recordAnswerOutcome } from '../src/services/adaptive/masteryService.js';
import { getNextQuestions } from '../src/services/adaptive/questionPicker.js';
import { ratingFromDifficulty } from '../src/services/adaptive/rating.js';

const defaultOptions = [
  { key: 'A', text: 'A' },
  { key: 'B', text: 'B' },
  { key: 'C', text: 'C' },
  { key: 'D', text: 'D' },
];

async function createUser() {
  return createTestUser({
    name: 'Adaptive Student',
    email: `adaptive_${Date.now()}@example.com`,
  });
}

async function seedQuestions(subject, topics) {
  return Question.insertMany(
    topics.map((topic, index) => ({
      subject,
      topic,
      difficulty: index === 0 ? 'easy' : 'medium',
      rating: ratingFromDifficulty(index === 0 ? 'easy' : 'medium'),
      text: `Question about ${topic}`,
      options: defaultOptions,
      correctKey: 'A',
      explanation: 'Because A.',
      examTags: ['SSC CGL'],
      source: 'official',
    }))
  );
}

describe('adaptive mastery and question picker', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('creates and updates topic mastery after an answer', async () => {
    const user = await createUser();
    const [question] = await seedQuestions('Quant', ['Percentages']);

    const beforeRating = question.rating;
    const { mastery } = await recordAnswerOutcome(user._id, question, true);

    expect(mastery.attempts).toBe(1);
    expect(mastery.rating).toBeGreaterThan(1500);

    const updatedQuestion = await Question.findById(question._id).lean();
    expect(updatedQuestion.rating).toBeLessThanOrEqual(beforeRating);

    const stored = await TopicMastery.findOne({
      userId: user._id,
      subject: 'Quant',
      topic: 'Percentages',
    }).lean();

    expect(stored.rating).toBe(mastery.rating);
    expect(stored.lastSeen).toBeTruthy();
  });

  it('getNextQuestions prefers questions near stretch target and avoids recent ones', async () => {
    const user = await createUser();
    const questions = await seedQuestions('Quant', ['Percentages', 'Ratios', 'Algebra']);

    await recordAnswerOutcome(user._id, questions[0], true);

    const picked = await getNextQuestions(user._id, 'Quant', 2, { examTag: 'SSC CGL' });

    expect(picked).toHaveLength(2);
    expect(picked.some((item) => item._id.toString() === questions[0]._id.toString())).toBe(
      false
    );
  });

  it('lowers mastery after incorrect answers', async () => {
    const user = await createUser();
    const [question] = await seedQuestions('Quant', ['Ratios']);

    const { mastery } = await recordAnswerOutcome(user._id, question, false);
    expect(mastery.rating).toBeLessThan(1500);
  });
});
