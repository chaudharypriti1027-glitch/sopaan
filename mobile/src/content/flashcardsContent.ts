import type { SrRating } from '../api/flashcards';

/** Spaced-repetition rating buttons — labels via `flashcards.*` i18n keys. */
export const SR_RATING_BUTTONS: readonly {
  rating: SrRating;
  labelKey: string;
  color: string;
}[] = [
  { rating: 'again', labelKey: 'flashcards.again', color: '#E53935' },
  { rating: 'hard', labelKey: 'flashcards.hard', color: '#FB8C00' },
  { rating: 'good', labelKey: 'flashcards.good', color: '#43A047' },
  { rating: 'easy', labelKey: 'flashcards.easy', color: '#1E88E5' },
];
