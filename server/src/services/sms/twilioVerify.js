import { AppError } from '../../utils/AppError.js';
import { logger } from '../../observability/logger.js';
import { buildOtpSmsBody, resolveTwilioVerifyTemplateSid } from './otpSmsCopy.js';

const INVALID_OTP_MESSAGE = 'Invalid or expired OTP';
const VERIFY_BASE = 'https://verify.twilio.com/v2';

function credentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();

  if (!accountSid || !authToken || !serviceSid) {
    return null;
  }

  return { accountSid, authToken, serviceSid };
}

/** Phone OTP via Twilio Verify when service SID + credentials are set (skipped in tests). */
export function isTwilioVerifyEnabled() {
  if (process.env.NODE_ENV === 'test') {
    return false;
  }

  if (process.env.OTP_USE_TWILIO_VERIFY?.trim().toLowerCase() === 'false') {
    return false;
  }

  // MSG91 / direct SMS uses our own OTP store — not Twilio Verify.
  const smsProvider = process.env.SMS_PROVIDER?.trim().toLowerCase();
  if (smsProvider === 'msg91') {
    return false;
  }

  return credentials() !== null;
}

async function verifyRequest(path, fields) {
  const creds = credentials();

  if (!creds) {
    logger.error('[sms][twilio-verify] missing credentials');
    throw new AppError('SMS delivery is not configured', 503, 'SMS_UNAVAILABLE');
  }

  const body = new URLSearchParams(fields);
  const response = await fetch(`${VERIFY_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${creds.accountSid}:${creds.authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const code = payload.code;
    logger.error('[sms][twilio-verify] request failed', {
      path,
      status: response.status,
      code,
      message: payload.message,
    });

    if (code === 60202) {
      throw new AppError(INVALID_OTP_MESSAGE, 400, 'INVALID_OTP', { attemptsRemaining: 0 });
    }

    if (code === 20404 || code === 60200) {
      throw new AppError(INVALID_OTP_MESSAGE, 400, 'INVALID_OTP', { attemptsRemaining: 0 });
    }

    // Twilio trial accounts only deliver SMS to verified caller IDs.
    if (code === 21608 || code === 21610) {
      throw new AppError(
        'SMS cannot be sent to this number on a Twilio trial account. Upgrade Twilio billing or verify the number in Twilio Console.',
        503,
        'SMS_TRIAL_RESTRICTED',
      );
    }

    throw new AppError('Failed to send OTP', 503, 'SMS_UNAVAILABLE');
  }

  return payload;
}

/**
 * Start SMS verification via Twilio Verify (Twilio sends the code).
 * @param {string} phone E.164 +91…
 */
export async function startTwilioPhoneVerification(phone) {
  const creds = credentials();
  await verifyRequest(`/Services/${creds.serviceSid}/Verifications`, {
    To: phone,
    Channel: 'sms',
    Locale: 'en',
    TemplateSid: resolveTwilioVerifyTemplateSid(),
  });
}

/**
 * Check user-submitted code with Twilio Verify.
 * @param {string} phone E.164 +91…
 * @param {string} code 6-digit OTP
 */
export async function checkTwilioPhoneVerification(phone, code) {
  const creds = credentials();
  const payload = await verifyRequest(`/Services/${creds.serviceSid}/VerificationCheck`, {
    To: phone,
    Code: code,
  });

  if (payload.status === 'approved') {
    return true;
  }

  throw new AppError(INVALID_OTP_MESSAGE, 400, 'INVALID_OTP', { attemptsRemaining: 0 });
}
