import { describe, expect, it } from '@jest/globals';
import {
  applyOutcome,
  clampRating,
  expectedScore,
  questionRatingWindow,
  ratingFromDifficulty,
  ratingToDifficultyLabel,
  targetQuestionRating,
  updateRating,
} from '../src/services/adaptive/rating.js';

describe('adaptive rating math', () => {
  it('expectedScore is 0.5 when ratings are equal', () => {
    expect(expectedScore(1500, 1500)).toBeCloseTo(0.5, 5);
  });

  it('expectedScore favors the higher-rated player', () => {
    expect(expectedScore(1600, 1400)).toBeGreaterThan(0.5);
    expect(expectedScore(1400, 1600)).toBeLessThan(0.5);
  });

  it('updateRating increases rating after a win against a stronger opponent', () => {
    const next = updateRating(1500, 1700, true, 32);
    expect(next).toBeGreaterThan(1500);
  });

  it('updateRating decreases rating after a loss against a weaker opponent', () => {
    const next = updateRating(1500, 1300, false, 32);
    expect(next).toBeLessThan(1500);
  });

  it('applyOutcome moves user and question ratings in opposite directions on correct answer', () => {
    const { userRating, questionRating } = applyOutcome({
      userRating: 1500,
      questionRating: 1550,
      correct: true,
    });

    expect(userRating).toBeGreaterThan(1500);
    expect(questionRating).toBeLessThan(1550);
  });

  it('applyOutcome moves user down and question up on incorrect answer', () => {
    const { userRating, questionRating } = applyOutcome({
      userRating: 1500,
      questionRating: 1550,
      correct: false,
    });

    expect(userRating).toBeLessThan(1500);
    expect(questionRating).toBeGreaterThan(1550);
  });

  it('question rating moves more slowly than user rating (smaller K)', () => {
    const correct = applyOutcome({ userRating: 1500, questionRating: 1500, correct: true });
    const userDelta = correct.userRating - 1500;
    const questionDelta = 1500 - correct.questionRating;

    expect(Math.abs(userDelta)).toBeGreaterThan(Math.abs(questionDelta));
  });

  it('clampRating enforces bounds', () => {
    expect(clampRating(500)).toBe(800);
    expect(clampRating(9999)).toBe(2400);
  });

  it('maps difficulty labels to ratings and back', () => {
    expect(ratingFromDifficulty('easy')).toBe(1300);
    expect(ratingFromDifficulty('hard')).toBe(1700);
    expect(ratingToDifficultyLabel(1300)).toBe('easy');
    expect(ratingToDifficultyLabel(1700)).toBe('hard');
  });

  it('targetQuestionRating stretches above mastery', () => {
    expect(targetQuestionRating(1500)).toBe(1575);
    expect(questionRatingWindow(1500)).toEqual({ min: 1450, max: 1700 });
  });
});
