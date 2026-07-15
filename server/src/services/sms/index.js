import { env } from '../../config/env.js';
import { devSmsProvider } from './devSmsProvider.js';
import { msg91SmsProvider } from './msg91Provider.js';
import { twilioSmsProvider } from './twilioProvider.js';

const providers = Object.freeze({
  dev: devSmsProvider,
  msg91: msg91SmsProvider,
  twilio: twilioSmsProvider,
});

function resolveProviderName() {
  if (process.env.NODE_ENV === 'test') {
    return 'dev';
  }

  const configured = process.env.SMS_PROVIDER?.trim().toLowerCase();

  // Never silently use the console-only provider in production. Render deployments
  // often inherit SMS_PROVIDER=dev from local examples, which returns success but
  // cannot deliver a message to the student's phone.
  if (configured && configured !== 'dev' && providers[configured]) {
    return configured;
  }

  if (
    env.isProduction &&
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
    process.env.TWILIO_AUTH_TOKEN?.trim() &&
    (process.env.TWILIO_VERIFY_SERVICE_SID?.trim() || process.env.TWILIO_FROM_NUMBER?.trim())
  ) {
    return 'twilio';
  }

  if (
    env.isProduction &&
    process.env.MSG91_AUTH_KEY?.trim() &&
    process.env.MSG91_OTP_TEMPLATE_ID?.trim()
  ) {
    return 'msg91';
  }

  return env.isProduction ? 'msg91' : 'dev';
}

/**
 * Send OTP SMS via configured provider (dev | msg91 | twilio).
 * @param {string} phone E.164 +91…
 * @param {string} code 6-digit OTP
 */
export async function sendOtpSms(phone, code) {
  const name = resolveProviderName();
  const provider = providers[name] ?? devSmsProvider;
  await provider.sendOtp(phone, code);
}

export { devSmsProvider, msg91SmsProvider, twilioSmsProvider };
