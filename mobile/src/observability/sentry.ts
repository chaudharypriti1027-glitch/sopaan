import * as Sentry from '@sentry/react-native';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { scrubSentryEvent } from './scrubSentryEvent';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();

export function readMobileSentryRelease() {
  const override = process.env.EXPO_PUBLIC_SENTRY_RELEASE?.trim();
  if (override) {
    return override;
  }

  const version = Constants.expoConfig?.version ?? '0.0.0';
  return `sopaan-mobile@${version}`;
}

export function readMobileSentryDist() {
  const override = process.env.EXPO_PUBLIC_SENTRY_DIST?.trim();
  if (override) {
    return override;
  }

  return Application.nativeBuildVersion ?? undefined;
}

export function readMobileSentryEnvironment() {
  const override = process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT?.trim();
  if (override) {
    return override;
  }

  if (__DEV__) {
    return 'development';
  }

  if (process.env.EXPO_PUBLIC_API_URL?.includes('staging')) {
    return 'staging';
  }

  return 'production';
}

export function initMobileObservability() {
  if (!dsn) {
    return false;
  }

  Sentry.init({
    dsn,
    environment: readMobileSentryEnvironment(),
    release: readMobileSentryRelease(),
    dist: readMobileSentryDist(),
    tracesSampleRate: Number(process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    enableNative: true,
    enableAutoSessionTracking: true,
    beforeSend(event) {
      return scrubSentryEvent(event);
    },
  });

  return true;
}

export function setMobileUser(context: { id: string }) {
  if (!dsn) {
    return;
  }

  Sentry.setUser({ id: context.id });
}

export function clearMobileUser() {
  if (!dsn) {
    return;
  }

  Sentry.setUser(null);
}

export function captureMobileException(
  error: unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  },
) {
  if (!dsn) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        scope.setTag(key, value);
      }
    }

    if (context?.extra) {
      for (const [key, value] of Object.entries(context.extra)) {
        scope.setExtra(key, value);
      }
    }

    Sentry.captureException(error);
  });
}

export { Sentry };
