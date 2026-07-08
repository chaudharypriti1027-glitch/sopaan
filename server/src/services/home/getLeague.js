import { buildUserStanding } from '../leaderboardService.js';
import { CACHE_TTLS } from '../../config/cacheConfig.js';
import { cacheGetOrSet, stableCacheKey } from '../../lib/cache.js';
import { safeHomeCall } from './safe.js';

export async function getLeague(user) {
  return safeHomeCall('getLeague', async () => {
    if (!user?._id) {
      return null;
    }

    let rankInLeague = 0;

    try {
      const cacheKey = stableCacheKey('cache:user-standing', {
        userId: user._id.toString(),
        period: 'all-time',
      });
      const standing = await cacheGetOrSet(cacheKey, CACHE_TTLS.userStandingSec, () =>
        buildUserStanding(user._id),
      );
      rankInLeague = standing.rank ?? 0;
    } catch {
      rankInLeague = 0;
    }

    return {
      tier: user.leagueTier ?? 'Bronze',
      rankInLeague,
      xpThisWeek: user.weeklyXp ?? 0,
    };
  }, null);
}
