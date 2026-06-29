import crypto from 'crypto';
import { AppError } from '../utils/AppError.js';
import { isRedisReady, getRedisClient } from './redis.js';
import { revokeAllUserRefreshTokens } from './tokenDenylist.js';

const SESSION_PREFIX = 'refresh:session:';
const FAMILY_PREFIX = 'refresh:family:revoked:';

const memorySessions = new Map();
const memoryRevokedFamilies = new Set();

function sessionKey(jti) {
  return `${SESSION_PREFIX}${jti}`;
}

function familyKey(familyId) {
  return `${FAMILY_PREFIX}${familyId}`;
}

async function readSession(jti) {
  if (isRedisReady()) {
    const raw = await getRedisClient().get(sessionKey(jti));
    return raw ? JSON.parse(raw) : null;
  }

  const session = memorySessions.get(jti);

  if (!session) {
    return null;
  }

  if (session.expiresAt <= Date.now()) {
    memorySessions.delete(jti);
    return null;
  }

  return session;
}

async function writeSession(jti, payload, ttlSec) {
  if (isRedisReady()) {
    await getRedisClient().set(sessionKey(jti), JSON.stringify(payload), 'EX', ttlSec);
    return;
  }

  memorySessions.set(jti, {
    ...payload,
    expiresAt: Date.now() + ttlSec * 1000,
  });
}

async function isFamilyRevoked(familyId) {
  if (!familyId) {
    return false;
  }

  if (isRedisReady()) {
    return Boolean(await getRedisClient().get(familyKey(familyId)));
  }

  return memoryRevokedFamilies.has(familyId);
}

export async function registerRefreshSession({ jti, userId, familyId, ttlSec }) {
  await writeSession(jti, { userId: String(userId), familyId, status: 'active' }, ttlSec);
}

export async function revokeRefreshFamily(familyId, userId) {
  if (!familyId) {
    return;
  }

  if (isRedisReady()) {
    await getRedisClient().set(familyKey(familyId), '1', 'EX', 30 * 24 * 60 * 60);
  } else {
    memoryRevokedFamilies.add(familyId);
  }

  if (userId) {
    await revokeAllUserRefreshTokens(String(userId));
  }
}

export async function revokeRefreshSessionByJti(jti, ttlSec = 60) {
  const session = await readSession(jti);

  if (!session) {
    return false;
  }

  await writeSession(jti, { ...session, status: 'revoked' }, ttlSec);
  return true;
}

export async function rotateRefreshSession(oldJti, { newJti, ttlSec }) {
  const session = await readSession(oldJti);

  if (!session) {
    throw new AppError('Invalid or expired refresh token', 401, 'UNAUTHORIZED');
  }

  if (session.status === 'revoked') {
    await revokeRefreshFamily(session.familyId, session.userId);
    throw new AppError('Refresh token reuse detected', 401, 'TOKEN_REUSE');
  }

  if (await isFamilyRevoked(session.familyId)) {
    throw new AppError('Refresh token revoked', 401, 'UNAUTHORIZED');
  }

  await writeSession(oldJti, { ...session, status: 'revoked' }, ttlSec);
  await registerRefreshSession({
    jti: newJti,
    userId: session.userId,
    familyId: session.familyId,
    ttlSec,
  });

  return {
    userId: session.userId,
    familyId: session.familyId,
  };
}

export function createTokenFamilyId() {
  return crypto.randomUUID();
}

export function resetRefreshStoreForTests() {
  memorySessions.clear();
  memoryRevokedFamilies.clear();
}
