import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { OtpToken } from '../src/models/OtpToken.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';

const PHONE = '+919876543210';
const PHONE_RAW = '9876543210';

describe('Auth OTP API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('POST /request-otp returns { sent: true } for valid phone', async () => {
    const response = await request(app).post('/api/auth/request-otp').send({ phone: PHONE_RAW });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ sent: true });

    const token = await OtpToken.findOne({ phone: PHONE }).select('+codeHash');
    expect(token).toBeTruthy();
    expect(token.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('POST /verify-otp creates a new user and returns AuthResult', async () => {
    const code = '123456';
    const codeHash = await bcrypt.hash(code, 10);
    await OtpToken.create({
      phone: PHONE,
      codeHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
    });

    const response = await request(app).post('/api/auth/verify-otp').send({
      phone: PHONE_RAW,
      code,
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));
    expect(response.body.isNewUser).toBe(true);
    expect(response.body.profile).toMatchObject({
      phone: PHONE,
      name: 'Student',
    });
    expect(response.body.profile.passwordHash).toBeUndefined();

    const user = await User.findOne({ phone: PHONE });
    expect(user?.onboardingComplete).toBe(false);
    expect(await OtpToken.findOne({ phone: PHONE })).toBeNull();
  });

  it('POST /verify-otp stores privacy consent for a new user when provided', async () => {
    const code = '222333';
    await OtpToken.create({
      phone: PHONE,
      codeHash: await bcrypt.hash(code, 10),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
    });

    const response = await request(app).post('/api/auth/verify-otp').send({
      phone: PHONE_RAW,
      code,
      privacyConsent: { policyVersion: '2025-06-01', aiProcessing: true, marketing: false },
    });

    expect(response.status).toBe(200);
    expect(response.body.isNewUser).toBe(true);

    const user = await User.findOne({ phone: PHONE });
    expect(user?.privacyConsent?.policyVersion).toBe('2025-06-01');
    expect(user?.privacyConsent?.acceptedAt).toBeTruthy();
  });

  it('POST /verify-otp returns isNewUser false for existing user', async () => {
    await User.create({ name: 'Existing', phone: PHONE, onboardingComplete: true });

    const code = '654321';
    await OtpToken.create({
      phone: PHONE,
      codeHash: await bcrypt.hash(code, 10),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const response = await request(app).post('/api/auth/verify-otp').send({
      phone: PHONE,
      code,
    });

    expect(response.status).toBe(200);
    expect(response.body.isNewUser).toBe(false);
    expect(response.body.profile.phone).toBe(PHONE);
  });

  it('POST /verify-otp rejects invalid code with 400 and increments attempts', async () => {
    await OtpToken.create({
      phone: PHONE,
      codeHash: await bcrypt.hash('111111', 10),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
    });

    const response = await request(app).post('/api/auth/verify-otp').send({
      phone: PHONE_RAW,
      code: '999999',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_OTP');
    expect(response.body.error.details).toEqual({ attemptsRemaining: 4 });

    const token = await OtpToken.findOne({ phone: PHONE });
    expect(token?.attempts).toBe(1);
  });

  it('POST /verify-otp rejects expired token with 400', async () => {
    await OtpToken.create({
      phone: PHONE,
      codeHash: await bcrypt.hash('123456', 10),
      expiresAt: new Date(Date.now() - 1000),
    });

    const response = await request(app).post('/api/auth/verify-otp').send({
      phone: PHONE_RAW,
      code: '123456',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_OTP');
  });

  it('POST /request-otp rejects invalid phone with 400', async () => {
    const response = await request(app).post('/api/auth/request-otp').send({ phone: '12345' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
