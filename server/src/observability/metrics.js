import { observabilityConfig } from '../config/observabilityConfig.js';

const counters = new Map();
const histograms = new Map();
const gauges = new Map();

function labelKey(labels = {}) {
  const entries = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
  return entries.map(([k, v]) => `${k}="${String(v).replace(/"/g, '\\"')}"`).join(',');
}

function metricKey(name, labels) {
  return `${name}{${labelKey(labels)}}`;
}

export function incrementCounter(name, labels = {}, value = 1) {
  const key = metricKey(name, labels);
  counters.set(key, (counters.get(key) ?? 0) + value);
}

export function observeHistogram(name, labels, valueMs) {
  const key = metricKey(name, labels);
  const bucket = histograms.get(key) ?? { count: 0, sumMs: 0, maxMs: 0 };
  bucket.count += 1;
  bucket.sumMs += valueMs;
  bucket.maxMs = Math.max(bucket.maxMs, valueMs);
  histograms.set(key, bucket);
}

export function setGauge(name, labels, value) {
  gauges.set(metricKey(name, labels), value);
}

export function recordHttpRequest({ method, route, statusCode, durationMs }) {
  const statusClass = `${Math.floor(statusCode / 100)}xx`;
  const labels = { method, route, status: String(statusCode), status_class: statusClass };

  incrementCounter('http_requests_total', labels);
  observeHistogram('http_request_duration_ms', { method, route }, durationMs);

  if (statusCode >= 500) {
    incrementCounter('http_errors_total', { route, code: 'INTERNAL_ERROR' });
  }
}

export function recordAppError(code, route = 'unknown') {
  incrementCounter('http_errors_total', { route, code: code ?? 'INTERNAL_ERROR' });
}

export function recordAiUsage({ feature, tier, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens }) {
  incrementCounter('ai_tokens_total', { feature, tier, direction: 'input' }, inputTokens);
  incrementCounter('ai_tokens_total', { feature, tier, direction: 'output' }, outputTokens);

  if (cacheReadTokens) {
    incrementCounter('ai_tokens_total', { feature, tier, direction: 'cache_read' }, cacheReadTokens);
  }

  if (cacheWriteTokens) {
    incrementCounter('ai_tokens_total', { feature, tier, direction: 'cache_write' }, cacheWriteTokens);
  }

  const costUsd =
    (inputTokens / 1_000_000) * observabilityConfig.aiInputUsdPer1M +
    (outputTokens / 1_000_000) * observabilityConfig.aiOutputUsdPer1M +
    ((cacheReadTokens ?? 0) / 1_000_000) * observabilityConfig.aiCacheReadUsdPer1M +
    ((cacheWriteTokens ?? 0) / 1_000_000) * observabilityConfig.aiCacheWriteUsdPer1M;

  if (costUsd > 0) {
    incrementCounter('ai_cost_usd_total', { feature, tier }, costUsd);
  }

  return costUsd;
}

export function recordDailyActiveUser(dateKey) {
  incrementCounter('daily_active_users', { date: dateKey }, 0);
}

export function setDailyActiveUsers(dateKey, count) {
  setGauge('daily_active_users', { date: dateKey }, count);
}

export function renderPrometheusMetrics() {
  const lines = [];

  lines.push('# HELP sopaan_release Release/version tag for this process.');
  lines.push('# TYPE sopaan_release gauge');
  lines.push(`sopaan_release{release="${observabilityConfig.release}",environment="${observabilityConfig.environment}"} 1`);

  lines.push('# HELP http_requests_total Total HTTP requests.');
  lines.push('# TYPE http_requests_total counter');
  for (const [key, value] of counters.entries()) {
    if (key.startsWith('http_requests_total{')) {
      lines.push(`${key.split('{')[0]}${key.slice(key.indexOf('{'))} ${value}`);
    }
  }

  lines.push('# HELP http_errors_total Total application errors.');
  lines.push('# TYPE http_errors_total counter');
  for (const [key, value] of counters.entries()) {
    if (key.startsWith('http_errors_total{')) {
      lines.push(`${key.split('{')[0]}${key.slice(key.indexOf('{'))} ${value}`);
    }
  }

  lines.push('# HELP ai_tokens_total Total AI tokens consumed.');
  lines.push('# TYPE ai_tokens_total counter');
  for (const [key, value] of counters.entries()) {
    if (key.startsWith('ai_tokens_total{')) {
      lines.push(`${key.split('{')[0]}${key.slice(key.indexOf('{'))} ${value}`);
    }
  }

  lines.push('# HELP ai_cost_usd_total Estimated AI spend in USD.');
  lines.push('# TYPE ai_cost_usd_total counter');
  for (const [key, value] of counters.entries()) {
    if (key.startsWith('ai_cost_usd_total{')) {
      lines.push(`${key.split('{')[0]}${key.slice(key.indexOf('{'))} ${value}`);
    }
  }

  lines.push('# HELP http_request_duration_ms HTTP request latency in milliseconds.');
  lines.push('# TYPE http_request_duration_ms summary');
  for (const [key, bucket] of histograms.entries()) {
    if (!key.startsWith('http_request_duration_ms{')) {
      continue;
    }

    const metricName = key.split('{')[0];
    const labelPart = key.slice(key.indexOf('{'));
    lines.push(`${metricName}_count${labelPart} ${bucket.count}`);
    lines.push(`${metricName}_sum${labelPart} ${bucket.sumMs}`);
    lines.push(`${metricName}_max${labelPart} ${bucket.maxMs}`);
  }

  lines.push('# HELP daily_active_users Daily active users.');
  lines.push('# TYPE daily_active_users gauge');
  for (const [key, value] of gauges.entries()) {
    if (key.startsWith('daily_active_users{')) {
      lines.push(`${key.split('{')[0]}${key.slice(key.indexOf('{'))} ${value}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

export function getMetricsSnapshot() {
  return {
    counters: Object.fromEntries(counters),
    histograms: Object.fromEntries(histograms),
    gauges: Object.fromEntries(gauges),
  };
}
