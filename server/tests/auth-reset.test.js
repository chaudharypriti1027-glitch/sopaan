import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { OtpToken } from '../src/models/OtpToken.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { testPrivacyConsent } from './helpers/privacy.js';

const EMAIL = 'reset@sopaan.dev';
const OLD_PASSWORD = 'OldPass123!';
const NEW_PASSWORD = 'NewPass456!';

async function seedEmailUser(overrides = {}) {
  const user = new User({
    name: 'Reset User',
    email: EMAIL,
    onboardingComplete: true,
    privacyConsent: {
      ...testPrivacyConsent,
      acceptedAt: new Date(),
    },
    ...overrides,
  });
  await user.setPassword(overrides.password ?? OLD_PASSWORD);
  await user.save();
  return user;
}

async function seedEmailOtp(email, code) {
  await OtpToken.create({
    email,
    codeHash: await bcrypt.hash(code, 10),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    attempts: 0,
  });
}

describe('Auth forgot / reset / change password API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('POST /forgot-password always returns sent:true (no account enumeration)', async () => {
    const unknown = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@sopaan.dev' });

    expect(unknown.status).toBe(200);
    expect(unknown.body).toEqual({ sent: true });
    expect(await OtpToken.findOne({ email: 'nobody@sopaan.dev' })).toBeNull();

    await seedEmailUser();

    const known = await request(app).post('/api/auth/forgot-password').send({ email: EMAIL });

    expect(known.status).toBe(200);
    expect(known.body).toEqual({ sent: true });
    expect(await OtpToken.findOne({ email: EMAIL })).toBeTruthy();
  });

  it('POST /reset-password sets a new password and returns AuthResult', async () => {
    await seedEmailUser();
    const code = '123456';
    await seedEmailOtp(EMAIL, code);

    const response = await request(app).post('/api/auth/reset-password').send({
      email: EMAIL,
      code,
      password: NEW_PASSWORD,
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));
    expect(response.body.isNewUser).toBe(false);
    expect(response.body.profile.email).toBe(EMAIL);

    const oldLogin = await request(app).post('/api/auth/login').send({
      email: EMAIL,
      password: OLD_PASSWORD,
    });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app).post('/api/auth/login').send({
      email: EMAIL,
      password: NEW_PASSWORD,
    });
    expect(newLogin.status).toBe(200);
  });

  it('POST /reset-password does not create a user for unknown email', async () => {
    const code = '654321';
    await seedEmailOtp('ghost@sopaan.dev', code);

    const response = await request(app).post('/api/auth/reset-password').send({
      email: 'ghost@sopaan.dev',
      code,
      password: NEW_PASSWORD,
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_OTP');
    expect(await User.findOne({ email: 'ghost@sopaan.dev' })).toBeNull();
  });

  it('POST /reset-password rejects invalid OTP', async () => {
    await seedEmailUser();
    await seedEmailOtp(EMAIL, '111111');

    const response = await request(app).post('/api/auth/reset-password').send({
      email: EMAIL,
      code: '999999',
      password: NEW_PASSWORD,
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_OTP');
  });

  it('POST /reset-password rejects weak passwords', async () => {
    await seedEmailUser();
    const code = '222333';
    await seedEmailOtp(EMAIL, code);

    const response = await request(app).post('/api/auth/reset-password').send({
      email: EMAIL,
      code,
      password: 'weak',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /change-password requires current password when one is set', async () => {
    const user = await seedEmailUser();
    const { signAccessToken } = await import('../src/utils/jwt.js');
    const token = signAccessToken(user);

    const missing = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ newPassword: NEW_PASSWORD });

    expect(missing.status).toBe(400);
    expect(missing.body.error.code).toBe('VALIDATION_ERROR');

    const wrong = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongPass1!', newPassword: NEW_PASSWORD });

    expect(wrong.status).toBe(401);
    expect(wrong.body.error.code).toBe('INVALID_CREDENTIALS');

    const ok = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: OLD_PASSWORD, newPassword: NEW_PASSWORD });

    expect(ok.status).toBe(200);
    expect(ok.body.message).toBe('Password updated successfully');
    expect(ok.body.token).toEqual(expect.any(String));
    expect(ok.body.refreshToken).toEqual(expect.any(String));

    const login = await request(app).post('/api/auth/login').send({
      email: EMAIL,
      password: NEW_PASSWORD,
    });
    expect(login.status).toBe(200);
  });

  it('POST /change-password lets OTP-only users set a password without current', async () => {
    const user = await User.create({
      name: 'OTP Only',
      phone: '+919876543210',
      onboardingComplete: true,
      privacyConsent: {
        ...testPrivacyConsent,
        acceptedAt: new Date(),
      },
    });
    const { signAccessToken } = await import('../src/utils/jwt.js');
    const token = signAccessToken(user);

    const response = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ newPassword: NEW_PASSWORD });

    expect(response.status).toBe(200);

    const login = await request(app).post('/api/auth/login').send({
      phone: '9876543210',
      password: NEW_PASSWORD,
    });
    expect(login.status).toBe(200);
  });
});
