import { observabilityConfig } from '../config/observabilityConfig.js';
import { logger } from './logger.js';
import { captureAlertMessage } from './sentry.js';

const errorTimestamps = [];
const aiCostEvents = [];
const alertCooldowns = new Map();

const ALERT_COOLDOWN_MS = 15 * 60 * 1000;

function pruneTimestamps(cutoffMs) {
  const cutoff = Date.now() - cutoffMs;

  while (errorTimestamps.length > 0 && errorTimestamps[0] < cutoff) {
    errorTimestamps.shift();
  }
}

function pruneAiCostEvents(cutoffMs) {
  const cutoff = Date.now() - cutoffMs;

  while (aiCostEvents.length > 0 && aiCostEvents[0].ts < cutoff) {
    aiCostEvents.shift();
  }
}

export function recordErrorForAlerting() {
  errorTimestamps.push(Date.now());
  pruneTimestamps(observabilityConfig.errorSpikeWindowMs * 2);
}

export function recordAiCostForAlerting(usd) {
  if (!usd || usd <= 0) {
    return;
  }

  aiCostEvents.push({ ts: Date.now(), usd });
  pruneAiCostEvents(observabilityConfig.aiCostSpikeWindowMs * 2);
}

function shouldFireAlert(alertKey) {
  const lastFired = alertCooldowns.get(alertKey);

  if (!lastFired) {
    return true;
  }

  return Date.now() - lastFired >= ALERT_COOLDOWN_MS;
}

async function dispatchAlert(alertKey, payload) {
  if (!shouldFireAlert(alertKey)) {
    return;
  }

  alertCooldowns.set(alertKey, Date.now());

  logger.warn('observability alert fired', payload);
  captureAlertMessage(`Observability alert: ${payload.alertType}`, payload);

  if (!observabilityConfig.alertWebhookUrl) {
    return;
  }

  try {
    await fetch(observabilityConfig.alertWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    logger.error('failed to deliver observability alert webhook', {
      alertType: payload.alertType,
      error: err.message,
    });
  }
}

export async function checkObservabilitySpikes() {
  const now = Date.now();

  const recentErrors = errorTimestamps.filter(
    (ts) => now - ts <= observabilityConfig.errorSpikeWindowMs,
  );

  if (recentErrors.length >= observabilityConfig.errorSpikeThreshold) {
    await dispatchAlert('error_spike', {
      alertType: 'error_spike',
      errorCount: recentErrors.length,
      windowMs: observabilityConfig.errorSpikeWindowMs,
      threshold: observabilityConfig.errorSpikeThreshold,
      release: observabilityConfig.release,
      environment: observabilityConfig.environment,
    });
  }

  const recentAiCostUsd = aiCostEvents
    .filter((event) => now - event.ts <= observabilityConfig.aiCostSpikeWindowMs)
    .reduce((sum, event) => sum + event.usd, 0);

  if (recentAiCostUsd >= observabilityConfig.aiCostSpikeUsd) {
    await dispatchAlert('ai_cost_spike', {
      alertType: 'ai_cost_spike',
      aiCostUsd: Number(recentAiCostUsd.toFixed(4)),
      windowMs: observabilityConfig.aiCostSpikeWindowMs,
      thresholdUsd: observabilityConfig.aiCostSpikeUsd,
      release: observabilityConfig.release,
      environment: observabilityConfig.environment,
    });
  }

  return {
    recentErrorCount: recentErrors.length,
    recentAiCostUsd,
  };
}

export async function alertGlobalAiBudgetExceeded(payload) {
  await dispatchAlert('ai_global_daily_budget', {
    alertType: 'ai_global_daily_budget_exceeded',
    ...payload,
    release: observabilityConfig.release,
    environment: observabilityConfig.environment,
  });
}

export function resetAlertsForTests() {
  errorTimestamps.length = 0;
  aiCostEvents.length = 0;
  alertCooldowns.clear();
}
