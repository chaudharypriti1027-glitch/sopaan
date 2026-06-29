import { RankSnapshot } from '../../models/RankSnapshot.js';
import { clamp } from '../../utils/date.js';
import { safeHomeCall } from './safe.js';

const RANK_FALLBACK = {
  air: null,
  percentile: null,
  deltaWeek: 0,
  ringPct: 0,
};

export function buildRankFromSnapshot(snapshot) {
  if (!snapshot) {
    return RANK_FALLBACK;
  }

  const air = snapshot.air ?? null;
  const percentile = snapshot.percentile ?? null;
  const weekAir = snapshot.weekAir ?? null;
  const deltaWeek =
    air != null && weekAir != null ? weekAir - air : 0;
  const ringPct = percentile != null ? clamp(Math.round(percentile), 0, 100) : 0;

  return { air, percentile, deltaWeek, ringPct };
}

export async function getRank(user) {
  return safeHomeCall('getRank', async () => {
    if (!user?._id) {
      return RANK_FALLBACK;
    }

    const snapshot = await RankSnapshot.findOne({ user: user._id })
      .sort({ takenAt: -1 })
      .lean();

    return buildRankFromSnapshot(snapshot);
  }, RANK_FALLBACK);
}
