import crypto from 'crypto';
import { isRedisReady, getRedisClient } from './redis.js';

const MAX_MEMORY_CACHE_ENTRIES = 1000;

/** @type {Map<string, { value: unknown, expiresAt: number }>} */
const memoryCache = new Map();

function memoryCacheGet(key) {
  const entry = memoryCache.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }

  return entry.value;
}

function memoryCacheSet(key, value, ttlSec) {
  if (ttlSec <= 0) {
    return;
  }

  if (memoryCache.size >= MAX_MEMORY_CACHE_ENTRIES) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) {
      memoryCache.delete(oldestKey);
    }
  }

  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSec * 1000,
  });
}

function memoryCacheDel(key) {
  memoryCache.delete(key);
}

function memoryCacheInvalidatePrefix(prefix) {
  let deleted = 0;

  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
      deleted += 1;
    }
  }

  return deleted;
}

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
  if (isRedisReady()) {
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

  return memoryCacheGet(key);
}

export async function cacheSet(key, value, ttlSec) {
  if (ttlSec <= 0) {
    return false;
  }

  if (isRedisReady()) {
    await getRedisClient().set(key, JSON.stringify(value), 'EX', ttlSec);
    return true;
  }

  memoryCacheSet(key, value, ttlSec);
  return true;
}

export async function cacheDel(key) {
  memoryCacheDel(key);

  if (!isRedisReady()) {
    return true;
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
  let deleted = memoryCacheInvalidatePrefix(prefix);

  if (!isRedisReady()) {
    return deleted;
  }

  const redis = getRedisClient();
  let cursor = '0';

  do {
    const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
    cursor = nextCursor;

    if (keys.length > 0) {
      deleted += await redis.del(...keys);
    }
  } while (cursor !== '0');

  return deleted;
}
