import { PREMIUM_ICON_TONES, type PremiumIconTone } from '../components/premium/premiumIconTokens';

/**
 * Shared multi-color icon-tile palette — same "Classic Premium" tones used on
 * Home's Explore grid and the Profile menu, applied consistently to list/detail
 * icon tiles elsewhere so the whole app reads as one coherent icon system
 * instead of a single repeated flat tint.
 */
const TONE_CYCLE: PremiumIconTone[] = [
  'lavender',
  'mint',
  'gold',
  'rose',
  'sky',
  'violet',
  'coral',
  'slate',
];

/** Cycles through the shared tone palette by position — use for ordered lists. */
export function toneForIndex(index: number): PremiumIconTone {
  return TONE_CYCLE[((index % TONE_CYCLE.length) + TONE_CYCLE.length) % TONE_CYCLE.length];
}

/** Deterministic tone for a label/subject string — same input always renders the same color. */
export function toneForText(text?: string | null): PremiumIconTone {
  if (!text) {
    return TONE_CYCLE[0];
  }
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return TONE_CYCLE[hash % TONE_CYCLE.length];
}

export function toneColors(tone: PremiumIconTone) {
  return PREMIUM_ICON_TONES[tone];
}
