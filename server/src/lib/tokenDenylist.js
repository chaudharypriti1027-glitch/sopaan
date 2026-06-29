import jwt from 'jsonwebtoken';
import { isRedisReady, getRedisClient } from './redis.js';

const KEY_PREFIX = 'deny:refresh:';

function remainingTtlSec(exp) {
  const ttl = exp - Math.floor(Date.now() / 1000);
  return ttl > 0 ? ttl : 0;
}

export async function revokeRefreshToken(token) {
  const payload = jwt.decode(token);

  if (!payload?.jti || !payload?.exp) {
    return false;
  }

  const ttlSec = remainingTtlSec(payload.exp);

  if (ttlSec <= 0 || !isRedisReady()) {
    return false;
  }

  await getRedisClient().set(`${KEY_PREFIX}${payload.jti}`, '1', 'EX', ttlSec);
  return true;
}

export async function isRefreshTokenRevoked(jti) {
  if (!jti || !isRedisReady()) {
    return false;
  }

  const value = await getRedisClient().get(`${KEY_PREFIX}${jti}`);
  return value === '1';
}

export async function revokeAllUserRefreshTokens(userId) {
  if (!userId || !isRedisReady()) {
    return false;
  }

  await getRedisClient().set(`${KEY_PREFIX}user:${userId}`, String(Date.now()), 'EX', 30 * 24 * 60 * 60);
  return true;
}

export async function isUserRefreshRevoked(userId, tokenIssuedAtSec) {
  if (!userId || !tokenIssuedAtSec || !isRedisReady()) {
    return false;
  }

  const revokedAt = await getRedisClient().get(`${KEY_PREFIX}user:${userId}`);

  if (!revokedAt) {
    return false;
  }

  return tokenIssuedAtSec * 1000 <= Number(revokedAt);
}
