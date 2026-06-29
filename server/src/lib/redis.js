import Redis from 'ioredis';
import { redisConfig } from '../config/redisConfig.js';
import { logger } from '../observability/logger.js';

let client = null;
let ready = false;

export function isRedisReady() {
  return ready && client?.status === 'ready';
}

export function getRedisClient() {
  return client;
}

export function getBullMqConnection() {
  if (!redisConfig.url || redisConfig.disabled) {
    return null;
  }

  return {
    host: redisConfig.host,
    port: redisConfig.port,
    password: redisConfig.password,
    db: redisConfig.db,
    maxRetriesPerRequest: null,
  };
}

export async function connectRedis() {
  if (redisConfig.disabled || !redisConfig.url) {
    logger.info('redis disabled or REDIS_URL unset — using in-memory fallbacks');
    return null;
  }

  if (client) {
    return client;
  }

  client = new Redis(redisConfig.url, {
    keyPrefix: redisConfig.keyPrefix,
    connectTimeout: redisConfig.connectTimeoutMs,
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });

  client.on('error', (err) => {
    logger.warn('redis connection error', { message: err.message });
    ready = false;
  });

  client.on('ready', () => {
    ready = true;
  });

  await client.connect();
  ready = true;
  logger.info('redis connected', { host: redisConfig.host, port: redisConfig.port });
  return client;
}

export async function disconnectRedis() {
  if (!client) {
    return;
  }

  ready = false;
  await client.quit();
  client = null;
}
