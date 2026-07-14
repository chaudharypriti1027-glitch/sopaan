const MOTIVATION_COUNT = 6;
const TIP_COUNT = 8;

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function pickMotivationIndex(seed: string): number {
  return hashSeed(seed) % MOTIVATION_COUNT;
}

export function pickTipIndices(seed: string, count = 4): number[] {
  const indices: number[] = [];
  let cursor = hashSeed(`${seed}:tips`);

  for (let i = 0; i < TIP_COUNT && indices.length < count; i += 1) {
    const next = cursor % TIP_COUNT;
    cursor = (cursor * 17 + 13) >>> 0;
    if (!indices.includes(next)) {
      indices.push(next);
    }
  }

  while (indices.length < count) {
    indices.push(indices.length % TIP_COUNT);
  }

  return indices;
}

export const TEST_READY_MOTIVATION_COUNT = MOTIVATION_COUNT;
export const TEST_READY_TIP_COUNT = TIP_COUNT;
