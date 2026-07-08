export const NOTIFICATION_TYPES = Object.freeze({
  RANK_UP: 'rank_up',
  STREAK_REMINDER: 'streak_reminder',
  NEW_CURRENT_AFFAIRS: 'new_current_affairs',
  PLAN_READY: 'plan_ready',
  MOCK_LIVE: 'mock_live',
  LIVE_CLASS_SCHEDULED: 'live_class_scheduled',
  PROGRESS_RECAP: 'progress_recap',
  BADGE: 'badge',
  REWARD: 'reward',
  MENTOR: 'mentor',
  PREMIUM_ACTIVATED: 'premium_activated',
});

/** @deprecated use NOTIFICATION_TYPES */
export const PUSH_TYPES = NOTIFICATION_TYPES;

export const DEFAULT_DAILY_PUSH_CAP = Number(process.env.NOTIFICATION_DAILY_PUSH_CAP ?? 8);

export const DEFAULT_QUIET_HOURS = Object.freeze({
  enabled: true,
  start: '22:00',
  end: '07:00',
  timezone: process.env.JOBS_TIMEZONE?.trim() || 'Asia/Kolkata',
});

export const DEFAULT_TYPE_PREFERENCES = Object.freeze({
  [NOTIFICATION_TYPES.RANK_UP]: true,
  [NOTIFICATION_TYPES.STREAK_REMINDER]: true,
  [NOTIFICATION_TYPES.NEW_CURRENT_AFFAIRS]: false,
  [NOTIFICATION_TYPES.PLAN_READY]: true,
  [NOTIFICATION_TYPES.MOCK_LIVE]: true,
  [NOTIFICATION_TYPES.LIVE_CLASS_SCHEDULED]: true,
  [NOTIFICATION_TYPES.PROGRESS_RECAP]: true,
  [NOTIFICATION_TYPES.BADGE]: true,
  [NOTIFICATION_TYPES.REWARD]: true,
  [NOTIFICATION_TYPES.MENTOR]: true,
  [NOTIFICATION_TYPES.PREMIUM_ACTIVATED]: true,
});

export const PUSH_ELIGIBLE_TYPES = new Set(Object.values(NOTIFICATION_TYPES));

export function buildDeepLinkPayload(type, data = {}) {
  switch (type) {
    case NOTIFICATION_TYPES.RANK_UP:
      return {
        screen: 'MockAnalysis',
        params: { attemptId: data.attemptId ?? undefined },
      };
    case NOTIFICATION_TYPES.STREAK_REMINDER:
      return { screen: 'StudyPlanner', params: {} };
    case NOTIFICATION_TYPES.NEW_CURRENT_AFFAIRS:
      return {
        screen: 'CurrentAffairsTab',
        params: { digestId: data.digestId ?? undefined, affairId: data.affairId ?? undefined },
      };
    case NOTIFICATION_TYPES.PLAN_READY:
      return { screen: 'StudyPlanner', params: { date: data.date ?? undefined } };
    case NOTIFICATION_TYPES.MOCK_LIVE:
      return { screen: 'TestSeries', params: { seriesId: data.seriesId ?? undefined } };
    case NOTIFICATION_TYPES.LIVE_CLASS_SCHEDULED:
      return {
        screen: 'LiveClassViewer',
        params: { liveClassId: data.liveClassId ?? undefined },
      };
    case NOTIFICATION_TYPES.PROGRESS_RECAP:
      return { screen: 'ProgressAnalytics', params: { weekKey: data.weekKey ?? undefined } };
    case NOTIFICATION_TYPES.BADGE:
    case NOTIFICATION_TYPES.REWARD:
      return { screen: 'Rewards', params: {} };
    case NOTIFICATION_TYPES.MENTOR:
      return { screen: 'Mentors', params: {} };
    case NOTIFICATION_TYPES.PREMIUM_ACTIVATED:
      return { screen: 'Premium', params: { plan: data.plan ?? undefined } };
    default:
      return { screen: 'Notifications', params: {} };
  }
}

export function mergeNotificationData(type, data = {}) {
  const deepLink = buildDeepLinkPayload(type, data);

  return {
    ...data,
    screen: deepLink.screen,
    params: deepLink.params,
  };
}
