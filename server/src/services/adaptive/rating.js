/** Elo-style rating constants (deterministic, no LLM). */
export const DEFAULT_MASTERY_RATING = 1500;
export const MIN_RATING = 800;
export const MAX_RATING = 2400;

export const DIFFICULTY_RATINGS = Object.freeze({
  easy: 1300,
  medium: 1500,
  hard: 1700,
});

export const K_USER = 32;
export const K_QUESTION = 8;

/** Target questions slightly above current mastery to stretch the learner. */
export const STRETCH_OFFSET = 75;
export const STRETCH_BAND = 125;

/**
 * Expected score for a player rated `playerRating` against an item rated `itemRating`.
 * Returns a value in [0, 1].
 */
export function expectedScore(playerRating, itemRating) {
  return 1 / (1 + 10 ** ((itemRating - playerRating) / 400));
}

/**
 * Update a single rating after an outcome.
 * @param {number} currentRating
 * @param {number} opponentRating
 * @param {boolean} won - true if the player answered correctly
 * @param {number} kFactor
 */
export function updateRating(currentRating, opponentRating, won, kFactor) {
  const actual = won ? 1 : 0;
  const expected = expectedScore(currentRating, opponentRating);
  const next = currentRating + kFactor * (actual - expected);
  return clampRating(next);
}

/**
 * Apply a user-vs-question outcome to both ratings.
 */
export function applyOutcome({ userRating, questionRating, correct }) {
  const nextUser = updateRating(userRating, questionRating, correct, K_USER);
  const nextQuestion = updateRating(questionRating, userRating, !correct, K_QUESTION);

  return {
    userRating: nextUser,
    questionRating: nextQuestion,
  };
}

export function clampRating(rating) {
  return Math.round(Math.min(MAX_RATING, Math.max(MIN_RATING, rating)));
}

export function ratingFromDifficulty(difficulty) {
  return DIFFICULTY_RATINGS[difficulty] ?? DEFAULT_MASTERY_RATING;
}

export function ratingToDifficultyLabel(rating) {
  if (rating < 1400) {
    return 'easy';
  }
  if (rating < 1600) {
    return 'medium';
  }
  return 'hard';
}

/**
 * Target item difficulty for selection: slightly above mastery.
 */
export function targetQuestionRating(masteryRating) {
  return clampRating(masteryRating + STRETCH_OFFSET);
}

/**
 * Acceptable rating window for question selection.
 */
export function questionRatingWindow(masteryRating) {
  const target = targetQuestionRating(masteryRating);
  return {
    min: clampRating(target - STRETCH_BAND),
    max: clampRating(target + STRETCH_BAND),
  };
}
