import { jest, beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { User } from '../src/models/User.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { withPrivacyConsent, testPrivacyConsent } from './helpers/privacy.js';

const mockVerifyIdToken = jest.fn();

jest.unstable_mockModule('google-auth-library', () => ({
  OAuth2Client: jest.fn(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

process.env.GOOGLE_CLIENT_ID = 'test-google-client-id.apps.googleusercontent.com';

const { default: app } = await import('../src/app.js');

function mockGooglePayload(overrides = {}) {
  return {
    sub: 'google-sub-123',
    email: 'google.user@example.com',
    email_verified: true,
    name: 'Google User',
    picture: 'https://example.com/avatar.jpg',
    ...overrides,
  };
}

function mockVerifiedToken(payload) {
  mockVerifyIdToken.mockResolvedValue({
    getPayload: () => payload,
  });
}

describe('POST /api/auth/google', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
    delete process.env.GOOGLE_CLIENT_ID;
  });

  beforeEach(async () => {
    await clearTestDatabase();
    mockVerifyIdToken.mockReset();
  });

  it('creates a new user and returns AuthResult', async () => {
    mockVerifiedToken(mockGooglePayload());

    const response = await request(app).post('/api/auth/google').send({
      idToken: 'valid-google-id-token',
      privacyConsent: testPrivacyConsent,
    });

    expect(response.status).toBe(200);
    expect(response.body.isNewUser).toBe(true);
    expect(response.body.profile.email).toBe('google.user@example.com');
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));

    const user = await User.findOne({ email: 'google.user@example.com' }).lean();
    expect(user?.googleSub).toBe('google-sub-123');
    expect(user?.phone).toBeUndefined();
  });

  it('links Google to an existing email/password user', async () => {
    await request(app).post('/api/auth/signup').send(withPrivacyConsent({
      name: 'Existing User',
      phone: '+919876543210',
      email: 'google.user@example.com',
      password: 'Password123',
    }));

    mockVerifiedToken(mockGooglePayload());

    const response = await request(app).post('/api/auth/google').send({
      idToken: 'valid-google-id-token',
    });

    expect(response.status).toBe(200);
    expect(response.body.isNewUser).toBe(false);
    expect(response.body.profile.email).toBe('google.user@example.com');

    const user = await User.findOne({ email: 'google.user@example.com' }).lean();
    expect(user?.googleSub).toBe('google-sub-123');
  });

  it('returns GOOGLE_EMAIL_REQUIRED when email is missing', async () => {
    mockVerifiedToken(mockGooglePayload({ email: undefined, email_verified: false }));

    const response = await request(app).post('/api/auth/google').send({
      idToken: 'valid-google-id-token',
      privacyConsent: testPrivacyConsent,
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('GOOGLE_EMAIL_REQUIRED');
    expect(response.body.error.message).toMatch(/verified email/i);
  });

  it('rejects invalid Google tokens', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('invalid token'));

    const response = await request(app).post('/api/auth/google').send({
      idToken: 'invalid-google-id-token',
      privacyConsent: testPrivacyConsent,
    });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('GOOGLE_AUTH_INVALID');
  });
});
