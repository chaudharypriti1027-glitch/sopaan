import * as analyticsService from '../services/analyticsService.js';

export async function getProgress(req, res) {
  const result = await analyticsService.getProgressAnalytics(
    req.user._id,
    req.query.range,
    req.query.weekKey,
  );
  res.status(200).json(result);
}
