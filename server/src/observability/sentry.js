import * as Sentry from '@sentry/node';
import { observabilityConfig } from '../config/observabilityConfig.js';
import { scrubSentryEvent } from './scrubSentryEvent.js';

let initialized = false;

export function isSentryEnabled() {
  return initialized;
}

export function initSentry() {
  if (initialized || !observabilityConfig.enabled || !observabilityConfig.sentryDsn) {
    return false;
  }

  Sentry.init({
    dsn: observabilityConfig.sentryDsn,
    environment: observabilityConfig.environment,
    release: observabilityConfig.release,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    integrations: [Sentry.httpIntegration(), Sentry.expressIntegration()],
    beforeSend(event) {
      return scrubSentryEvent(event);
    },
  });

  initialized = true;
  return true;
}

export function installProcessErrorHandlers() {
  if (!initialized) {
    return;
  }

  process.on('unhandledRejection', (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    captureException(error, { extra: { source: 'unhandledRejection' } });
  });

  process.on('uncaughtException', (error) => {
    captureException(error, { extra: { source: 'uncaughtException' } });
  });
}

export function setupSentryExpressErrorHandler(app) {
  if (!initialized || !app) {
    return;
  }

  Sentry.setupExpressErrorHandler(app);
}

export function captureException(error, context = {}) {
  if (!initialized) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context.requestId) {
      scope.setTag('requestId', context.requestId);
    }

    if (context.userId) {
      scope.setUser({ id: context.userId });
    }

    if (context.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        scope.setTag(key, value);
      }
    }

    if (context.extra) {
      for (const [key, value] of Object.entries(context.extra)) {
        scope.setExtra(key, value);
      }
    }

    Sentry.captureException(error);
  });
}

export function captureAlertMessage(message, extra = {}) {
  if (!initialized) {
    return;
  }

  Sentry.captureMessage(message, {
    level: 'warning',
    extra,
  });
}

export { Sentry };
