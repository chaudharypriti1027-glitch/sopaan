import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import { resetEmbeddingProviderForTests } from '../src/services/embeddings/index.js';
import { Question } from '../src/models/Question.js';
import { cacheAiDoubtAnswer, findSimilarAnsweredDoubts } from '../src/services/semantic/doubtSemanticService.js';
import {
  ensureQuestionEmbedding,
  getRelatedQuestions,
  insertQuestionsWithDedup,
} from '../src/services/semantic/questionSemanticService.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';

describe('semantic search integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    resetEmbeddingProviderForTests();
    await clearTestDatabase();
  });

  it('reuses cached AI doubt answers for identical queries', async () => {
    await cacheAiDoubtAnswer({
      queryText: 'What is compound interest?',
      explanation: 'Interest on principal plus accumulated interest.',
      language: 'en',
    });

    const matches = await findSimilarAnsweredDoubts('What is compound interest?', {
      language: 'en',
      limit: 1,
    });

    expect(matches).toHaveLength(1);
    expect(matches[0].explanation).toContain('accumulated interest');
  });

  it('flags near-duplicate generated questions for review instead of reusing them', async () => {
    const existing = await Question.create({
      subject: 'Math',
      topic: 'Percentages',
      difficulty: 'easy',
      text: 'What is 20 percent of 200?',
      options: [
        { key: 'A', text: '20' },
        { key: 'B', text: '40' },
        { key: 'C', text: '60' },
        { key: 'D', text: '80' },
      ],
      correctKey: 'B',
      explanation: '20% of 200 is 40',
      source: 'ai',
      language: 'en',
      reviewStatus: 'approved',
    });

    await ensureQuestionEmbedding(existing);

    const { questions, duplicateCount } = await insertQuestionsWithDedup(
      [
        {
          text: 'What is 20 percent of 200?',
          topic: 'Percentages',
          difficulty: 'easy',
          options: [
            { key: 'A', text: '20' },
            { key: 'B', text: '40' },
            { key: 'C', text: '60' },
            { key: 'D', text: '80' },
          ],
          correctKey: 'B',
          explanation: 'Twenty percent of two hundred equals forty.',
        },
        {
          text: 'Find the square root of 144',
          topic: 'Roots',
          difficulty: 'easy',
          options: [
            { key: 'A', text: '10' },
            { key: 'B', text: '11' },
            { key: 'C', text: '12' },
            { key: 'D', text: '13' },
          ],
          correctKey: 'C',
          explanation: 'Twelve times twelve equals one hundred forty-four.',
        },
      ],
      {
        subject: 'Math',
        examTag: 'SSC',
        language: 'en',
        userId: existing.createdBy,
      },
    );

    expect(duplicateCount).toBe(1);
    expect(questions).toHaveLength(2);
    expect(await Question.countDocuments()).toBe(3);
    expect(questions[0].reviewStatus).toBe('pending');
    expect(questions[0].duplicateOf?.toString()).toBe(existing._id.toString());
  });

  it('returns related questions excluding the source question', async () => {
    const questionPayload = {
      subject: 'Polity',
      topic: 'Fundamental Rights',
      difficulty: 'medium',
      text: 'Which article abolishes untouchability?',
      options: [
        { key: 'A', text: 'Article 14' },
        { key: 'B', text: 'Article 17' },
        { key: 'C', text: 'Article 21' },
        { key: 'D', text: 'Article 32' },
      ],
      correctKey: 'B',
      explanation: 'Article 17',
      source: 'official',
      language: 'en',
    };

    const base = await Question.create(questionPayload);

    const relatedDoc = await Question.create({
      ...questionPayload,
      topic: 'Constitutional Articles',
      explanation: 'Article 17 abolishes untouchability',
    });

    await ensureQuestionEmbedding(base);
    await ensureQuestionEmbedding(relatedDoc);

    await Question.create({
      subject: 'Polity',
      topic: 'Chemistry',
      difficulty: 'easy',
      text: 'What is the chemical formula for water?',
      options: [
        { key: 'A', text: 'H2O' },
        { key: 'B', text: 'CO2' },
        { key: 'C', text: 'O2' },
        { key: 'D', text: 'NaCl' },
      ],
      correctKey: 'A',
      explanation: 'Water is H2O',
      source: 'official',
      language: 'en',
    });

    const related = await getRelatedQuestions(base._id, { limit: 3 });

    expect(related.some((item) => item.id === relatedDoc._id.toString())).toBe(true);
    expect(related.some((item) => item.id === base._id.toString())).toBe(false);
  });
});
