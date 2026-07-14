import { DEFAULT_EXAM_TAG } from './featureDefaultsContent';

/** Minutes before class start when reminder fires. */
export const LIVE_REMINDER_MINUTES_BEFORE = 15;

/** Default exam tag for live classes without an exam. */
export const DEFAULT_LIVE_EXAM_TAG = DEFAULT_EXAM_TAG;

/** Quick reaction emojis shown in the live viewer. */
export const LIVE_REACTION_EMOJIS = ['👍', '🔥', '👏'] as const;

/** Locale used for live class schedule formatting. */
export const LIVE_DATE_LOCALE = 'en-IN';

export function formatLiveClassWhen(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString(LIVE_DATE_LOCALE, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatLiveClassWhenLong(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString(LIVE_DATE_LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
