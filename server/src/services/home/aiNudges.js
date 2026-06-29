import crypto from 'crypto';
import { Attempt } from '../../models/Attempt.js';
import { Test } from '../../models/Test.js';
import { aiRuntimeConfig } from '../../config/aiRuntimeConfig.js';
import { cacheGet, cacheSet } from '../../lib/cache.js';
import { isRedisReady } from '../../lib/redis.js';
import { logger } from '../../observability/logger.js';
import { client, MODELS, TIERS } from '../ai/claudeClient.js';
import { recordAiUsage } from '../ai/aiUsageService.js';
import { getStreak } from './getStreak.js';
import { getCountdown } from './getCountdown.js';
import { getRank } from './getRank.js';

const NUDGES_CACHE_TTL_SEC = 6 * 60 * 60;
const NUDGES_API_TIMEOUT_MS = 2500;
const MAX_MEMORY_CACHE_ENTRIES = 500;

const VALID_TONES = new Set(['urgent', 'streak', 'info', 'opportunity']);

const SYSTEM_PROMPT =
  'You write 1-3 short motivational study nudges for an Indian govt-exam aspirant. ' +
  'Return ONLY JSON array of {tone,icon,title,body,deeplink}. ' +
  'tone ∈ urgent|streak|info|opportunity. title ≤ 6 words, body ≤ 18 words. ' +
  'Map weak topics → urgent + deeplink /drill/{topicId}; streak at risk → streak; ' +
  'new affairs/test → info|opportunity.';

/** @type {Map<string, { value: unknown, expiresAt: number }>} */
const memoryCache = new Map();

function stableValue(value) {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(stableValue);
  }

  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      acc[key] = stableValue(value[key]);
      return acc;
    }, {});
}

export function hashNudgeState(state) {
  const payload = JSON.stringify(stableValue(state));
  return crypto.createHash('sha1').update(payload).digest('hex');
}

export function topicToSlug(name) {
  return encodeURIComponent(
    String(name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'topic',
  );
}

function countWords(text) {
  return String(text ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function stripJsonFences(text) {
  let cleaned = String(text ?? '').trim();

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  }

  return cleaned.trim();
}

export function parseAndValidateNudges(raw, _state) {
  let parsed = raw;

  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(stripJsonFences(raw));
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  const validated = [];

  for (const [index, item] of parsed.entries()) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const tone = item.tone;
    const icon = typeof item.icon === 'string' ? item.icon.trim() : '';
    const title = typeof item.title === 'string' ? item.title.trim() : '';
    const body = typeof item.body === 'string' ? item.body.trim() : '';
    const deeplink = typeof item.deeplink === 'string' ? item.deeplink.trim() : '';

    if (!VALID_TONES.has(tone) || !icon || !title || !body || !deeplink) {
      continue;
    }

    if (countWords(title) > 6 || countWords(body) > 18) {
      continue;
    }

    const id =
      typeof item.id === 'string' && item.id.trim()
        ? item.id.trim()
        : `nudge-${topicToSlug(title)}-${index}`;

    validated.push({ id, tone, icon, title, body, deeplink });
  }

  return validated.slice(0, 3);
}

export function buildFallbackNudges(state) {
  const nudges = [];

  if (state.streak >= 3 && !state.todayDone) {
    nudges.push({
      id: 'fallback-streak',
      tone: 'streak',
      icon: 'flame',
      title: 'Keep streak alive',
      body: `${state.streak}-day streak — practice today.`,
      deeplink: '/tabs/Practice',
    });
  }

  const weakest = state.weakestTopics?.[0];

  if (weakest?.name) {
    nudges.push({
      id: 'fallback-weak-topic',
      tone: 'urgent',
      icon: 'target',
      title: `Drill ${weakest.name}`,
      body: `${weakest.acc}% accuracy — quick drill now.`,
      deeplink: `/drill/${topicToSlug(weakest.name)}`,
    });
  }

  if (state.daysToExam != null && state.daysToExam <= 30) {
    nudges.push({
      id: 'fallback-exam-countdown',
      tone: 'urgent',
      icon: 'calendar',
      title: 'Exam approaching',
      body: `${state.daysToExam} days left — mock test today.`,
      deeplink: '/stack/ExamCalendar',
    });
  }

  if (state.lastMockPct != null && state.lastMockPct < 60) {
    nudges.push({
      id: 'fallback-mock-score',
      tone: 'opportunity',
      icon: 'trending-up',
      title: 'Boost mock score',
      body: `Last mock ${state.lastMockPct}% — review mistakes.`,
      deeplink: '/tabs/Practice',
    });
  }

  if (nudges.length === 0) {
    nudges.push({
      id: 'fallback-practice',
      tone: 'info',
      icon: 'book-open',
      title: 'Start practicing',
      body: 'One short test keeps momentum going.',
      deeplink: '/tabs/Practice',
    });
  }

  return nudges.slice(0, 3);
}

async function collectWeakestTopics(userId, limit = 3) {
  const attempts = await Attempt.find({ userId })
    .sort({ createdAt: -1 })
    .limit(30)
    .select('accuracy weakTopics testId')
    .lean();

  if (attempts.length === 0) {
    return [];
  }

  const testIds = [...new Set(attempts.map((attempt) => attempt.testId?.toString()).filter(Boolean))];
  const tests = await Test.find({ _id: { $in: testIds } }).select('subject topic').lean();
  const testsById = new Map(tests.map((test) => [test._id.toString(), test]));

  const topicAcc = new Map();

  for (const attempt of attempts) {
    const test = testsById.get(attempt.testId?.toString());
    const topics =
      attempt.weakTopics?.length > 0
        ? attempt.weakTopics
        : [test?.topic, test?.subject].filter(Boolean);

    for (const name of topics) {
      if (!topicAcc.has(name)) {
        topicAcc.set(name, { sum: 0, count: 0 });
      }

      const bucket = topicAcc.get(name);
      bucket.sum += attempt.accuracy ?? 0;
      bucket.count += 1;
    }
  }

  return [...topicAcc.entries()]
    .map(([name, { sum, count }]) => ({
      name,
      acc: count ? Math.round(sum / count) : 0,
    }))
    .sort((left, right) => left.acc - right.acc)
    .slice(0, limit);
}

async function getLastMockPct(userId) {
  const attempts = await Attempt.find({ userId })
    .sort({ createdAt: -1 })
    .limit(15)
    .select('accuracy testId')
    .lean();

  if (attempts.length === 0) {
    return null;
  }

  const testIds = [...new Set(attempts.map((attempt) => attempt.testId?.toString()).filter(Boolean))];
  const tests = await Test.find({ _id: { $in: testIds }, type: 'mock' }).select('_id').lean();
  const mockIds = new Set(tests.map((test) => test._id.toString()));

  for (const attempt of attempts) {
    if (mockIds.has(attempt.testId?.toString())) {
      return attempt.accuracy ?? null;
    }
  }

  return null;
}

export async function buildNudgeState(user, prefetched = {}) {
  const userId = user?._id;

  const [streak, countdown, rank, weakestTopics, lastMockPct] = await Promise.all([
    prefetched.streak ?? getStreak(user),
    prefetched.countdown !== undefined ? prefetched.countdown : getCountdown(user),
    prefetched.rank ?? getRank(user),
    userId ? collectWeakestTopics(userId) : [],
    userId ? getLastMockPct(userId) : null,
  ]);

  return {
    streak: streak?.current ?? 0,
    daysToExam: countdown?.daysLeft ?? null,
    weakestTopics,
    lastMockPct,
    rankDeltaWeek: rank?.deltaWeek ?? 0,
    todayDone: streak?.todayDone ?? false,
  };
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

async function readNudgesCache(cacheKey) {
  if (isRedisReady()) {
    return cacheGet(cacheKey);
  }

  return memoryCacheGet(cacheKey);
}

async function writeNudgesCache(cacheKey, value) {
  if (isRedisReady()) {
    await cacheSet(cacheKey, value, NUDGES_CACHE_TTL_SEC);
    return;
  }

  memoryCacheSet(cacheKey, value, NUDGES_CACHE_TTL_SEC);
}

function extractResponseText(response) {
  const block = response.content?.[0];
  return block?.type === 'text' ? block.text : '';
}

async function generateNudgesFromClaude(state, userId) {
  const startedAt = Date.now();

  const response = await client.messages.create(
    {
      model: MODELS.FAST,
      max_tokens: 400,
      temperature: 0.5,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: JSON.stringify(state) }],
    },
    { signal: AbortSignal.timeout(NUDGES_API_TIMEOUT_MS) },
  );

  const latencyMs = Date.now() - startedAt;

  await recordAiUsage({
    userId,
    tier: TIERS.FAST,
    feature: 'home_ai_nudges',
    model: MODELS.FAST,
    usage: response.usage,
    latencyMs,
  });

  return extractResponseText(response);
}

