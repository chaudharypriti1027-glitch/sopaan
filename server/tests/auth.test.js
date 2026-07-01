import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';
import { withPrivacyConsent } from './helpers/privacy.js';

const TEST_PHONE = '+919876543210';

describe('Auth API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('signs up a new user and returns tokens', async () => {
    const response = await request(app).post('/api/auth/signup').send(withPrivacyConsent({
      name: 'Asha Kumar',
      phone: TEST_PHONE,
      email: 'asha@example.com',
      password: 'Password123!',
    }));

    expect(response.status).toBe(201);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      name: 'Asha Kumar',
      email: 'asha@example.com',
    });
  });

  it('signs up with email only (no phone)', async () => {
    const payload = withPrivacyConsent({
      name: 'Email Only User',
      email: 'emailonly@example.com',
      password: 'Password123!',
    });
    delete payload.phone;

    const response = await request(app).post('/api/auth/signup').send(payload);

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      name: 'Email Only User',
      email: 'emailonly@example.com',
    });
    expect(response.body.user.phone).toBeFalsy();
  });

  it('logs in with phone and password and returns AuthResult', async () => {
    await request(app).post('/api/auth/signup').send(withPrivacyConsent({
      name: 'Ravi Singh',
      phone: '+919876543211',
      email: 'ravi@example.com',
      password: 'Password123!',
    }));

    const response = await request(app).post('/api/auth/login').send({
      phone: '9876543211',
      password: 'Password123!',
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));
    expect(response.body.isNewUser).toBe(false);
    expect(response.body.profile.phone).toBe('+919876543211');
  });

  it('rejects invalid login credentials', async () => {
    await request(app).post('/api/auth/signup').send(withPrivacyConsent({
      name: 'Ravi Singh',
      phone: '+919876543211',
      email: 'ravi@example.com',
      password: 'Password123!',
    }));

    const response = await request(app).post('/api/auth/login').send({
      phone: '+919876543211',
      password: 'wrong-password',
    });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('logs in with email and password', async () => {
    await request(app).post('/api/auth/signup').send(withPrivacyConsent({
      name: 'Email User',
      phone: '+919876543214',
      email: 'email-login@example.com',
      password: 'Password123!',
    }));

    const response = await request(app).post('/api/auth/login').send({
      email: 'email-login@example.com',
      password: 'Password123!',
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.profile.email).toBe('email-login@example.com');
  });

  it('refreshes an access token', async () => {
    const signup = await request(app).post('/api/auth/signup').send(withPrivacyConsent({
      name: 'Token User',
      phone: '+919876543212',
      email: 'token@example.com',
      password: 'Password123!',
    }));

    const response = await request(app).post('/api/auth/refresh').send({
      refreshToken: signup.body.refreshToken,
    });

    expect(response.status).toBe(200);
    expect(response.body.token ?? response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));
    expect(response.body.user.email).toBe('token@example.com');
  });

  it('returns conflict for duplicate email signup', async () => {
    const payload = withPrivacyConsent({
      name: 'Duplicate User',
      phone: '+919876543213',
      email: 'dup@example.com',
      password: 'Password123!',
    });

    await request(app).post('/api/auth/signup').send(payload);
    const response = await request(app).post('/api/auth/signup').send(payload);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('CONFLICT');
  });
});
