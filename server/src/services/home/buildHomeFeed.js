import { cacheDel, cacheGet, cacheSet } from '../../lib/cache.js';
import { CACHE_HEADERS } from '../../config/cacheConfig.js';
import { isRedisReady } from '../../lib/redis.js';
import { logger } from '../../observability/logger.js';
import { formatIstDateLabel } from '../../utils/date.js';
import { getAINudges, buildFallbackNudges } from './aiNudges.js';
import { getContinue } from './getContinue.js';
import { getCountdown } from './getCountdown.js';
import { getCurrentAffairs } from './getCurrentAffairs.js';
import { getDailyChallenge } from './getDailyChallenge.js';
import { getGreeting } from './getGreeting.js';
import { getLeague } from './getLeague.js';
import { getQuickActions } from './getQuickActions.js';
import { getRank } from './getRank.js';
import { getRecommendedTests } from './getRecommendedTests.js';
import { getStreak } from './getStreak.js';

export const HOME_FEED_CACHE_TTL_SEC = CACHE_HEADERS.homeFeedServerSec;
const MAX_MEMORY_CACHE_ENTRIES = 200;

/** @type {Map<string, { value: unknown, expiresAt: number }>} */
const memoryCache = new Map();

const AI_NUDGES_REJECTED_FALLBACK = buildFallbackNudges({
  streak: 0,
  daysToExam: null,
  weakestTopics: [],
  lastMockPct: null,
  rankDeltaWeek: 0,
  todayDone: false,
});

export const HOME_SECTION_DEFAULTS = Object.freeze({
  greeting: {
    name: '',
    message: 'Hello',
    dateLabel: formatIstDateLabel(),
    unreadCount: 0,
  },
  streak: { current: 0, best: 0, freezes: 0, todayDone: false },
  rank: { air: null, percentile: null, deltaWeek: 0, ringPct: 0 },
  countdown: null,
  continue: [],
  aiNudges: AI_NUDGES_REJECTED_FALLBACK,
  dailyChallenge: null,
  quickActions: [],
  recommendedTests: [],
  currentAffairs: [],
  league: null,
});

function homeFeedCacheKey(userId) {
  return `home:${userId}`;
}

function toLeanUser(user) {
  if (!user) {
    return null;
  }

  return typeof user.toObject === 'function' ? user.toObject() : user;
}

function settledValue(result, fallback, section) {
  if (result.status === 'fulfilled') {
    return result.value ?? fallback;
  }

  logger.warn('[home] section rejected', {
    section,
    message: result.reason?.message ?? String(result.reason),
  });

  return fallback;
}

function memoryCacheGet(key) {
  const entry = memoryCache.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }

  return entry.value;
}

function memoryCacheSet(key, value, ttlSec) {
  if (memoryCache.size >= MAX_MEMORY_CACHE_ENTRIES) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) {
      memoryCache.delete(oldestKey);
    }
  }

  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSec * 1000,
  });
}

function memoryCacheDel(key) {
  memoryCache.delete(key);
}

async function readHomeFeedCache(userId) {
  const key = homeFeedCacheKey(userId);

  if (isRedisReady()) {
    return cacheGet(key);
  }

  return memoryCacheGet(key);
}

async function writeHomeFeedCache(userId, feed) {
  const key = homeFeedCacheKey(userId);

  if (isRedisReady()) {
    await cacheSet(key, feed, HOME_FEED_CACHE_TTL_SEC);
    return;
  }

  memoryCacheSet(key, feed, HOME_FEED_CACHE_TTL_SEC);
}

export async function bustHomeFeedCache(userId) {
  const key = homeFeedCacheKey(String(userId));
  memoryCacheDel(key);

  if (isRedisReady()) {
    await cacheDel(key);
  }
}

async function assembleHomeFeed(user) {
  const startedAt = Date.now();

  const [
    greetingResult,
    streakResult,
    rankResult,
    countdownResult,
    continueResult,
    dailyChallengeResult,
    quickActionsResult,
    recommendedTestsResult,
    currentAffairsResult,
    leagueResult,
  ] = await Promise.allSettled([
    getGreeting(user),
    getStreak(user),
    getRank(user),
    getCountdown(user),
    getContinue(user),
    getDailyChallenge(user),
    getQuickActions(user),
    getRecommendedTests(user),
    getCurrentAffairs(),
    getLeague(user),
  ]);

  const greeting = settledValue(greetingResult, HOME_SECTION_DEFAULTS.greeting, 'greeting');
  const streak = settledValue(streakResult, HOME_SECTION_DEFAULTS.streak, 'streak');
  const rank = settledValue(rankResult, HOME_SECTION_DEFAULTS.rank, 'rank');
  const countdown = settledValue(countdownResult, HOME_SECTION_DEFAULTS.countdown, 'countdown');
  const continueItems = settledValue(continueResult, HOME_SECTION_DEFAULTS.continue, 'continue');
  const dailyChallenge = settledValue(
    dailyChallengeResult,
    HOME_SECTION_DEFAULTS.dailyChallenge,
    'dailyChallenge',
  );
  const quickActions = settledValue(
    quickActionsResult,
    HOME_SECTION_DEFAULTS.quickActions,
    'quickActions',
  );
  const recommendedTests = settledValue(
    recommendedTestsResult,
    HOME_SECTION_DEFAULTS.recommendedTests,
    'recommendedTests',
  );
  const currentAffairs = settledValue(
    currentAffairsResult,
    HOME_SECTION_DEFAULTS.currentAffairs,
    'currentAffairs',
  );
  const league = settledValue(leagueResult, HOME_SECTION_DEFAULTS.league, 'league');

  const [aiNudgesResult] = await Promise.allSettled([
    getAINudges(user, { streak, countdown, rank }),
  ]);

  const aiNudges = settledValue(
    aiNudgesResult,
    HOME_SECTION_DEFAULTS.aiNudges,
    'aiNudges',
  );

  const elapsedMs = Date.now() - startedAt;

  if (elapsedMs > 150) {
    logger.info('[home] feed assemble slow', {
      userId: user._id ? String(user._id) : undefined,
      elapsedMs,
    });
  }

  return {
    greeting,
    streak,
    rank,
    countdown,
    continue: continueItems,
    aiNudges,
    dailyChallenge,
    quickActions,
    recommendedTests,
    currentAffairs,
    league,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Build the full home feed for a user (60s per-user cache; AI nudges cached separately for 6h).
 *
 * @param {object} user - User document or lean object
 * @param {{ skipCache?: boolean }} [options]
 */
export async function buildHomeFeed(user, { skipCache = false } = {}) {
  const leanUser = toLeanUser(user);

  if (!leanUser?._id) {
    throw new Error('User not found');
  }

  const userId = String(leanUser._id);

  if (!skipCache) {
    const cached = await readHomeFeedCache(userId);

    if (cached && typeof cached === 'object') {
      return cached;
    }
  }

  const feed = await assembleHomeFeed(leanUser);
  await writeHomeFeedCache(userId, feed);
  return feed;
}
