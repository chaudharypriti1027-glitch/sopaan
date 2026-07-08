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

  if (configured && providers[configured]) {
    return configured;
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
