import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function readPackageVersion() {
  try {
    const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8'));
    return pkg.version ?? '0.0.0';
  } catch {
    return process.env.APP_VERSION?.trim() || '0.0.0';
  }
}

export const observabilityConfig = Object.freeze({
  enabled: process.env.OBSERVABILITY_ENABLED !== 'false',
  serviceName: process.env.OTEL_SERVICE_NAME?.trim() || 'sopaan-api',
  release: process.env.SENTRY_RELEASE?.trim() || `sopaan-api@${readPackageVersion()}`,
  environment: process.env.SENTRY_ENVIRONMENT?.trim() || process.env.NODE_ENV || 'development',
  sentryDsn: process.env.SENTRY_DSN?.trim() || '',
  metricsToken: process.env.METRICS_TOKEN?.trim() || '',
  metricsPath: process.env.METRICS_PATH?.trim() || '/metrics',
  alertWebhookUrl: process.env.OBS_ALERT_WEBHOOK_URL?.trim() || '',
  errorSpikeThreshold: Number(process.env.OBS_ERROR_SPIKE_THRESHOLD ?? 25),
  errorSpikeWindowMs: Number(process.env.OBS_ERROR_SPIKE_WINDOW_MS ?? 5 * 60 * 1000),
  aiCostSpikeUsd: Number(process.env.OBS_AI_COST_SPIKE_USD ?? 5),
  aiCostSpikeWindowMs: Number(process.env.OBS_AI_COST_SPIKE_WINDOW_MS ?? 60 * 60 * 1000),
  aiInputUsdPer1M: Number(process.env.AI_COST_INPUT_USD_PER_1M ?? 3),
  aiOutputUsdPer1M: Number(process.env.AI_COST_OUTPUT_USD_PER_1M ?? 15),
  aiCacheReadUsdPer1M: Number(process.env.AI_COST_CACHE_READ_USD_PER_1M ?? 0.3),
  aiCacheWriteUsdPer1M: Number(process.env.AI_COST_CACHE_WRITE_USD_PER_1M ?? 3.75),
});
