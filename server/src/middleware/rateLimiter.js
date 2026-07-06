import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { env } from '../config/env.js';
import { isRedisReady, getRedisClient } from '../lib/redis.js';

const noopLimiter = (_req, _res, next) => next();

const API_RATE_LIMIT_MAX = env.isDevelopment
  ? Number(process.env.API_RATE_LIMIT_MAX ?? 5000)
  : Number(process.env.API_RATE_LIMIT_MAX ?? 300);

function buildStore(prefix) {
  if (!isRedisReady()) {
    return undefined;
  }

  return new RedisStore({
    prefix: `rl:${prefix}:`,
    sendCommand: (...args) => getRedisClient().call(...args),
  });
}

function createLimiter({ prefix, windowMs, max, message, skip }) {
  if (env.isTest || env.isDevelopment) {
    return noopLimiter;
  }

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store: buildStore(prefix),
    skip,
    message: {
      error: message,
    },
  });
}

const LIGHTWEIGHT_API_PATHS = new Set(['/health', '/app/version-requirements']);

function skipLightweightApiPaths(req) {
  return LIGHTWEIGHT_API_PATHS.has(req.path);
}

export const apiRateLimiter = createLimiter({
  prefix: 'api',
  windowMs: 15 * 60 * 1000,
  max: API_RATE_LIMIT_MAX,
  skip: skipLightweightApiPaths,
  message: {
    message: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

export const bookExplainRateLimiter = createLimiter({
  prefix: 'book-explain',
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.BOOK_EXPLAIN_RATE_LIMIT_MAX ?? 20),
  keyGenerator: (req) => req.user?._id?.toString() ?? req.ip,
  message: {
    message: 'Explain limit reached — try again in an hour',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});
