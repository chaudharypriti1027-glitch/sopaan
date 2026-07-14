import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { signAccessToken } from '../src/utils/jwt.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';

const PHONE = '+919876543211';

function authHeader(user) {
  return { Authorization: `Bearer ${signAccessToken(user)}` };
}

describe('POST /api/games/complete', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('awards coins and returns updated profile', async () => {
    const user = await User.create({
      name: 'Gamer',
      phone: PHONE,
      state: 'Gujarat',
      targetExam: 'SSC CGL',
      coins: 50,
      onboardingComplete: true,
    });

    const response = await request(app)
      .post('/api/games/complete')
      .set(authHeader(user))
      .send({ gameId: 'rapid-fire', score: 80 });

    expect(response.status).toBe(200);
    expect(response.body.coinsAwarded).toBeGreaterThan(0);
    expect(response.body.xpAwarded).toBeGreaterThan(0);
    expect(response.body.profile.coins).toBeGreaterThan(50);
    expect(response.body.coaching).toMatchObject({
      feedback: expect.any(String),
      weakTopics: expect.any(Array),
      actions: expect.any(Array),
    });
    expect(Array.isArray(response.body.review)).toBe(true);

    const refreshed = await User.findById(user._id);
    expect(refreshed.coins).toBe(response.body.profile.coins);
  });

  it('rejects invalid gameId', async () => {
    const user = await User.create({
      name: 'Gamer',
      phone: PHONE,
      state: 'Gujarat',
      targetExam: 'SSC CGL',
      onboardingComplete: true,
    });

    const response = await request(app)
      .post('/api/games/complete')
      .set(authHeader(user))
      .send({ gameId: 'invalid-game', score: 10 });

    expect(response.status).toBe(400);
  });

  it('returns topic coaching when MCQ answers are sent', async () => {
    const user = await User.create({
      name: 'Gamer',
      phone: '+919876543212',
      state: 'Gujarat',
      targetExam: 'SSC CGL',
      coins: 50,
      onboardingComplete: true,
    });

    const response = await request(app)
      .post('/api/games/complete')
      .set(authHeader(user))
      .send({
        gameId: 'science-lab',
        score: 33,
        gameTitle: 'Science Lab',
        answers: [
          {
            questionId: 's1',
            prompt: 'Gold symbol?',
            topic: 'Chemistry',
            selected: 'Go',
            correct: false,
            correctAnswer: 'Au',
            explanation: 'Answer: B — Au\nExplanation:\n- Gold is Au on the periodic table.',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.coaching.weakTopics).toContain('Chemistry');
    expect(response.body.review).toHaveLength(1);
    expect(response.body.review[0].explanation).toContain('Au');
  });
});
