/** Shared OTP SMS copy — keep under ~160 chars for single-segment delivery. */
export const OTP_SMS_TTL_MINUTES = 5;
export const OTP_SMS_BRAND = 'Sopaan';

/**
 * Branded SMS body for direct SMS providers (Twilio Messages, MSG91 templates, dev logs).
 * @param {string} code 6-digit OTP
 */
export function buildOtpSmsBody(code) {
  return (
    `${OTP_SMS_BRAND}: Your login code is ${code}. ` +
    `Valid for ${OTP_SMS_TTL_MINUTES} minutes. ` +
    `Do not share this OTP with anyone.`
  );
}

/** Twilio Verify pre-approved template with expiry + do-not-share warning. */
export const TWILIO_VERIFY_DEFAULT_TEMPLATE_SID = 'HJ152393dff43d3a2c1554ab0f28291dbe';

export function resolveTwilioVerifyTemplateSid() {
  return process.env.TWILIO_VERIFY_TEMPLATE_SID?.trim() || TWILIO_VERIFY_DEFAULT_TEMPLATE_SID;
}
