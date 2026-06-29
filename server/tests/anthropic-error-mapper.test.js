import { describe, expect, it } from '@jest/globals';
import { mapAnthropicError } from '../src/services/ai/anthropicErrorMapper.js';

describe('mapAnthropicError', () => {
  it('maps authentication errors to AI_NOT_CONFIGURED', () => {
    const mapped = mapAnthropicError({
      status: 401,
      error: { type: 'authentication_error', message: 'invalid x-api-key' },
    });

    expect(mapped.code).toBe('AI_NOT_CONFIGURED');
    expect(mapped.statusCode).toBe(503);
  });

  it('maps rate limits to AI_RATE_LIMITED', () => {
    const mapped = mapAnthropicError({
      status: 429,
      error: { type: 'rate_limit_error', message: 'Rate limited' },
    });

    expect(mapped.code).toBe('AI_RATE_LIMITED');
    expect(mapped.statusCode).toBe(429);
  });
});
