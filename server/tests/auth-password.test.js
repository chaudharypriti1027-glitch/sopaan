import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';

const PHONE = '+919876543210';

describe('Auth password API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('rejects password login when user has no passwordHash', async () => {
    await User.create({ name: 'OTP User', phone: PHONE, onboardingComplete: false });

    const response = await request(app).post('/api/auth/login').send({
      phone: '9876543210',
      password: 'Password123!',
    });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('POST /set-password lets an authenticated user add a password', async () => {
    const user = await User.create({ name: 'OTP User', phone: PHONE, onboardingComplete: false });
    const { signAccessToken } = await import('../src/utils/jwt.js');
    const token = signAccessToken(user);

    const setResponse = await request(app)
      .post('/api/auth/set-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'Password123!' });

    expect(setResponse.status).toBe(200);
    expect(setResponse.body.message).toBe('Password set successfully');

    const loginResponse = await request(app).post('/api/auth/login').send({
      phone: PHONE,
      password: 'Password123!',
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.isNewUser).toBe(false);
    expect(loginResponse.body.profile.phone).toBe(PHONE);
  });

  it('POST /set-password rejects weak passwords', async () => {
    const user = await User.create({ name: 'OTP User', phone: PHONE, onboardingComplete: false });
    const { signAccessToken } = await import('../src/utils/jwt.js');
    const token = signAccessToken(user);

    const response = await request(app)
      .post('/api/auth/set-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
