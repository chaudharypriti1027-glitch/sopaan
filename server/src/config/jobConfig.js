import { env } from './env.js';

function readCron(envKey, fallback) {
  const value = process.env[envKey]?.trim();
  return value || fallback;
}

export const JOB_NAMES = Object.freeze({
  DAILY_PLAN: 'daily-plan',
  STREAK_REMINDER: 'streak-reminder',
  CA_DIGEST_GENERATE: 'ca-digest-generate',
  CA_DIGEST_NOTIFY: 'ca-digest-notify',
  WEEKLY_RECAP: 'weekly-recap',
  OBSERVABILITY_SPIKE_CHECK: 'observability-spike-check',
  DAILY_LEAGUE_MAINTENANCE: 'daily-league-maintenance',
  ADMIN_NOTIFICATION_SEND: 'admin-notification-send',
  BOOK_GEN: 'book-gen',
  ATTEMPT_COACHING: 'attempt-coaching',
});

export const jobConfig = Object.freeze({
  enabled: process.env.JOBS_ENABLED !== 'false',
  timezone: process.env.JOBS_TIMEZONE?.trim() || 'Asia/Kolkata',
  staleRunningMs: Number(process.env.JOBS_STALE_RUNNING_MS ?? 30 * 60 * 1000),
  schedules: Object.freeze({
    [JOB_NAMES.DAILY_PLAN]: readCron('JOB_CRON_DAILY_PLAN', '0 6 * * *'),
    [JOB_NAMES.STREAK_REMINDER]: readCron('JOB_CRON_STREAK_REMINDER', '0 20 * * *'),
    [JOB_NAMES.CA_DIGEST_GENERATE]: readCron('JOB_CRON_CA_DIGEST_GENERATE', '0 6 * * *'),
    [JOB_NAMES.CA_DIGEST_NOTIFY]: readCron('JOB_CRON_CA_DIGEST_NOTIFY', '0 7 * * *'),
    [JOB_NAMES.WEEKLY_RECAP]: readCron('JOB_CRON_WEEKLY_RECAP', '0 9 * * 1'),
    [JOB_NAMES.OBSERVABILITY_SPIKE_CHECK]: readCron('JOB_CRON_OBS_SPIKE_CHECK', '*/5 * * * *'),
    [JOB_NAMES.DAILY_LEAGUE_MAINTENANCE]: readCron(
      'JOB_CRON_DAILY_LEAGUE_MAINTENANCE',
      '5 0 * * *'
    ),
  }),
  caDigestEnabled: env.caDigestEnabled,
});

export const JOB_DEFINITIONS = Object.freeze([
  {
    name: JOB_NAMES.DAILY_PLAN,
    description: 'Generate adaptive daily study plans and send plan-ready push notifications',
    scheduleEnv: 'JOB_CRON_DAILY_PLAN',
    defaultSchedule: '0 6 * * *',
    period: 'daily',
  },
  {
    name: JOB_NAMES.STREAK_REMINDER,
    description: 'Remind users with active streaks who have not studied today',
    scheduleEnv: 'JOB_CRON_STREAK_REMINDER',
    defaultSchedule: '0 20 * * *',
    period: 'daily',
  },
  {
    name: JOB_NAMES.CA_DIGEST_GENERATE,
    description: 'Ingest RSS feeds and build the daily current-affairs digest',
    scheduleEnv: 'JOB_CRON_CA_DIGEST_GENERATE',
    defaultSchedule: '0 6 * * *',
    period: 'daily',
    requiresCaDigest: true,
  },
  {
    name: JOB_NAMES.CA_DIGEST_NOTIFY,
    description: 'Send push notifications when the daily CA digest is ready',
    scheduleEnv: 'JOB_CRON_CA_DIGEST_NOTIFY',
    defaultSchedule: '0 7 * * *',
    period: 'daily',
    requiresCaDigest: true,
  },
  {
    name: JOB_NAMES.WEEKLY_RECAP,
    description: 'Notify enrolled users about live mocks and send weekly progress recaps',
    scheduleEnv: 'JOB_CRON_WEEKLY_RECAP',
    defaultSchedule: '0 9 * * 1',
    period: 'weekly',
  },
  {
    name: JOB_NAMES.OBSERVABILITY_SPIKE_CHECK,
    description: 'Detect error-rate and AI cost spikes for alerting',
    scheduleEnv: 'JOB_CRON_OBS_SPIKE_CHECK',
    defaultSchedule: '*/5 * * * *',
    period: 'interval',
  },
  {
    name: JOB_NAMES.DAILY_LEAGUE_MAINTENANCE,
    description:
      'Break streaks for inactive users, reset weekly XP on Mondays, recompute league tiers',
    scheduleEnv: 'JOB_CRON_DAILY_LEAGUE_MAINTENANCE',
    defaultSchedule: '5 0 * * *',
    period: 'daily',
  },
]);
