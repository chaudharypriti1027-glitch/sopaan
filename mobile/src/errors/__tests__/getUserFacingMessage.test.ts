import { ApiError } from '../../api/errors';
import { getUserFacingMessage } from '../getUserFacingMessage';

describe('getUserFacingMessage', () => {
  it('maps network errors to offline hint', () => {
    const message = getUserFacingMessage(new ApiError('Network Error', 0, 'NETWORK_ERROR'));
    expect(message).toContain('internet');
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
    const message = getUserFacingMessage(new ApiError('AI not configured', 503, 'AI_NOT_CONFIGURED'));
    expect(message.toLowerCase()).toContain('ai');
  });
});
