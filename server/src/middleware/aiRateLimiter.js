import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { env } from '../config/env.js';
import { isRedisReady, getRedisClient } from '../lib/redis.js';

const noopLimiter = (_req, _res, next) => next();

export const aiRateLimiter = env.isTest
  ? noopLimiter
  : rateLimit({
      windowMs: 60 * 1000,
      max: env.aiRequestsPerMinute,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => req.user?._id?.toString() ?? req.ip ?? 'anonymous',
      store: isRedisReady()
        ? new RedisStore({
            prefix: 'rl:ai:',
            sendCommand: (...args) => getRedisClient().call(...args),
          })
        : undefined,
      message: {
        error: {
          message: 'Too many AI requests. Please wait a moment and try again.',
          code: 'AI_RATE_LIMIT_EXCEEDED',
        },
      },
    });
