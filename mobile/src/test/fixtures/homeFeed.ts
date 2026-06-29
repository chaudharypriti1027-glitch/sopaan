import type { HomeFeed } from '../../types/home';

export function createMockHomeFeed(overrides: Partial<HomeFeed> = {}): HomeFeed {
  return {
    greeting: {
      name: 'Priya Sharma',
      message: 'Good morning',
      dateLabel: 'Thu, 26 Jun',
      unreadCount: 2,
    },
    streak: { current: 12, best: 18, freezes: 1, todayDone: true },
    rank: { air: 1234, percentile: 92, deltaWeek: 48, ringPct: 72 },
    countdown: { examName: 'UPSC Prelims', daysLeft: 42, dateLabel: 'Jun 2026' },
    continue: [
      {
        id: 'lesson-1',
        kind: 'lesson',
        title: 'Continue Polity',
        subtitle: 'Chapter 4 · Fundamental Rights',
        progressPct: 65,
        accent: 'primary',
        deeplink: '/stack/CourseDetail/course-1',
      },
    ],
    aiNudges: [
      {
        id: 'nudge-streak',
        tone: 'streak',
        icon: 'flame',
        title: 'Keep your streak alive',
        body: 'One quick quiz today keeps the flame going.',
        deeplink: '/tabs/Practice',
      },
      {
        id: 'nudge-weak-topic',
        tone: 'urgent',
        icon: 'alert-circle',
        title: 'Revise Modern History',
        body: 'Accuracy dropped 12% this week.',
        deeplink: '/stack/Quiz/test-history',
      },
    ],
    dailyChallenge: {
      id: 'daily-1',
      title: 'Daily CA Quiz',
      qCount: 10,
      rewardCoins: 25,
      status: 'todo',
    },
    quickActions: [
      { key: 'test', label: 'Take test', icon: 'clipboard-list', deeplink: '/tabs/Practice' },
      { key: 'ai', label: 'Ask AI', icon: 'sparkles', deeplink: '/stack/AskAI' },
      { key: 'ca', label: 'Affairs', icon: 'newspaper', deeplink: '/tabs/CurrentAffairs' },
      { key: 'games', label: 'Games', icon: 'gamepad-2', deeplink: '/stack/Games' },
    ],
    recommendedTests: [
      {
        id: 'rec-1',
        title: 'Full Length Mock #7',
        qCount: 100,
        durationMin: 120,
        difficulty: 'hard',
      },
    ],
    currentAffairs: [
      {
        id: 'ca-1',
        source: 'The Hindu',
        headline: 'India signs green energy pact with ASEAN bloc',
        readMin: 4,
        imageUrl: 'https://example.com/ca-thumb.jpg',
      },
    ],
    league: { tier: 'Gold', rankInLeague: 3, xpThisWeek: 420 },
    generatedAt: '2026-06-26T06:00:00.000Z',
    ...overrides,
  };
}
