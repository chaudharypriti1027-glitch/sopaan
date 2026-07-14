/** Shared test / quiz builder constants (Practice, Create Test, Community). */

export const TEST_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type TestDifficulty = (typeof TEST_DIFFICULTIES)[number];

export const QUIZ_OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;

/** Default question count when AI auto-generates a community test. */
export const CREATE_TEST_AI_QUESTION_COUNT = 5;

/** i18n keys under `practice.*` for difficulty chip labels. */
export const DIFFICULTY_LABEL_KEYS: Record<TestDifficulty, string> = {
  easy: 'practice.difficultyEasy',
  medium: 'practice.difficultyMedium',
  hard: 'practice.difficultyHard',
};
