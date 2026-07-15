import type { ApiError } from '../api/errors';
import i18n from '../i18n';

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
    return i18n.t('common:emailUnavailable');
  }

  if (error.code === 'SMS_UNAVAILABLE') {
    return i18n.t('common:smsUnavailable');
  }

  if (error.code === 'SMS_TRIAL_RESTRICTED') {
    return 'This number cannot receive SMS on our trial SMS account. Use email login, verify the number in Twilio Console, or contact support.';
  }

  if (error.code === 'SMS_GEO_RESTRICTED') {
    return 'SMS to this country is not enabled yet. Please use email login or contact support.';
  }

  return error.message;
}
