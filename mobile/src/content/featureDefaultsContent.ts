/** Default exam tag when profile goal is not set (forum, create test, etc.). */
export const DEFAULT_EXAM_TAG = 'SSC-CGL';

/** Default doubt forum subject line. */
export const DEFAULT_FORUM_SUBJECT = 'General';

/** Vocabulary quick-quiz settings. */
export const VOCAB_QUIZ_MAX_QUESTIONS = 5;
export const VOCAB_QUIZ_MIN_POOL = 3;

/** Community tests tab config — labels via i18n keys. */
export const COMMUNITY_TEST_TABS = [
  { key: 'browse' as const, labelKey: 'communityTests.tabPublished' },
  { key: 'mine' as const, labelKey: 'communityTests.tabMine' },
];

/** Study planner session type suggestions. */
export const STUDY_SESSION_TYPE_SUGGESTIONS = ['study', 'revision', 'mock'] as const;

/** Default session type when adding manually. */
export const DEFAULT_STUDY_SESSION_TYPE = STUDY_SESSION_TYPE_SUGGESTIONS[0];

/** Minimum planner session duration (minutes). */
export const STUDY_MIN_SESSION_MINUTES = 5;

/** Default manual session duration placeholder. */
export const DEFAULT_STUDY_SESSION_MINUTES = 45;

/** Default session start time placeholder. */
export const DEFAULT_STUDY_START_TIME = '09:00';
