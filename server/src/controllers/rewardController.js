import * as rewardService from '../services/rewardService.js';

export async function listRewards(req, res) {
  const result = await rewardService.listRewards(req.query);
  res.status(200).json(result);
}

export async function redeemReward(req, res) {
  const result = await rewardService.redeemReward(req.user._id, req.params.id);
  res.status(200).json(result);
}

export async function listBadges(req, res) {
  const result = await rewardService.listBadges(req.user._id, req.query);
  res.status(200).json(result);
}
