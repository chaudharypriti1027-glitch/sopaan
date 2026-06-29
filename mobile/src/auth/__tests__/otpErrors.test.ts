import { describe, expect, it } from '@jest/globals';
import { ApiError } from '../../api/errors';
import { formatOtpError } from '../../auth/otpErrors';

describe('formatOtpError', () => {
  it('includes attempts remaining for invalid OTP', () => {
    const error = new ApiError('Invalid or expired OTP', 400, 'INVALID_OTP', {
      attemptsRemaining: 3,
    });

    expect(formatOtpError(error)).toBe("That code didn't match. 3 attempts left.");
  });

  it('shows resend hint when no attempts remain', () => {
    const error = new ApiError('Invalid or expired OTP', 400, 'INVALID_OTP', {
      attemptsRemaining: 0,
    });

    expect(formatOtpError(error)).toBe('Too many attempts. Tap Resend code for a new OTP.');
  });
});
