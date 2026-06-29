import { AppError } from '../../utils/AppError.js';
import { logger } from '../../observability/logger.js';

const MSG91_API_URL = 'https://control.msg91.com/api/v5/flow/';

/** MSG91 SMS provider — configure MSG91_AUTH_KEY + MSG91_OTP_TEMPLATE_ID. */
export const msg91SmsProvider = {
  name: 'msg91',

  async sendOtp(phone, code) {
    const authKey = process.env.MSG91_AUTH_KEY?.trim();
    const templateId = process.env.MSG91_OTP_TEMPLATE_ID?.trim();

    if (!authKey || !templateId) {
      logger.error('[sms][msg91] missing MSG91_AUTH_KEY or MSG91_OTP_TEMPLATE_ID');
      throw new AppError('SMS delivery is not configured', 503, 'SMS_UNAVAILABLE');
    }

    const national = phone.replace(/^\+91/, '');

    const response = await fetch(MSG91_API_URL, {
      method: 'POST',
      headers: {
        authkey: authKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_id: templateId,
        recipients: [{ mobiles: `91${national}`, OTP: code }],
      }),
    });

    if (!response.ok) {
      logger.error('[sms][msg91] send failed', { status: response.status });
      throw new AppError('Failed to send OTP', 503, 'SMS_UNAVAILABLE');
    }
  },
};
