import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { env } from '../config/env.js';
import { isRedisReady, getRedisClient } from '../lib/redis.js';

const noopLimiter = (_req, _res, next) => next();

function buildStore(prefix) {
  if (!isRedisReady()) {
    return undefined;
  }

  return new RedisStore({
    prefix: `rl:${prefix}:`,
    sendCommand: (...args) => getRedisClient().call(...args),
  });
}

function createLimiter({ prefix, windowMs, max, message }) {
  if (env.isTest) {
    return noopLimiter;
  }

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store: buildStore(prefix),
    message: {
      error: message,
    },
  });
}

export const apiRateLimiter = createLimiter({
  prefix: 'api',
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_MAX ?? 100),
  message: {
    message: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});
