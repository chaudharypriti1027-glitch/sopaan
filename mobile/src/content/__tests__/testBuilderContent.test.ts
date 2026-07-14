import {
  CREATE_TEST_AI_QUESTION_COUNT,
  DIFFICULTY_LABEL_KEYS,
  QUIZ_OPTION_KEYS,
  TEST_DIFFICULTIES,
} from '../testBuilderContent';

describe('testBuilderContent', () => {
  it('defines shared difficulty and option keys', () => {
    expect(TEST_DIFFICULTIES).toEqual(['easy', 'medium', 'hard']);
    expect(QUIZ_OPTION_KEYS).toHaveLength(4);
    expect(CREATE_TEST_AI_QUESTION_COUNT).toBe(5);
    expect(DIFFICULTY_LABEL_KEYS.easy).toBe('practice.difficultyEasy');
  });
});
