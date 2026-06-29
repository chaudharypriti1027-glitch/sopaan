import { env } from './env.js';

export const securityConfig = Object.freeze({
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY?.trim() || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY?.trim() || '30d',
  minJwtSecretLength: env.isProduction ? 32 : 16,
  maxLoginAttempts: Number(process.env.AUTH_MAX_LOGIN_ATTEMPTS ?? 5),
  lockoutDurationMs: Number(process.env.AUTH_LOCKOUT_MS ?? 15 * 60 * 1000),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX ?? 20),
  authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  otpRateLimitMax: Number(process.env.OTP_RATE_LIMIT_MAX ?? 5),
  otpBurstWindowMs: Number(process.env.OTP_BURST_WINDOW_MS ?? 30_000),
  otpBurstMax: Number(process.env.OTP_BURST_MAX ?? 1),
  otpHourlyWindowMs: Number(process.env.OTP_HOURLY_WINDOW_MS ?? 60 * 60 * 1000),
  otpHourlyMax: Number(process.env.OTP_HOURLY_MAX ?? 5),
  trustProxy: process.env.TRUST_PROXY === 'true' || env.isProduction,
  forceHttps: env.isProduction && process.env.FORCE_HTTPS !== 'false',
  jsonBodyLimit: process.env.JSON_BODY_LIMIT?.trim() || '100kb',
});
