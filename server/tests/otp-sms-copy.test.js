import { describe, expect, it } from '@jest/globals';
import {
  buildOtpSmsBody,
  resolveTwilioVerifyTemplateSid,
  TWILIO_VERIFY_DEFAULT_TEMPLATE_SID,
} from '../src/services/sms/otpSmsCopy.js';

describe('otpSmsCopy', () => {
  it('builds a branded SMS with code and security note', () => {
    const body = buildOtpSmsBody('482910');
    expect(body).toContain('Sopaan');
    expect(body).toContain('482910');
    expect(body).toContain('Do not share');
    expect(body.length).toBeLessThanOrEqual(160);
  });

  it('uses default Twilio Verify template when env is unset', () => {
    const previous = process.env.TWILIO_VERIFY_TEMPLATE_SID;
    delete process.env.TWILIO_VERIFY_TEMPLATE_SID;
    expect(resolveTwilioVerifyTemplateSid()).toBe(TWILIO_VERIFY_DEFAULT_TEMPLATE_SID);
    process.env.TWILIO_VERIFY_TEMPLATE_SID = previous;
  });
});
