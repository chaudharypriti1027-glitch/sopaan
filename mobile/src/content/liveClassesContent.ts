import type { LucideIcon } from 'lucide-react-native';
import { Flame, Heart, PartyPopper, ThumbsUp } from 'lucide-react-native';
import { DEFAULT_EXAM_TAG } from './featureDefaultsContent';
import { LOCALE_INTL, isAppLocale, type AppLocale } from '../i18n/config';

/** Minutes before class start when reminder fires. */
export const LIVE_REMINDER_MINUTES_BEFORE = 15;

/** Default exam tag for live classes without an exam. */
export const DEFAULT_LIVE_EXAM_TAG = DEFAULT_EXAM_TAG;

/**
 * Live viewer reactions — Lucide icons for UI (offline-safe), emoji kept for
 * the realtime wire format so peers still receive familiar symbols.
 */
export const LIVE_REACTIONS = [
  { emoji: '👍', Icon: ThumbsUp, labelKey: 'thumbsUp' },
  { emoji: '🔥', Icon: Flame, labelKey: 'fire' },
  { emoji: '👏', Icon: PartyPopper, labelKey: 'clap' },
  { emoji: '❤️', Icon: Heart, labelKey: 'heart' },
] as const;

/** @deprecated Prefer LIVE_REACTIONS — emoji-only list for wire/tests. */
export const LIVE_REACTION_EMOJIS = LIVE_REACTIONS.map((item) => item.emoji);

const REACTION_ICON_BY_EMOJI: Record<string, LucideIcon> = Object.fromEntries(
  LIVE_REACTIONS.map((item) => [item.emoji, item.Icon]),
);

/** Map a reaction emoji from the wire to a Lucide icon (fallback: Heart). */
export function resolveLiveReactionIcon(emoji: string): LucideIcon {
  return REACTION_ICON_BY_EMOJI[emoji] ?? Heart;
}

/** Fallback Intl locale for live class schedule formatting (India / exam calendars). */
export const LIVE_DATE_LOCALE = LOCALE_INTL.en;

function resolveLiveDateLocale(locale?: AppLocale | string): string {
  if (!locale) return LIVE_DATE_LOCALE;
  const short = locale.split('-')[0] ?? locale;
  if (isAppLocale(short)) return LOCALE_INTL[short];
  if (locale.includes('-')) return locale;
  return LIVE_DATE_LOCALE;
}

export function formatLiveClassWhen(iso?: string, locale?: AppLocale | string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString(resolveLiveDateLocale(locale), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatLiveClassWhenLong(iso?: string, locale?: AppLocale | string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString(resolveLiveDateLocale(locale), {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
