function parseRedisUrl(url) {
  if (!url) {
    return { host: '127.0.0.1', port: 6379, password: undefined, db: 0 };
  }

  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: Number(parsed.port || 6379),
      password: parsed.password || undefined,
      db: parsed.pathname ? Number(parsed.pathname.slice(1) || 0) : 0,
    };
  } catch {
    return { host: '127.0.0.1', port: 6379, password: undefined, db: 0 };
  }
}

const parsed = parseRedisUrl(process.env.REDIS_URL?.trim());

export const redisConfig = Object.freeze({
  url: process.env.REDIS_URL?.trim() || '',
  disabled: process.env.REDIS_ENABLED === 'false' || process.env.NODE_ENV === 'test',
  ...parsed,
  keyPrefix: process.env.REDIS_KEY_PREFIX?.trim() || 'sopaan:',
  connectTimeoutMs: Number(process.env.REDIS_CONNECT_TIMEOUT_MS ?? 5000),
});
