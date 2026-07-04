export const queryKeys = {
  account: {
    all: ['account'] as const,
    me: () => [...queryKeys.account.all, 'me'] as const,
    summary: () => [...queryKeys.account.all, 'summary'] as const,
  },
  home: {
    all: ['home'] as const,
    feed: () => queryKeys.home.all,
    banner: () => [...queryKeys.home.all, 'banner'] as const,
  },
  profile: {
    all: ['profile'] as const,
    me: () => [...queryKeys.profile.all, 'me'] as const,
    readiness: () => [...queryKeys.profile.all, 'readiness'] as const,
    goal: () => [...queryKeys.profile.all, 'goal'] as const,
  },
  exams: {
    all: ['exams'] as const,
    list: (params?: unknown) => [...queryKeys.exams.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.exams.all, 'detail', id] as const,
    calendar: (params?: unknown) => [...queryKeys.exams.all, 'calendar', params] as const,
  },
  tests: {
    all: ['tests'] as const,
    list: (params?: unknown) => [...queryKeys.tests.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.tests.all, 'detail', id] as const,
    community: (params?: unknown) => [...queryKeys.tests.all, 'community', params] as const,
  },
  attempts: {
    all: ['attempts'] as const,
    list: (params?: unknown) => [...queryKeys.attempts.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.attempts.all, 'detail', id] as const,
  },
  courses: {
    all: ['courses'] as const,
    list: (params?: unknown) => [...queryKeys.courses.all, 'list', params] as const,
    detail: (id: string, language?: unknown) =>
      [...queryKeys.courses.all, 'detail', id, language] as const,
  },
  currentAffairs: {
    all: ['current-affairs'] as const,
    list: (params?: unknown) => [...queryKeys.currentAffairs.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.currentAffairs.all, 'detail', id] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (params?: unknown) => [...queryKeys.notifications.all, 'list', params] as const,
  },
  planner: {
    all: ['planner'] as const,
    sessions: (params?: unknown) => [...queryKeys.planner.all, 'sessions', params] as const,
  },
  analytics: {
    all: ['analytics'] as const,
    progress: (params?: unknown) => [...queryKeys.analytics.all, 'progress', params] as const,
  },
  vocabulary: {
    all: ['vocabulary'] as const,
    today: () => [...queryKeys.vocabulary.all, 'today'] as const,
    recent: (limit?: number) => [...queryKeys.vocabulary.all, 'recent', limit] as const,
  },
  books: {
    all: ['books'] as const,
    list: (params?: unknown) => [...queryKeys.books.all, 'list', params] as const,
  },
  revisionCapsules: {
    all: ['revision-capsules'] as const,
    list: (params?: unknown) => [...queryKeys.revisionCapsules.all, 'list', params] as const,
  },
  testSeries: {
    all: ['test-series'] as const,
    list: (params?: unknown) => [...queryKeys.testSeries.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.testSeries.all, 'detail', id] as const,
  },
  mentors: {
    all: ['mentors'] as const,
    list: (params?: unknown) => [...queryKeys.mentors.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.mentors.all, 'detail', id] as const,
  },
  groups: {
    all: ['groups'] as const,
    list: (params?: unknown) => [...queryKeys.groups.all, 'list', params] as const,
  },
  liveClasses: {
    all: ['live-classes'] as const,
    list: () => [...queryKeys.liveClasses.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.liveClasses.all, 'detail', id] as const,
    viewerToken: (id: string) => [...queryKeys.liveClasses.all, 'viewer-token', id] as const,
  },
  leaderboard: {
    all: ['leaderboard'] as const,
    list: (params?: unknown) => [...queryKeys.leaderboard.all, 'list', params] as const,
  },
  successStories: {
    all: ['success-stories'] as const,
    list: () => [...queryKeys.successStories.all, 'list'] as const,
  },
  rewards: {
    all: ['rewards'] as const,
    list: (params?: unknown) => [...queryKeys.rewards.all, 'list', params] as const,
  },
  doubts: {
    all: ['doubts'] as const,
    list: (params?: unknown) => [...queryKeys.doubts.all, 'list', params] as const,
  },
  physical: {
    all: ['physical'] as const,
    standards: (goal?: string) => [...queryKeys.physical.all, 'standards', goal] as const,
    plan: (goal?: string) => [...queryKeys.physical.all, 'plan', goal] as const,
    logs: (params?: unknown) => [...queryKeys.physical.all, 'logs', params] as const,
  },
  badges: {
    all: ['badges'] as const,
    list: () => [...queryKeys.badges.all, 'list'] as const,
  },
  wellness: {
    all: ['wellness'] as const,
    sessions: () => [...queryKeys.wellness.all, 'sessions'] as const,
  },
  flashcards: {
    all: ['flashcards'] as const,
    decks: () => [...queryKeys.flashcards.all, 'decks'] as const,
    due: () => [...queryKeys.flashcards.all, 'due'] as const,
    dueCount: () => [...queryKeys.flashcards.all, 'due-count'] as const,
    deckDueCounts: () => [...queryKeys.flashcards.all, 'deck-due-counts'] as const,
  },
  search: {
    all: ['search'] as const,
    results: (query: string) => [...queryKeys.search.all, query] as const,
  },
  admin: {
    all: ['admin'] as const,
    stats: () => [...queryKeys.admin.all, 'stats'] as const,
    pendingTests: (params?: unknown) => [...queryKeys.admin.all, 'pending', params] as const,
    questions: (params?: unknown) => [...queryKeys.admin.all, 'questions', params] as const,
    reviewQueue: (params?: unknown) => [...queryKeys.admin.all, 'review-queue', params] as const,
    exams: (params?: unknown) => [...queryKeys.admin.all, 'exams', params] as const,
    courses: (params?: unknown) => [...queryKeys.admin.all, 'courses', params] as const,
    currentAffairs: (params?: unknown) => [...queryKeys.admin.all, 'current-affairs', params] as const,
  },
  payments: {
    all: ['payments'] as const,
    plans: () => [...queryKeys.payments.all, 'plans'] as const,
    entitlement: () => [...queryKeys.payments.all, 'entitlement'] as const,
  },
  referrals: {
    all: ['referrals'] as const,
    me: () => [...queryKeys.referrals.all, 'me'] as const,
  },
  experiments: {
    all: ['experiments'] as const,
    me: (installId?: string) => [...queryKeys.experiments.all, installId ?? 'local'] as const,
  },
  tier: {
    all: ['tier'] as const,
    status: () => [...queryKeys.tier.all, 'status'] as const,
  },
  notes: {
    all: ['notes'] as const,
    list: () => [...queryKeys.notes.all, 'list'] as const,
  },
  ai: {
    all: ['ai'] as const,
    doubts: () => [...queryKeys.ai.all, 'doubts'] as const,
  },
} as const;
