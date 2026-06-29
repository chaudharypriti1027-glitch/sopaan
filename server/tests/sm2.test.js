import { describe, expect, it } from '@jest/globals';
import {
  applySm2Review,
  RATING_TO_GRADE,
  SM2_INITIAL,
  ratingToGrade,
} from '../src/services/flashcards/sm2.js';

const NOW = new Date('2026-06-26T12:00:00.000Z');

function daysFromNow(days) {
  const date = new Date(NOW);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

describe('SM-2 flashcard transitions', () => {
  it('maps UI ratings to SM-2 grades', () => {
    expect(ratingToGrade('again')).toBe(1);
    expect(ratingToGrade('hard')).toBe(3);
    expect(ratingToGrade('good')).toBe(4);
    expect(ratingToGrade('easy')).toBe(5);
    expect(RATING_TO_GRADE.again).toBeLessThan(3);
  });

  it('Again resets repetitions and schedules a 1-day interval', () => {
    const prior = { easeFactor: 2.5, intervalDays: 12, repetitions: 3 };
    const next = applySm2Review(prior, RATING_TO_GRADE.again, NOW);

    expect(next.repetitions).toBe(0);
    expect(next.intervalDays).toBe(1);
    expect(next.dueDate.toISOString()).toBe(daysFromNow(1));
    expect(next.easeFactor).toBeLessThan(prior.easeFactor);
  });

  it('Hard passes with a short first interval and lowers ease slightly', () => {
    const next = applySm2Review(SM2_INITIAL, RATING_TO_GRADE.hard, NOW);

    expect(next.repetitions).toBe(1);
    expect(next.intervalDays).toBe(1);
    expect(next.dueDate.toISOString()).toBe(daysFromNow(1));
    expect(next.easeFactor).toBe(2.36);
  });

  it('Good starts the SM-2 ladder on a new card', () => {
    const next = applySm2Review(SM2_INITIAL, RATING_TO_GRADE.good, NOW);

    expect(next.repetitions).toBe(1);
    expect(next.intervalDays).toBe(1);
    expect(next.dueDate.toISOString()).toBe(daysFromNow(1));
    expect(next.easeFactor).toBe(2.5);
  });

  it('Easy increases ease and schedules the first interval', () => {
    const next = applySm2Review(SM2_INITIAL, RATING_TO_GRADE.easy, NOW);

    expect(next.repetitions).toBe(1);
    expect(next.intervalDays).toBe(1);
    expect(next.dueDate.toISOString()).toBe(daysFromNow(1));
    expect(next.easeFactor).toBe(2.6);
  });

  it('Good on second repetition moves interval to 6 days', () => {
    const afterFirstGood = applySm2Review(SM2_INITIAL, RATING_TO_GRADE.good, NOW);
    const next = applySm2Review(afterFirstGood, RATING_TO_GRADE.good, NOW);

    expect(next.repetitions).toBe(2);
    expect(next.intervalDays).toBe(6);
    expect(next.dueDate.toISOString()).toBe(daysFromNow(6));
  });

  it('Good on third repetition multiplies interval by ease factor', () => {
    const first = applySm2Review(SM2_INITIAL, RATING_TO_GRADE.good, NOW);
    const second = applySm2Review(first, RATING_TO_GRADE.good, NOW);
    const third = applySm2Review(second, RATING_TO_GRADE.good, NOW);

    expect(third.repetitions).toBe(3);
    expect(third.intervalDays).toBe(15);
    expect(third.dueDate.toISOString()).toBe(daysFromNow(15));
  });

  it('Hard after a successful streak keeps repetition but uses multiplied interval', () => {
    const first = applySm2Review(SM2_INITIAL, RATING_TO_GRADE.good, NOW);
    const second = applySm2Review(first, RATING_TO_GRADE.good, NOW);
    const third = applySm2Review(second, RATING_TO_GRADE.hard, NOW);

    expect(third.repetitions).toBe(3);
    expect(third.intervalDays).toBe(15);
    expect(third.easeFactor).toBe(2.36);
  });

  it('does not let ease factor fall below 1.3', () => {
    const lowEase = { easeFactor: 1.31, intervalDays: 6, repetitions: 2 };
    const next = applySm2Review(lowEase, RATING_TO_GRADE.again, NOW);

    expect(next.easeFactor).toBe(1.3);
  });
});
