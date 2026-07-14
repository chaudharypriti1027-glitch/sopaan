import {
  COMMUNITY_TEST_TABS,
  DEFAULT_EXAM_TAG,
  DEFAULT_FORUM_SUBJECT,
  DEFAULT_STUDY_SESSION_TYPE,
  STUDY_MIN_SESSION_MINUTES,
  STUDY_SESSION_TYPE_SUGGESTIONS,
  VOCAB_QUIZ_MAX_QUESTIONS,
  VOCAB_QUIZ_MIN_POOL,
} from '../featureDefaultsContent';

describe('featureDefaultsContent', () => {
  it('exposes forum and quiz defaults', () => {
    expect(DEFAULT_EXAM_TAG).toBe('SSC-CGL');
    expect(DEFAULT_FORUM_SUBJECT).toBe('General');
    expect(VOCAB_QUIZ_MAX_QUESTIONS).toBe(5);
    expect(VOCAB_QUIZ_MIN_POOL).toBe(3);
  });

  it('defines community test tabs with i18n keys', () => {
    expect(COMMUNITY_TEST_TABS).toHaveLength(2);
    expect(COMMUNITY_TEST_TABS[0].labelKey).toBe('communityTests.tabPublished');
  });

  it('lists study session type suggestions', () => {
    expect(STUDY_SESSION_TYPE_SUGGESTIONS).toContain('mock');
    expect(DEFAULT_STUDY_SESSION_TYPE).toBe('study');
    expect(STUDY_MIN_SESSION_MINUTES).toBe(5);
  });
});
