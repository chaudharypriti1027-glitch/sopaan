import { AppError } from '../../utils/AppError.js';
import { logger } from '../../observability/logger.js';
import { buildOtpSmsBody } from './otpSmsCopy.js';

/** Twilio SMS provider — configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER. */
export const twilioSmsProvider = {
  name: 'twilio',

  async sendOtp(phone, code) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
    const fromNumber = process.env.TWILIO_FROM_NUMBER?.trim();

    if (!accountSid || !authToken || !fromNumber) {
      logger.error('[sms][twilio] missing Twilio credentials');
      throw new AppError('SMS delivery is not configured', 503, 'SMS_UNAVAILABLE');
    }

    const body = new URLSearchParams({
      To: phone,
      From: fromNumber,
      Body: buildOtpSmsBody(code),
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
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
