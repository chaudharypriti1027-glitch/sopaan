import { describe, expect, it } from '@jest/globals';
import { mapAnthropicError } from '../src/services/ai/anthropicErrorMapper.js';

describe('mapAnthropicError', () => {
  it('maps authentication errors to AI_UNAVAILABLE without leaking provider details', () => {
    const mapped = mapAnthropicError({
      status: 401,
      error: { type: 'authentication_error', message: 'invalid x-api-key' },
    });

    expect(mapped.code).toBe('AI_UNAVAILABLE');
    expect(mapped.statusCode).toBe(503);
    expect(mapped.message).not.toMatch(/x-api-key/i);
  });

  it('maps rate limits to AI_RATE_LIMITED', () => {
    const mapped = mapAnthropicError({
      status: 429,
      error: { type: 'rate_limit_error', message: 'Rate limited' },
    });

    expect(mapped.code).toBe('AI_RATE_LIMITED');
    expect(mapped.statusCode).toBe(429);
  });

  it('maps AbortSignal timeouts to AI_TIMEOUT', () => {
    const mapped = mapAnthropicError({
      name: 'TimeoutError',
      message: 'The operation was aborted due to timeout',
    });

    expect(mapped.code).toBe('AI_TIMEOUT');
    expect(mapped.statusCode).toBe(504);
  });

  it('does not expose raw provider errors', () => {
    const mapped = mapAnthropicError(new Error('internal provider trace secret-123'));

    expect(mapped.code).toBe('AI_GENERATION_FAILED');
    expect(mapped.message).not.toContain('secret-123');
  });
});
