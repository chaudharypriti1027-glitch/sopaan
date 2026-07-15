import { describe, expect, it } from '@jest/globals';
import { validateEnvironment } from '../src/config/validateEnv.js';

const PRODUCTION_BASE = {
  NODE_ENV: 'production',
  DEPLOY_ENV: 'production',
  PORT: '4000',
  MONGODB_URI: 'mongodb+srv://user:pass@cluster/sopaan',
  JWT_SECRET: 'production-jwt-secret-min-32-characters',
  JWT_REFRESH_SECRET: 'production-refresh-secret-min-32-chars',
  CLIENT_URL: 'https://api.sopaan.app',
  ANTHROPIC_API_KEY: 'sk-ant-test',
  RAZORPAY_KEY_ID: 'rzp_live_test',
  RAZORPAY_KEY_SECRET: 'razorpay_secret',
  RAZORPAY_WEBHOOK_SECRET: 'webhook_secret',
  NEWSAPI_AI_KEY: 'newsapi-key',
  SENTRY_DSN: 'https://key@o0.ingest.sentry.io/1',
};

describe('validateEnvironment', () => {
  it('allows production without ANTHROPIC_API_KEY so AI routes can return AI_UNAVAILABLE', () => {
    const result = validateEnvironment({
      ...PRODUCTION_BASE,
      ANTHROPIC_API_KEY: '',
    });

    expect(result.anthropicApiKey).toBe('');
  });

  it('allows production without Razorpay (checkout returns PAYMENTS_NOT_CONFIGURED)', () => {
    const result = validateEnvironment({
      ...PRODUCTION_BASE,
      RAZORPAY_KEY_ID: '',
      RAZORPAY_KEY_SECRET: '',
      RAZORPAY_WEBHOOK_SECRET: '',
    });

    expect(result.isProduction).toBe(true);
    expect(result.razorpayKeyId).toBeFalsy();
  });

  it('throws when production has partial Razorpay keys', () => {
    expect(() =>
      validateEnvironment({
        ...PRODUCTION_BASE,
        RAZORPAY_KEY_SECRET: '',
      })
    ).toThrow(/RAZORPAY_KEY_SECRET/);
  });

  it('allows production without NEWSAPI_AI_KEY so news routes can return a structured 503', () => {
    const result = validateEnvironment({
      ...PRODUCTION_BASE,
      NEWSAPI_AI_KEY: '',
    });

    expect(result.newsApiAiKey).toBe('');
  });

  it('throws when production is missing SENTRY_DSN', () => {
    expect(() =>
      validateEnvironment({
        ...PRODUCTION_BASE,
        SENTRY_DSN: '',
      })
    ).toThrow(/SENTRY_DSN/);
  });

  it('throws when DEV_STUB_AI is set in production', () => {
    expect(() =>
      validateEnvironment({
        ...PRODUCTION_BASE,
        DEV_STUB_AI: 'true',
      })
    ).toThrow(/DEV_STUB_AI cannot be enabled/);
  });

  it('allows development with DEV_STUB_AI and no Anthropic key', () => {
    const result = validateEnvironment({
      NODE_ENV: 'development',
      PORT: '4000',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/sopaan',
      JWT_SECRET: 'dev-jwt-secret-min-32-characters-long',
      JWT_REFRESH_SECRET: 'dev-refresh-secret-min-32-chars',
      CLIENT_URL: 'http://localhost:8081',
      DEV_STUB_AI: 'true',
    });

    expect(result.stubAiMode).toBe(true);
    expect(result.anthropicApiKey).toBe('dev-stub-key');
  });

  it('accepts complete production configuration', () => {
    const result = validateEnvironment(PRODUCTION_BASE);
    expect(result.isProduction).toBe(true);
    expect(result.stubAiMode).toBe(false);
    expect(result.anthropicApiKey).toBe('sk-ant-test');
  });

  it('derives LIVEKIT_HTTP_URL from LIVEKIT_URL when omitted', () => {
    const result = validateEnvironment({
      NODE_ENV: 'development',
      PORT: '4000',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/sopaan',
      JWT_SECRET: 'dev-jwt-secret-min-32-characters-long',
      JWT_REFRESH_SECRET: 'dev-refresh-secret-min-32-chars',
      CLIENT_URL: 'http://localhost:8081',
      DEV_STUB_AI: 'true',
      LIVEKIT_URL: 'wss://sopaan-qxyfh89u.livekit.cloud',
    });

    expect(result.livekitHttpUrl).toBe('https://sopaan-qxyfh89u.livekit.cloud');
  });

  it('requires S3 vars when egress is enabled in production', () => {
    expect(() =>
      validateEnvironment({
        ...PRODUCTION_BASE,
        LIVEKIT_EGRESS_ENABLED: 'true',
      })
    ).toThrow(/S3_BUCKET/);
  });
});
