import { ApiError } from '../../api/errors';
import { getUserFacingMessage } from '../getUserFacingMessage';

describe('getUserFacingMessage', () => {
  it('maps network errors to offline hint', () => {
    const message = getUserFacingMessage(new ApiError('Network Error', 0, 'NETWORK_ERROR'));
    expect(message).toContain('internet');
  });

  it('maps aborted AI requests to timeout copy, not offline', () => {
    const message = getUserFacingMessage(
      new ApiError('timeout of 60000ms exceeded', 0, 'ECONNABORTED')
    );
    expect(message.toLowerCase()).toContain('too long');
    expect(message.toLowerCase()).not.toContain('internet');
  });

  it('maps AI_TIMEOUT from the server', () => {
    const message = getUserFacingMessage(new ApiError('AI took too long', 504, 'AI_TIMEOUT'));
    expect(message.toLowerCase()).toContain('too long');
  });

  it('maps AI_RATE_LIMIT_EXCEEDED from the limiter', () => {
    const message = getUserFacingMessage(
      new ApiError('Too many AI requests', 429, 'AI_RATE_LIMIT_EXCEEDED')
    );
    expect(message.toLowerCase()).toContain('busy');
  });

  it('maps quota exceeded before generic 429 rate-limit copy', () => {
    const message = getUserFacingMessage(
      new ApiError('Daily AI evaluations used up', 429, 'QUOTA_EXCEEDED')
    );
    expect(message.toLowerCase()).toContain('limit');
    expect(message.toLowerCase()).not.toContain('busy');
  });

  it('maps server errors to generic server message', () => {
    const message = getUserFacingMessage(new ApiError('Internal error', 500, 'INTERNAL'));
    expect(message).toContain('server');
  });

  it('returns API message for client errors', () => {
    const message = getUserFacingMessage(new ApiError('Invalid OTP', 400, 'INVALID_OTP'));
    expect(message).toBe('Invalid OTP');
  });

  it('maps AI not configured errors', () => {
    const message = getUserFacingMessage(
      new ApiError('AI not configured', 503, 'AI_NOT_CONFIGURED')
    );
    expect(message.toLowerCase()).toContain('ai');
  });

  it('maps AI unavailable errors', () => {
    const message = getUserFacingMessage(new ApiError('AI unavailable', 503, 'AI_UNAVAILABLE'));
    expect(message.toLowerCase()).toContain('ai');
  });

  it('maps payments not configured to coming soon', () => {
    const message = getUserFacingMessage(
      new ApiError('Payments not configured', 503, 'PAYMENTS_NOT_CONFIGURED')
    );
    expect(message.toLowerCase()).toContain('coming soon');
  });

  it('maps email unavailable without generic server error', () => {
    const message = getUserFacingMessage(
      new ApiError('Email OTP is not configured', 503, 'EMAIL_UNAVAILABLE')
    );
    expect(message.toLowerCase()).toContain('email');
    expect(message.toLowerCase()).not.toContain('servers are having trouble');
  });
});
