import { logger } from '../../observability/logger.js';

/** Development SMS — logs OTP to console (never in production). */
export const devSmsProvider = {
  name: 'dev',

  async sendOtp(phone, code) {
    logger.info('[sms][dev] OTP', { phone, code });
  },
};
