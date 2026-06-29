import crypto from 'crypto';
import { isRedisReady, getRedisClient } from './redis.js';

export function stableCacheKey(prefix, payload = {}) {
  const sorted = Object.keys(payload)
    .sort()
    .reduce((acc, key) => {
      acc[key] = payload[key];
      return acc;
    }, {});

  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(sorted))
    .digest('hex')
    .slice(0, 16);

  return `${prefix}:${hash}`;
}

export async function cacheGet(key) {
  if (!isRedisReady()) {
    return null;
  }

  const raw = await getRedisClient().get(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function cacheSet(key, value, ttlSec) {
  if (!isRedisReady() || ttlSec <= 0) {
    return false;
  }

  await getRedisClient().set(key, JSON.stringify(value), 'EX', ttlSec);
  return true;
}

export async function cacheDel(key) {
  if (!isRedisReady()) {
    return false;
  }

  await getRedisClient().del(key);
  return true;
}

export async function cacheGetOrSet(key, ttlSec, factory) {
  const cached = await cacheGet(key);

  if (cached !== null) {
    return cached;
  }

  const value = await factory();
  await cacheSet(key, value, ttlSec);
  return value;
}

export async function cacheInvalidatePrefix(prefix) {
  if (!isRedisReady()) {
    return 0;
  }

  const redis = getRedisClient();
  let cursor = '0';
  let deleted = 0;

  do {
    const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
    cursor = nextCursor;

    if (keys.length > 0) {
      deleted += await redis.del(...keys);
    }
  } while (cursor !== '0');

  return deleted;
}
