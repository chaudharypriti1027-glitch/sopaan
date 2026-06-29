import { Attempt } from '../models/Attempt.js';
import { User } from '../models/User.js';
import { buildPaginatedResult, parsePagination } from '../utils/pagination.js';
import { CACHE_TTLS } from '../config/cacheConfig.js';
import { cacheGetOrSet, stableCacheKey } from '../lib/cache.js';

async function buildLeaderboardPage({ limit, offset }) {
  const ranked = await Attempt.aggregate([
    { $match: { accuracy: { $ne: null } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$userId',
        avgAccuracy: { $avg: '$accuracy' },
        bestRank: { $min: '$rank' },
        attempts: { $sum: 1 },
        latestAccuracy: { $first: '$accuracy' },
      },
    },
    { $sort: { avgAccuracy: -1, bestRank: 1 } },
    {
      $facet: {
        items: [{ $skip: offset }, { $limit: limit }],
        total: [{ $count: 'count' }],
      },
    },
  ]);

  const pageItems = ranked[0]?.items ?? [];
  const total = ranked[0]?.total?.[0]?.count ?? 0;
  const userIds = pageItems.map((entry) => entry._id);
  const users = await User.find({ _id: { $in: userIds } }).select('name').lean();
  const namesById = new Map(users.map((user) => [user._id.toString(), user.name]));

  const entries = pageItems.map((entry, index) => ({
    rank: offset + index + 1,
    userId: entry._id,
    name: namesById.get(entry._id.toString()) ?? 'Student',
    avgAccuracy: Math.round(entry.avgAccuracy ?? 0),
    bestRank: entry.bestRank,
    attempts: entry.attempts,
    latestAccuracy: Math.round(entry.latestAccuracy ?? 0),
  }));

  return buildPaginatedResult({
    items: entries,
    total,
    limit,
    offset,
  });
}

export async function buildUserStanding(userId) {
  const [stats] = await Attempt.aggregate([
    { $match: { userId, accuracy: { $ne: null } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$userId',
        avgAccuracy: { $avg: '$accuracy' },
        bestRank: { $min: '$rank' },
        attempts: { $sum: 1 },
        latestAccuracy: { $first: '$accuracy' },
      },
    },
  ]);

  const user = await User.findById(userId).select('name').lean();

  if (!stats) {
    return {
      rank: null,
      userId,
      name: user?.name ?? 'You',
      avgAccuracy: 0,
      bestRank: null,
      attempts: 0,
      latestAccuracy: 0,
    };
  }

  const betterCount = await Attempt.aggregate([
    { $match: { accuracy: { $ne: null } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$userId',
        avgAccuracy: { $avg: '$accuracy' },
        bestRank: { $min: '$rank' },
      },
    },
    {
      $match: {
        $or: [
          { avgAccuracy: { $gt: stats.avgAccuracy } },
          { avgAccuracy: stats.avgAccuracy, bestRank: { $lt: stats.bestRank ?? Number.MAX_SAFE_INTEGER } },
        ],
      },
    },
    { $count: 'count' },
  ]);

  return {
    rank: (betterCount[0]?.count ?? 0) + 1,
    userId,
    name: user?.name ?? 'You',
    avgAccuracy: Math.round(stats.avgAccuracy ?? 0),
    bestRank: stats.bestRank,
    attempts: stats.attempts,
    latestAccuracy: Math.round(stats.latestAccuracy ?? 0),
  };
}

export async function getLeaderboard(userId, query) {
  const { limit, offset } = parsePagination(query, { defaultLimit: 20, maxLimit: 50 });
  const cacheKey = stableCacheKey('cache:leaderboard', { limit, offset });

  const page = await cacheGetOrSet(cacheKey, CACHE_TTLS.leaderboardSec, () =>
    buildLeaderboardPage({ limit, offset }),
  );

  const you = await buildUserStanding(userId);

  return {
    ...page,
    you,
    updatedAt: new Date().toISOString(),
  };
}
