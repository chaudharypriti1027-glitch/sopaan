import { captureMobileException } from './sentry';

export function captureSentryTestError() {
  const error = new Error('Sopaan mobile Sentry test error');
  captureMobileException(error, {
    tags: { source: 'sentry_test' },
    extra: { intentional: true },
  });
  throw error;
}
