import { logger } from '../../observability/logger.js';

export async function safeHomeCall(label, fn, fallback) {
  try {
    return await fn();
  } catch (err) {
    logger.warn(`[home] ${label} failed`, { message: err?.message ?? String(err) });
    return fallback;
  }
}
