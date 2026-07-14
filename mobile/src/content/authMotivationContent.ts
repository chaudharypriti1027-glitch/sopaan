export const AUTH_MOTIVATION_COUNT = 6;

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Stable starting index so the first line isn't always the same per screen. */
export function pickMotivationIndex(seed: string): number {
  return hashSeed(seed) % AUTH_MOTIVATION_COUNT;
}

export function nextMotivationIndex(current: number): number {
  return (current + 1) % AUTH_MOTIVATION_COUNT;
}
