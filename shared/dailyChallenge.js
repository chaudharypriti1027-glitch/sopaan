/** Game catalog order — must match mobile `GAME_CATALOG` in games/content.ts */
export const GAME_CATALOG_IDS = [
  'memory-match',
  'word-scramble',
  'gk-bingo',
  'rapid-fire',
  'crossword',
  'map-quiz',
  'math-blitz',
  'grammar-fix',
  'science-lab',
  'history-line',
  'spelling-bee',
  'flag-master',
  'logic-puzzle',
  'number-ninja',
  'word-chain',
  'world-quiz',
  'trivia-blitz',
  'code-breaker',
  'story-builder',
];

/** @param {Date} [date] */
export function getDailyChallengeGameId(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return GAME_CATALOG_IDS[dayOfYear % GAME_CATALOG_IDS.length];
}
