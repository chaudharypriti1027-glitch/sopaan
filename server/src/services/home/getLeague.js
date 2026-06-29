import { buildUserStanding } from '../leaderboardService.js';
import { safeHomeCall } from './safe.js';

export async function getLeague(user) {
  return safeHomeCall('getLeague', async () => {
    if (!user?._id) {
      return null;
    }

    let rankInLeague = 0;

    try {
      const standing = await buildUserStanding(user._id);
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
