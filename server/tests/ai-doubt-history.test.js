import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import mongoose from 'mongoose';
import {
  findUserExactDoubtAnswer,
  listDoubtAnswers,
  saveDoubtAnswer,
} from '../src/services/ai/aiDoubtHistoryService.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';

describe('aiDoubtHistoryService', () => {
  let userId;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
    userId = new mongoose.Types.ObjectId();
  });

  it('saves and lists doubt answers for a user', async () => {
    const saved = await saveDoubtAnswer({
      userId,
      question: 'What is GDP?',
      explanation: 'GDP measures total output.',
      language: 'en',
      responseMs: 1200,
    });

    expect(saved?.id).toBeTruthy();

    const list = await listDoubtAnswers(userId);
    expect(list.items).toHaveLength(1);
    expect(list.items[0].question).toBe('What is GDP?');
  });

  it('finds exact user history match', async () => {
    await saveDoubtAnswer({
      userId,
      question: 'Define inflation',
      explanation: 'Inflation is rising prices.',
      language: 'en',
    });

    const match = await findUserExactDoubtAnswer(userId, 'Define inflation', 'en');
    expect(match?.explanation).toContain('Inflation');
    expect(match?.cacheSource).toBe('user_history');
  });

  it('upserts duplicate questions instead of creating new rows', async () => {
    await saveDoubtAnswer({
      userId,
      question: 'What is GDP?',
      explanation: 'First answer.',
      language: 'en',
    });

    await saveDoubtAnswer({
      userId,
      question: 'What is GDP?',
      explanation: 'Updated answer.',
      language: 'en',
      fromCache: true,
      cacheSource: 'exact_cache',
    });

    const list = await listDoubtAnswers(userId);
    expect(list.items).toHaveLength(1);
    expect(list.items[0].explanation).toBe('Updated answer.');
    expect(list.items[0].fromCache).toBe(true);
  });
});
