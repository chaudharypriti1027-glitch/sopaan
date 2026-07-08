import { Attempt } from '../models/Attempt.js';
import { User } from '../models/User.js';
import { buildPaginatedResult, parsePagination } from '../utils/pagination.js';
import { CACHE_TTLS } from '../config/cacheConfig.js';
import { cacheGetOrSet, stableCacheKey } from '../lib/cache.js';
import { subtractDays } from '../utils/testHelpers.js';

const PERIODS = new Set(['daily', 'weekly', 'all-time']);

export function normalizeLeaderboardPeriod(raw) {
  const period = raw?.trim() || 'all-time';
  return PERIODS.has(period) ? period : 'all-time';
}

function getPeriodStart(period) {
  if (period === 'daily') {
    return subtractDays(new Date(), 1);
  }
  if (period === 'weekly') {
    return subtractDays(new Date(), 7);
  }
  return null;
}

function buildPeriodMatch(period) {
  const start = getPeriodStart(period);
  if (!start) {
    return {};
  }
  return { createdAt: { $gte: start } };
}

function getSeasonMeta() {
  const now = new Date();
  const seasonNumber = Math.ceil((now.getMonth() + 1) / 3);
  const day = now.getDay();
  const daysUntilSunday = day === 0 ? 7 : 7 - day;
  const ends = new Date(now);
  ends.setDate(ends.getDate() + daysUntilSunday);
  ends.setHours(23, 59, 59, 999);

  return {
    label: `SEASON ${seasonNumber} · MOCK MASTERS`,
    endsAt: ends.toISOString(),
  };
}

function computeRankDelta(ranks, accuracies, attempts) {
  if (attempts < 2) {
    return null;
  }

  const latestRank = ranks?.[0];
  const previousRank = ranks?.[1];
  if (latestRank != null && previousRank != null) {
    const movement = previousRank - latestRank;
    if (movement === 0) {
      return 0;
    }
    return movement;
  }

  const latestAccuracy = Math.round(accuracies?.[0] ?? 0);
  const previousAccuracy = accuracies?.[1] != null ? Math.round(accuracies[1]) : null;
  if (previousAccuracy == null) {
    return null;
  }
  if (latestAccuracy > previousAccuracy) {
    return 1;
  }
  if (latestAccuracy < previousAccuracy) {
    return -1;
  }
  return 0;
}

function mapEntry(entry, rank) {
  const accuracies = entry.accuracies ?? [];
  const ranks = entry.ranks ?? [];
  const latestAccuracy = Math.round(accuracies[0] ?? entry.latestAccuracy ?? 0);

  return {
    rank,
    userId: entry._id,
    name: entry.name ?? 'Student',
    avgAccuracy: Math.round(entry.avgAccuracy ?? 0),
    bestRank: entry.bestRank,
    attempts: entry.attempts,
    latestAccuracy,
    rankDelta: computeRankDelta(ranks, accuracies, entry.attempts),
  };
}

async function attachNames(rawEntries, offset) {
  const userIds = rawEntries.map((entry) => entry._id);
  const users = await User.find({ _id: { $in: userIds } }).select('name').lean();
  const namesById = new Map(users.map((user) => [user._id.toString(), user.name]));

  return rawEntries.map((entry, index) =>
    mapEntry(
      {
        ...entry,
        name: namesById.get(entry._id.toString()) ?? 'Student',
      },
      offset + index + 1,
    ),
  );
}

async function aggregateStandings({ periodMatch, limit, offset }) {
  const ranked = await Attempt.aggregate([
    { $match: { accuracy: { $ne: null }, ...periodMatch } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$userId',
        avgAccuracy: { $avg: '$accuracy' },
        bestRank: { $min: '$rank' },
        attempts: { $sum: 1 },
        latestAccuracy: { $first: '$accuracy' },
        accuracies: { $push: '$accuracy' },
        ranks: { $push: '$rank' },
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
  const entries = await attachNames(pageItems, offset);

  return buildPaginatedResult({
    items: entries,
    total,
    limit,
    offset,
  });
}

async function buildLeaderboardMeta(periodMatch) {
  const [totalAgg, onlineUsers] = await Promise.all([
    Attempt.aggregate([
      { $match: { accuracy: { $ne: null }, ...periodMatch } },
      { $group: { _id: '$userId' } },
      { $count: 'count' },
    ]),
    Attempt.distinct('userId', {
      accuracy: { $ne: null },
      createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) },
    }),
  ]);

  return {
    totalPlayers: totalAgg[0]?.count ?? 0,
    onlineNow: onlineUsers.length,
    season: getSeasonMeta(),
  };
}

async function buildLeaderboardPage({ limit, offset, period }) {
  const periodMatch = buildPeriodMatch(period);
  return aggregateStandings({ periodMatch, limit, offset });
}

export async function buildUserStanding(userId, period = 'all-time') {
  const periodMatch = buildPeriodMatch(normalizeLeaderboardPeriod(period));

  const [stats] = await Attempt.aggregate([
    { $match: { userId, accuracy: { $ne: null }, ...periodMatch } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$userId',
        avgAccuracy: { $avg: '$accuracy' },
        bestRank: { $min: '$rank' },
        attempts: { $sum: 1 },
        latestAccuracy: { $first: '$accuracy' },
        accuracies: { $push: '$accuracy' },
        ranks: { $push: '$rank' },
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
      rankDelta: null,
    };
  }

  const betterCount = await Attempt.aggregate([
    { $match: { accuracy: { $ne: null }, ...periodMatch } },
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
          {
            avgAccuracy: stats.avgAccuracy,
            bestRank: { $lt: stats.bestRank ?? Number.MAX_SAFE_INTEGER },
          },
        ],
      },
    },
    { $count: 'count' },
  ]);

  const accuracies = stats.accuracies ?? [];
  const ranks = stats.ranks ?? [];
  const latestAccuracy = Math.round(accuracies[0] ?? stats.latestAccuracy ?? 0);

  return {
    rank: (betterCount[0]?.count ?? 0) + 1,
    userId,
    name: user?.name ?? 'You',
    avgAccuracy: Math.round(stats.avgAccuracy ?? 0),
    bestRank: stats.bestRank,
    attempts: stats.attempts,
    latestAccuracy,
    rankDelta: computeRankDelta(ranks, accuracies, stats.attempts),
  };
}

export async function getLeaderboard(userId, query) {
  const period = normalizeLeaderboardPeriod(query.period);
  const { limit, offset } = parsePagination(query, { defaultLimit: 20, maxLimit: 50 });
  const periodMatch = buildPeriodMatch(period);
  const cacheKey = stableCacheKey('cache:leaderboard', { limit, offset, period });

  const youCacheKey = stableCacheKey('cache:user-standing', { userId, period });

  const [page, you, meta] = await Promise.all([
    cacheGetOrSet(cacheKey, CACHE_TTLS.leaderboardSec, () =>
      buildLeaderboardPage({ limit, offset, period }),
    ),
    cacheGetOrSet(youCacheKey, CACHE_TTLS.userStandingSec, () =>
      buildUserStanding(userId, period),
    ),
    cacheGetOrSet(stableCacheKey('cache:leaderboard:meta', { period }), 30, () =>
      buildLeaderboardMeta(periodMatch),
    ),
  ]);

  return {
    ...page,
    you,
    meta,
    period,
    updatedAt: new Date().toISOString(),
  };
}
