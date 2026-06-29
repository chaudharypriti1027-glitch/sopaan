import { beforeAll, afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import bcrypt from 'bcrypt';
import { User } from '../src/models/User.js';
import { Session } from '../src/models/Session.js';
import {
  issueTokenPair,
  rotateRefresh,
  revokeRefresh,
  revokeAllSessions,
  signAccess,
  verifyAccessToken,
} from '../src/services/tokens.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from './helpers/db.js';

describe('tokens service', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('signAccess returns a verifiable 15-minute JWT', () => {
    const token = signAccess('507f1f77bcf86cd799439011', 'student');
    const payload = verifyAccessToken(token);

    expect(payload.sub).toBe('507f1f77bcf86cd799439011');
    expect(payload.role).toBe('student');
  });

  it('issueTokenPair persists a hashed refresh session', async () => {
    const user = await User.create({
      name: 'Token User',
      phone: '+919876543210',
    });

    const { accessToken, refreshToken } = await issueTokenPair(user._id, { role: user.role });

    expect(accessToken).toEqual(expect.any(String));
    expect(refreshToken).toEqual(expect.any(String));

    const payload = JSON.parse(Buffer.from(refreshToken.split('.')[1], 'base64url').toString());
    const session = await Session.findOne({ jti: payload.jti }).select('+tokenHash');

    expect(session?.userId.toString()).toBe(user._id.toString());
    expect(session?.status).toBe('active');
    expect(await bcrypt.compare(refreshToken, session.tokenHash)).toBe(true);
  });

  it('rotateRefresh issues new tokens and revokes the old session', async () => {
    const user = await User.create({
      name: 'Rotate User',
      phone: '+919876543211',
    });

    const initial = await issueTokenPair(user._id);
    const rotated = await rotateRefresh(initial.refreshToken);

    expect(rotated.accessToken).toEqual(expect.any(String));
    expect(rotated.refreshToken).not.toBe(initial.refreshToken);
    expect(rotated.userId).toBe(String(user._id));

    await expect(rotateRefresh(initial.refreshToken)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('revokeRefresh and revokeAllSessions mark sessions revoked', async () => {
    const user = await User.create({
      name: 'Logout User',
      phone: '+919876543212',
    });

    const pair = await issueTokenPair(user._id);
    expect(await revokeRefresh(pair.refreshToken)).toBe(true);

    const pair2 = await issueTokenPair(user._id);
    await revokeAllSessions(user._id);

    const activeCount = await Session.countDocuments({ userId: user._id, status: 'active' });
    expect(activeCount).toBe(0);

    await expect(rotateRefresh(pair2.refreshToken)).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});
