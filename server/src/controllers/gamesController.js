import { recordActivity, ACTIVITY_KINDS } from '../services/activity.js';
import { getMe } from '../services/meService.js';

export async function completeGame(req, res) {
  const { gameId, score } = req.body;

  const activity = await recordActivity(req.user, ACTIVITY_KINDS.GAME_COMPLETE, {
    gameId,
    score: score ?? 0,
  });

  const profile = await getMe(req.user._id);

  res.status(200).json({
    coinsAwarded: activity?.rewards?.coins ?? 0,
    xpAwarded: activity?.rewards?.xp ?? 0,
    streak: activity?.streak,
    profile,
  });
}
