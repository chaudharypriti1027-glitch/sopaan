import type { ApiError } from '../api/errors';

type OtpErrorDetails = {
  attemptsRemaining?: number;
};

export function formatOtpError(error: ApiError): string {
  const details = error.details as OtpErrorDetails | undefined;

  if (error.code === 'INVALID_OTP') {
    const remaining = details?.attemptsRemaining;

    if (typeof remaining === 'number') {
      if (remaining <= 0) {
        return 'Too many attempts. Tap Resend code for a new OTP.';
      }

      return `That code didn't match. ${remaining} attempt${remaining === 1 ? '' : 's'} left.`;
    }

    return "That code didn't work. Check the SMS and try again.";
  }

  if (error.code === 'RATE_LIMITED' || error.code === 'OTP_RATE_LIMIT_EXCEEDED' || error.status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  if (error.code === 'EMAIL_UNAVAILABLE') {
    return 'Could not send the OTP email. Please try again in a moment.';
  }

  if (error.code === 'SMS_UNAVAILABLE') {
    return 'Could not send the OTP SMS. Try again in a moment.';
  }

  if (error.code === 'SMS_TRIAL_RESTRICTED') {
    return 'SMS is not enabled for this number yet. Please try again later or contact support.';
  }

  return error.message;
}
