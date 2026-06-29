import { Reward } from '../models/Reward.js';
import { Badge } from '../models/Badge.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { buildPaginatedResult, parsePagination } from '../utils/pagination.js';
import { createNotification } from './notificationService.js';

export async function listRewards(query) {
  const { limit, offset } = parsePagination(query);

  const [items, total] = await Promise.all([
    Reward.find({}).sort({ coinCost: 1 }).skip(offset).limit(limit).lean(),
    Reward.countDocuments({}),
  ]);

  return buildPaginatedResult({ items, total, limit, offset });
}

export async function redeemReward(userId, rewardId) {
  const [user, reward] = await Promise.all([
    User.findById(userId),
    Reward.findById(rewardId),
  ]);

  if (!reward) {
    throw new AppError('Reward not found', 404, 'NOT_FOUND');
  }

  if (user.coins < reward.coinCost) {
    throw new AppError('Insufficient coins', 400, 'INSUFFICIENT_COINS');
  }

  user.coins -= reward.coinCost;
  await user.save();

  await createNotification(userId, {
    type: 'reward',
    title: `Redeemed: ${reward.title}`,
    body: `${reward.coinCost} coins spent on ${reward.type} reward.`,
  });

  return {
    reward,
    coinsRemaining: user.coins,
  };
}

export async function listBadges(userId, query = {}) {
  const { limit, offset } = parsePagination(query, { defaultLimit: 20, maxLimit: 100 });

  const [items, total] = await Promise.all([
    Badge.find({ userId }).sort({ earnedAt: -1 }).skip(offset).limit(limit).lean(),
    Badge.countDocuments({ userId }),
  ]);

  return buildPaginatedResult({ items, total, limit, offset });
}
