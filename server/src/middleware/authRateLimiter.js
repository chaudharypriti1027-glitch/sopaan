import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { env } from '../config/env.js';
import { securityConfig } from '../config/securityConfig.js';
import { isRedisReady, getRedisClient } from '../lib/redis.js';
import { normalizeIndianPhone } from '../utils/phone.js';

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

function otpDestinationKey(req) {
  const email = req.body?.email?.trim().toLowerCase();
  if (email) {
    return `email:${email}`;
  }

  try {
    return `phone:${normalizeIndianPhone(req.body?.phone ?? '')}`;
  } catch {
    return req.ip ?? 'anonymous';
  }
}

const otpLimitMessage = {
  error: {
    message: 'Too many OTP requests. Please wait before trying again.',
    code: 'OTP_RATE_LIMIT_EXCEEDED',
  },
};

export const authRateLimiter = env.isTest
  ? noopLimiter
  : rateLimit({
      windowMs: securityConfig.authRateLimitWindowMs,
      max: securityConfig.authRateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
      store: buildStore('auth'),
      message: {
        error: {
          message: 'Too many authentication attempts. Please try again later.',
          code: 'AUTH_RATE_LIMIT_EXCEEDED',
        },
      },
    });

/** @deprecated use otpBurstLimiter + otpHourlyLimiter */
export const otpRateLimiter = env.isTest
  ? noopLimiter
  : rateLimit({
      windowMs: securityConfig.authRateLimitWindowMs,
      max: securityConfig.otpRateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
      store: buildStore('otp'),
      keyGenerator: otpDestinationKey,
      message: otpLimitMessage,
    });

/** 1 OTP request per phone per 30 seconds. */
export const otpBurstLimiter = env.isTest
  ? noopLimiter
  : rateLimit({
      windowMs: securityConfig.otpBurstWindowMs,
      max: securityConfig.otpBurstMax,
      standardHeaders: true,
      legacyHeaders: false,
      store: buildStore('otp-burst'),
      keyGenerator: otpDestinationKey,
      message: otpLimitMessage,
    });

/** 5 OTP requests per phone per hour. */
export const otpHourlyLimiter = env.isTest
  ? noopLimiter
  : rateLimit({
      windowMs: securityConfig.otpHourlyWindowMs,
      max: securityConfig.otpHourlyMax,
      standardHeaders: true,
      legacyHeaders: false,
      store: buildStore('otp-hourly'),
      keyGenerator: otpDestinationKey,
      message: otpLimitMessage,
    });
