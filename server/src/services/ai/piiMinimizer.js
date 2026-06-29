const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /\b(?:\+91[\s-]?)?[6-9]\d{9}\b/g;
const GENERIC_PHONE_PATTERN = /\b\+?\d[\d\s-]{9,14}\d\b/g;

export function stripContactPatterns(text) {
  if (typeof text !== 'string' || !text) {
    return text;
  }

  return text
    .replace(EMAIL_PATTERN, '[email]')
    .replace(PHONE_PATTERN, '[phone]')
    .replace(GENERIC_PHONE_PATTERN, '[phone]');
}

export function sanitizeAiUserText(text) {
  return stripContactPatterns(text?.trim?.() ?? text);
}

export function sanitizeAiPayload(value) {
  if (typeof value === 'string') {
    return sanitizeAiUserText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAiPayload(item));
  }

  if (value && typeof value === 'object') {
    const output = {};

    for (const [key, nested] of Object.entries(value)) {
      if (/email|phone|name|contact|address/i.test(key)) {
        continue;
      }

      output[key] = sanitizeAiPayload(nested);
    }

    return output;
  }

  return value;
}
