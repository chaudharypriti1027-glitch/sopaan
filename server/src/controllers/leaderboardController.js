import * as leaderboardService from '../services/leaderboardService.js';

export async function getLeaderboard(req, res) {
  const result = await leaderboardService.getLeaderboard(req.user._id, req.query);
  res.status(200).json(result);
}
