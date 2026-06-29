const SENSITIVE_KEY_PATTERN =
  /password|secret|token|authorization|api[_-]?key|cookie|session|otp|refresh|bearer|credit|ssn|aadhaar|pan/i;

const PII_KEY_PATTERN = /email|phone|mobile|contact|name|address/i;

const REDACTED = '[REDACTED]';

function maskEmail(value) {
  if (typeof value !== 'string' || !value.includes('@')) {
    return REDACTED;
  }
  const [local, domain] = value.split('@');
  return `${local.slice(0, 1)}***@${domain}`;
}

function maskPhone(value) {
  if (typeof value !== 'string') {
    return REDACTED;
  }
  const digits = value.replace(/\D/g, '');
  if (digits.length < 6) {
    return REDACTED;
  }
  return `***${digits.slice(-4)}`;
}

function redactValue(key, value) {
  if (value == null) {
    return value;
  }

  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return REDACTED;
  }

  if (PII_KEY_PATTERN.test(key)) {
    if (typeof value === 'string') {
      if (value.includes('@')) {
        return maskEmail(value);
      }
      if (/^\+?\d[\d\s-]{7,}$/.test(value)) {
        return maskPhone(value);
      }
      if (key.toLowerCase().includes('name')) {
        return value.length > 1 ? `${value.slice(0, 1)}***` : REDACTED;
      }
    }
  }

  return value;
}

export function redactSensitiveData(input, depth = 0) {
  if (depth > 6 || input == null) {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => redactSensitiveData(item, depth + 1));
  }

  if (typeof input !== 'object') {
    return input;
  }

  const output = {};

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'object' && value !== null) {
      output[key] = redactSensitiveData(value, depth + 1);
      continue;
    }

    output[key] = redactValue(key, value);
  }

  return output;
}

export function redactHeaders(headers = {}) {
  const safe = { ...headers };

  for (const key of Object.keys(safe)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      safe[key] = REDACTED;
    }
  }

  return safe;
}
