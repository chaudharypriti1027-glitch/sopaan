/**
 * Resolve Twilio credentials from environment.
 * Primary token is used by default; test token when NODE_ENV=test or TWILIO_USE_TEST_AUTH_TOKEN=true.
 */
export function getTwilioCredentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();

  if (!accountSid) {
    return null;
  }

  const useTestToken =
    process.env.NODE_ENV === 'test' ||
    process.env.TWILIO_USE_TEST_AUTH_TOKEN?.trim().toLowerCase() === 'true';

  const authToken = useTestToken
    ? process.env.TWILIO_TEST_AUTH_TOKEN?.trim() || process.env.TWILIO_AUTH_TOKEN?.trim()
    : process.env.TWILIO_AUTH_TOKEN?.trim();

  if (!authToken) {
    return null;
  }

  return { accountSid, authToken, serviceSid: serviceSid || undefined };
}

export function isTwilioConfigured() {
  return getTwilioCredentials() !== null;
}
