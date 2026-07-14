import { AppError } from '../../utils/AppError.js';
import { logger } from '../../observability/logger.js';
import { getTwilioCredentials } from '../../config/twilioConfig.js';
import { buildOtpSmsBody } from './otpSmsCopy.js';

/** Twilio SMS provider — configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER. */
export const twilioSmsProvider = {
  name: 'twilio',

  async sendOtp(phone, code) {
    const creds = getTwilioCredentials();
    const fromNumber = process.env.TWILIO_FROM_NUMBER?.trim();

    if (!creds || !fromNumber) {
      logger.error('[sms][twilio] missing Twilio credentials or TWILIO_FROM_NUMBER');
      throw new AppError('SMS delivery is not configured', 503, 'SMS_UNAVAILABLE');
    }

    const body = new URLSearchParams({
      To: phone,
      From: fromNumber,
      Body: buildOtpSmsBody(code),
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${creds.accountSid}:${creds.authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      logger.error('[sms][twilio] send failed', {
        status: response.status,
        detail: detail.slice(0, 300),
      });
      throw new AppError('Failed to send OTP', 503, 'SMS_UNAVAILABLE');
    }
  },
};
