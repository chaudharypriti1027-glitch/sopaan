import {
  estimatePracticeDurationMin,
  PRACTICE_QUESTION_COUNTS,
  PRACTICE_SUBJECT_SUGGESTIONS,
  SECONDS_PER_QUESTION,
} from '../practiceGeneratorContent';

describe('practiceGeneratorContent', () => {
  it('exposes subject suggestions and question counts', () => {
    expect(PRACTICE_SUBJECT_SUGGESTIONS.length).toBeGreaterThan(5);
    expect(PRACTICE_QUESTION_COUNTS).toEqual([5, 8, 10, 12, 15, 20]);
  });

  it('estimates duration from question count', () => {
    expect(estimatePracticeDurationMin(10)).toBe(Math.round((10 * SECONDS_PER_QUESTION) / 60));
    expect(estimatePracticeDurationMin(1)).toBeGreaterThanOrEqual(1);
  });
});
