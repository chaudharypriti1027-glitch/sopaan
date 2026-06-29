const REDACTED = '[REDACTED]';

const SENSITIVE_HEADER_KEYS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
]);

const SENSITIVE_FIELD_PATTERN =
  /(password|passwd|secret|token|api[_-]?key|otp|authorization|cookie|creditcard|cardnumber|cvv|ssn|email|phone|mobile)/i;

function scrubObject(value, depth = 0) {
  if (value == null || depth > 6) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => scrubObject(item, depth + 1));
  }

  if (typeof value !== 'object') {
    return value;
  }

  const scrubbed = {};

  for (const [key, nested] of Object.entries(value)) {
    if (SENSITIVE_FIELD_PATTERN.test(key)) {
      scrubbed[key] = REDACTED;
      continue;
    }

    scrubbed[key] = scrubObject(nested, depth + 1);
  }

  return scrubbed;
}

function scrubHeaders(headers = {}) {
  const scrubbed = { ...headers };

  for (const [key] of Object.entries(scrubbed)) {
    if (SENSITIVE_HEADER_KEYS.has(key.toLowerCase())) {
      scrubbed[key] = REDACTED;
    }
  }

  return scrubbed;
}

export function scrubSentryEvent(event) {
  if (!event || typeof event !== 'object') {
    return event;
  }

  if (event.request) {
    if (event.request.headers) {
      event.request.headers = scrubHeaders(event.request.headers);
    }

    if (event.request.cookies) {
      event.request.cookies = REDACTED;
    }

    if (event.request.data) {
      event.request.data = scrubObject(event.request.data);
    }

    if (event.request.query_string && SENSITIVE_FIELD_PATTERN.test(event.request.query_string)) {
      event.request.query_string = REDACTED;
    }
  }

  if (event.user) {
    event.user = {
      id: event.user.id,
      ip_address: event.user.ip_address,
    };
  }

  if (event.extra) {
    event.extra = scrubObject(event.extra);
  }

  if (event.contexts) {
    event.contexts = scrubObject(event.contexts);
  }

  return event;
}
