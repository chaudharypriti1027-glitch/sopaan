import { afterEach, describe, expect, it } from '@jest/globals';
import { getTwilioCredentials, isTwilioConfigured } from '../src/config/twilioConfig.js';

describe('twilioConfig', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it('returns null when account SID is missing', () => {
    delete process.env.TWILIO_ACCOUNT_SID;
    expect(getTwilioCredentials()).toBeNull();
    expect(isTwilioConfigured()).toBe(false);
  });

  it('uses primary auth token by default', () => {
    process.env.NODE_ENV = 'development';
    process.env.TWILIO_ACCOUNT_SID = 'ACtest';
    process.env.TWILIO_AUTH_TOKEN = 'primary';
    process.env.TWILIO_TEST_AUTH_TOKEN = 'test';
    process.env.TWILIO_VERIFY_SERVICE_SID = 'VAtest';
    process.env.TWILIO_USE_TEST_AUTH_TOKEN = 'false';

    expect(getTwilioCredentials()).toEqual({
      accountSid: 'ACtest',
      authToken: 'primary',
      serviceSid: 'VAtest',
    });
  });

  it('uses test auth token when enabled', () => {
    process.env.TWILIO_ACCOUNT_SID = 'ACtest';
    process.env.TWILIO_AUTH_TOKEN = 'primary';
    process.env.TWILIO_TEST_AUTH_TOKEN = 'test';
    process.env.TWILIO_USE_TEST_AUTH_TOKEN = 'true';

    expect(getTwilioCredentials()?.authToken).toBe('test');
  });
});
