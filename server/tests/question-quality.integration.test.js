import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import { Question } from '../src/models/Question.js';
import {
  createQuestion,
  setQuestionStatus,
  reviewQuestion,
} from '../src/services/admin/adminQuestionService.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { createTestUser } from './helpers/fixtures.js';

describe('question quality gate integration', () => {
  let adminId;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
    const admin = await createTestUser({
      name: 'Admin',
      email: 'admin-quality@test.com',
      passwordHash: 'hash',
      role: 'admin',
    });
    adminId = admin._id;
  });

  it('auto-approves clean imported questions and blocks bad publish attempts', async () => {
    const good = await createQuestion(adminId, {
      subject: 'Polity',
      topic: 'Fundamental Rights',
      difficulty: 'medium',
      text: 'Which article abolishes untouchability in India?',
      options: [
        { key: 'A', text: 'Article 14' },
        { key: 'B', text: 'Article 17' },
        { key: 'C', text: 'Article 21' },
        { key: 'D', text: 'Article 32' },
      ],
      correctKey: 'B',
      explanation: 'Article 17 abolishes untouchability and forbids its practice in any form.',
    });

    expect(good.reviewStatus).toBe('approved');
    expect(good.canPublish).toBe(true);

    const published = await setQuestionStatus(adminId, good.id, 'published');
    expect(published.status).toBe('published');
  });

  it('flags duplicates and keeps them in pending review', async () => {
    await createQuestion(adminId, {
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
      explanation: 'Twenty percent of two hundred equals forty.',
    });

    const duplicate = await createQuestion(adminId, {
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
      explanation: 'Twenty percent of two hundred equals forty.',
    });

    expect(duplicate.reviewStatus).toBe('pending');
    expect(duplicate.qualityIssues.some((issue) => issue.code === 'NEAR_DUPLICATE')).toBe(true);
    expect(duplicate.canPublish).toBe(false);

    await expect(setQuestionStatus(adminId, duplicate.id, 'published')).rejects.toMatchObject({
      code: 'QUALITY_GATE_FAILED',
    });
  });

  it('supports merge and reject review actions', async () => {
    const canonical = await createQuestion(adminId, {
      subject: 'Math',
      topic: 'Roots',
      difficulty: 'easy',
      text: 'What is the square root of one hundred forty-four?',
      options: [
        { key: 'A', text: '10' },
        { key: 'B', text: '11' },
        { key: 'C', text: '12' },
        { key: 'D', text: '13' },
      ],
      correctKey: 'C',
      explanation: 'Twelve multiplied by twelve equals one hundred forty-four.',
    });

    const duplicate = await createQuestion(adminId, {
      subject: 'Math',
      topic: 'Roots',
      difficulty: 'easy',
      text: 'What is the square root of one hundred forty-four?',
      options: [
        { key: 'A', text: '10' },
        { key: 'B', text: '11' },
        { key: 'C', text: '12' },
        { key: 'D', text: '13' },
      ],
      correctKey: 'C',
      explanation: 'Twelve multiplied by twelve equals one hundred forty-four.',
    });

    const merged = await reviewQuestion(adminId, duplicate.id, {
      action: 'merge',
      mergeTargetId: canonical.id,
    });

    expect(merged.reviewStatus).toBe('rejected');
    expect(merged.duplicateOf?.id).toBe(canonical.id);

    const bad = await Question.create({
      subject: 'Science',
      topic: 'Basics',
      difficulty: 'easy',
      text: 'Which gas do plants absorb during photosynthesis?',
      options: [
        { key: 'A', text: 'Oxygen' },
        { key: 'B', text: 'Carbon dioxide' },
        { key: 'C', text: 'Nitrogen' },
        { key: 'D', text: 'Hydrogen' },
      ],
      correctKey: 'B',
      explanation: 'Plants absorb carbon dioxide during photosynthesis.',
      source: 'official',
      reviewStatus: 'pending',
      qualityIssues: [{ code: 'NEAR_DUPLICATE', message: 'dup', severity: 'error' }],
    });

    const rejected = await reviewQuestion(adminId, bad._id.toString(), { action: 'reject' });
    expect(rejected.reviewStatus).toBe('rejected');
  });
});