async function resolveNudgesForState(state, userId) {
  if (aiRuntimeConfig.stubResponses) {
    return { nudges: buildFallbackNudges(state), fromClaude: false };
  }

  try {
    const raw = await generateNudgesFromClaude(state, userId);
    const nudges = parseAndValidateNudges(raw, state);

    if (nudges.length > 0) {
      return { nudges, fromClaude: true };
    }
  } catch (err) {
    logger.warn('[home] getAINudges Claude call failed', {
      message: err?.message ?? String(err),
      userId: userId ? String(userId) : undefined,
    });
  }

  return { nudges: buildFallbackNudges(state), fromClaude: false };
}

/**
 * AI-generated home nudges (Haiku, cached 6h per state hash).
 *
 * @param {object} user - Lean User document
 * @param {object} [prefetched] - Optional { streak, countdown, rank } from home feed
 */
export async function getAINudges(user, prefetched = {}) {
  try {
    if (!user?._id) {
      return buildFallbackNudges({
        streak: 0,
        daysToExam: null,
        weakestTopics: [],
        lastMockPct: null,
        rankDeltaWeek: 0,
        todayDone: false,
      });
    }

    const userId = user._id;
    const state = await buildNudgeState(user, prefetched);
    const stateHash = hashNudgeState(state);
    const cacheKey = `nudges:${userId}:${stateHash}`;

    const cached = await readNudgesCache(cacheKey);

    if (Array.isArray(cached) && cached.length > 0) {
      return cached;
    }

    const { nudges, fromClaude } = await resolveNudgesForState(state, userId);

    if (nudges.length > 0 && fromClaude) {
      await writeNudgesCache(cacheKey, nudges);
    }

    return nudges;
  } catch (err) {
    logger.warn('[home] getAINudges failed', {
      message: err?.message ?? String(err),
      userId: user?._id ? String(user._id) : undefined,
    });

    try {
      const state = await buildNudgeState(user, prefetched);
      return buildFallbackNudges(state);
    } catch {
      return buildFallbackNudges({
        streak: 0,
        daysToExam: null,
        weakestTopics: [],
        lastMockPct: null,
        rankDeltaWeek: 0,
        todayDone: false,
      });
    }
  }
}
