import { describe, expect, it } from '@jest/globals';
import {
  buildOtpEmailHtml,
  buildOtpEmailSubject,
  buildOtpEmailText,
} from '../src/services/email/otpEmailCopy.js';

describe('otp email copy', () => {
  it('builds subject and body with OTP code', () => {
    expect(buildOtpEmailSubject()).toContain('Sopaan');
    expect(buildOtpEmailText('123456')).toContain('123456');
    expect(buildOtpEmailText('123456')).toContain('5 minutes');
  });

  it('builds html with OTP code', () => {
    expect(buildOtpEmailHtml('654321')).toContain('654321');
    expect(buildOtpEmailHtml('654321')).toContain('Team Sopaan');
  });
});
