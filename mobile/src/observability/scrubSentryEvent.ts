import type { ErrorEvent } from '@sentry/types';

const REDACTED = '[REDACTED]';

const SENSITIVE_FIELD_PATTERN =
  /(password|passwd|secret|token|api[_-]?key|otp|authorization|cookie|creditcard|email|phone|mobile)/i;

function scrubObject(value: unknown, depth = 0): unknown {
  if (value == null || depth > 6) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => scrubObject(item, depth + 1));
  }

  if (typeof value !== 'object') {
    return value;
  }

  const scrubbed: Record<string, unknown> = {};

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_FIELD_PATTERN.test(key)) {
      scrubbed[key] = REDACTED;
      continue;
    }

    scrubbed[key] = scrubObject(nested, depth + 1);
  }

  return scrubbed;
}

export function scrubSentryEvent(event: ErrorEvent): ErrorEvent {
  if (event.request?.headers) {
    event.request.headers = scrubObject(event.request.headers) as Record<string, string>;
  }

  if (event.request?.data) {
    event.request.data = scrubObject(event.request.data);
  }

  if (event.user) {
    event.user = { id: event.user.id };
  }

  if (event.extra) {
    event.extra = scrubObject(event.extra) as ErrorEvent['extra'];
  }

  return event;
}
