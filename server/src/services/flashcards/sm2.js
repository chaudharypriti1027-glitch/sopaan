/** SuperMemo SM-2 defaults for a new card. */
export const SM2_INITIAL = Object.freeze({
  easeFactor: 2.5,
  intervalDays: 0,
  repetitions: 0,
});

/** UI ratings → SM-2 quality grades (0–5). Again uses 1 (failed recall). */
export const RATING_TO_GRADE = Object.freeze({
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
});

const MIN_EASE = 1.3;

/**
 * Apply one SM-2 review step. Pure function — no I/O.
 *
 * @param {{ easeFactor: number, intervalDays: number, repetitions: number }} state
 * @param {number} grade - SM-2 quality 0–5
 * @param {Date} [now] - reference time for dueDate (testable)
 */
export function applySm2Review(state, grade, now = new Date()) {
  let { easeFactor, intervalDays, repetitions } = state;

  if (grade >= 3) {
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.max(1, Math.round(intervalDays * easeFactor));
    }
    repetitions += 1;
  } else {
    repetitions = 0;
    intervalDays = 1;
  }

  easeFactor += 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02);
  if (easeFactor < MIN_EASE) {
    easeFactor = MIN_EASE;
  }

  const dueDate = new Date(now);
  dueDate.setUTCDate(dueDate.getUTCDate() + intervalDays);

  return {
    easeFactor: roundEase(easeFactor),
    intervalDays,
    repetitions,
    dueDate,
  };
}

export function roundEase(easeFactor) {
  return Math.round(easeFactor * 100) / 100;
}

export function ratingToGrade(rating) {
  const grade = RATING_TO_GRADE[rating];
  if (grade == null) {
    throw new Error(`Invalid flashcard rating: ${rating}`);
  }
  return grade;
}

export function isDue(dueDate, now = new Date()) {
  return new Date(dueDate).getTime() <= now.getTime();
}
