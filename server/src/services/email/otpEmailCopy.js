/** Shared OTP email copy — keep aligned with SMS OTP messaging. */
export const OTP_EMAIL_TTL_MINUTES = 5;
export const OTP_EMAIL_BRAND = 'Sopaan';

/**
 * @param {string} code 6-digit OTP
 */
export function buildOtpEmailSubject() {
  return `Your ${OTP_EMAIL_BRAND} login code`;
}

/**
 * @param {string} code 6-digit OTP
 */
export function buildOtpEmailText(code) {
  return [
    'Hi,',
    '',
    `Your ${OTP_EMAIL_BRAND} login code is: ${code}`,
    '',
    `This code expires in ${OTP_EMAIL_TTL_MINUTES} minutes.`,
    '',
    'Do not share this code with anyone. Sopaan will never ask for your OTP over phone or chat.',
    '',
    'If you did not request this, you can safely ignore this email.',
    '',
    '— Team Sopaan',
  ].join('\n');
}

/**
 * @param {string} code 6-digit OTP
 */
export function buildOtpEmailHtml(code) {
  return `<!DOCTYPE html>
<html lang="en">
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; line-height: 1.5;">
    <p>Hi,</p>
    <p>Your <strong>${OTP_EMAIL_BRAND}</strong> login code is:</p>
    <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 16px 0;">${code}</p>
    <p>This code expires in <strong>${OTP_EMAIL_TTL_MINUTES} minutes</strong>.</p>
    <p>Do not share this code with anyone. Sopaan will never ask for your OTP over phone or chat.</p>
    <p style="color: #666;">If you did not request this, you can safely ignore this email.</p>
    <p>— Team Sopaan</p>
  </body>
</html>`;
}
