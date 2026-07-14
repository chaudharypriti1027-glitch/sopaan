/** Convert correct/total into a 0–100 score for rewards and leaderboards. */
export function percentScore(correct: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round((correct / total) * 100)));
}

/** Safety clamp for legacy games that may still report raw points. */
export function clampGameScore(score: number): number {
  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}
