import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { normalizeUserRole } from '../constants/userRoles.js';
import { isAccountSuspended } from '../utils/accountAuthPolicy.js';

const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY = '30d';
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const TOKEN_HASH_ROUNDS = 10;

async function resolveUserRole(userId) {
  const user = await User.findById(userId).select('role accountStatus').lean();

  if (!user || user.accountStatus === 'deleted') {
    throw new AppError('User not found', 401, 'UNAUTHORIZED');
  }

  if (isAccountSuspended(user)) {
    throw new AppError('Account suspended', 403, 'ACCOUNT_SUSPENDED');
  }

  return user.role ? normalizeUserRole(user.role) : 'student';
}

function accessPayload(userId, role) {
  return {
    sub: String(userId),
    role: normalizeUserRole(role ?? 'student'),
  };
}

/** Short-lived access JWT (15 minutes). */
export function signAccess(userId, role = 'student') {
  return jwt.sign(accessPayload(userId, role), env.jwtSecret, {
    expiresIn: ACCESS_EXPIRY,
  });
}

/**
 * Long-lived refresh JWT (30 days) persisted as a hashed Session row.
 * @returns {Promise<{ refreshToken: string, jti: string, familyId: string }>}
 */
export async function signRefresh(userId, { role, familyId } = {}) {
  const resolvedRole = role ?? (await resolveUserRole(userId));
  const jti = crypto.randomUUID();
  const fid = familyId ?? crypto.randomUUID();

  const refreshToken = jwt.sign(
    {
      ...accessPayload(userId, resolvedRole),
      jti,
      fid,
    },
    env.jwtRefreshSecret,
    { expiresIn: REFRESH_EXPIRY },
  );

  const tokenHash = await bcrypt.hash(refreshToken, TOKEN_HASH_ROUNDS);

  await Session.create({
    userId,
    jti,
    familyId: fid,
    tokenHash,
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    status: 'active',
  });

  return { refreshToken, jti, familyId: fid };
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    throw new AppError('Invalid or expired access token', 401, 'UNAUTHORIZED');
  }
}

export function decodeRefreshToken(token) {
  return jwt.decode(token);
}

/** Issue a fresh access + refresh pair for a user. */
export async function issueTokenPair(userId, { role, familyId } = {}) {
  const resolvedRole = role ?? (await resolveUserRole(userId));
  const accessToken = signAccess(userId, resolvedRole);
  const { refreshToken } = await signRefresh(userId, { role: resolvedRole, familyId });

  return { accessToken, refreshToken };
}

/**
 * Validate refresh JWT + Session, rotate refresh, return new tokens.
 * @returns {Promise<{ accessToken: string, refreshToken: string, userId: string }>}
 */
export async function rotateRefresh(refreshToken) {
  let payload;

  try {
    payload = jwt.verify(refreshToken, env.jwtRefreshSecret);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401, 'UNAUTHORIZED');
  }

  if (!payload?.jti || !payload?.sub) {
    throw new AppError('Invalid or expired refresh token', 401, 'UNAUTHORIZED');
  }

  const session = await Session.findOne({ jti: payload.jti }).select('+tokenHash');

  if (!session || session.expiresAt <= new Date()) {
    throw new AppError('Invalid or expired refresh token', 401, 'UNAUTHORIZED');
  }

  if (session.status === 'revoked') {
    await Session.updateMany(
      { familyId: session.familyId, status: 'active' },
      { status: 'revoked', revokedAt: new Date() },
    );
    throw new AppError('Refresh token reuse detected', 401, 'TOKEN_REUSE');
  }

  const matches = await bcrypt.compare(refreshToken, session.tokenHash);

  if (!matches) {
    throw new AppError('Invalid or expired refresh token', 401, 'UNAUTHORIZED');
  }

  session.status = 'revoked';
  session.revokedAt = new Date();
  await session.save();

  const accessToken = signAccess(payload.sub, payload.role);
  const { refreshToken: nextRefreshToken } = await signRefresh(payload.sub, {
    role: payload.role,
    familyId: session.familyId,
  });

  return {
    accessToken,
    refreshToken: nextRefreshToken,
    userId: payload.sub,
  };
}

/** Revoke a single refresh token session. */
export async function revokeRefresh(refreshToken) {
  const payload = decodeRefreshToken(refreshToken);

  if (!payload?.jti) {
    return false;
  }

  const result = await Session.findOneAndUpdate(
    { jti: payload.jti, status: 'active' },
    { status: 'revoked', revokedAt: new Date() },
  );

  return Boolean(result);
}

/** Revoke all active refresh sessions for a user (logout everywhere). */
export async function revokeAllSessions(userId) {
  await Session.updateMany(
    { userId, status: 'active' },
    { status: 'revoked', revokedAt: new Date() },
  );
}

export function resetSessionsForTests() {
  return Session.deleteMany({});
}
