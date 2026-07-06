import { getHealthStatus } from '../services/healthService.js';
import { AppError } from '../utils/AppError.js';
import { observabilityConfig } from '../config/observabilityConfig.js';

export async function getHealth(_req, res) {
  res.set('Cache-Control', 'public, max-age=15, stale-while-revalidate=30');
  res.status(200).json(getHealthStatus());
}

export async function sentryTest(req, _res) {
  const secret = process.env.SENTRY_TEST_SECRET?.trim();

  if (!secret || req.headers['x-sentry-test-secret'] !== secret) {
    throw new AppError('Not found', 404, 'NOT_FOUND');
  }

  const error = new Error(
    `Sopaan API Sentry test error (release: ${observabilityConfig.release})`,
  );
  error.name = 'SentryTestError';
  throw error;
}
