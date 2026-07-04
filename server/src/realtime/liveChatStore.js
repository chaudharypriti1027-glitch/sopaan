import { isRedisReady, getRedisClient } from '../lib/redis.js';

const CHAT_MAX_MESSAGES = 50;
const CHAT_TTL_SEC = 24 * 60 * 60;

const memoryStore = new Map();

function chatKey(classId) {
  return `live:chat:${classId}`;
}

function parseMessage(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readMemory(classId) {
  return [...(memoryStore.get(classId) ?? [])];
}

export async function getLiveChatHistory(classId) {
  if (isRedisReady()) {
    const redis = getRedisClient();
    const rows = await redis.lrange(chatKey(classId), 0, -1);
    return rows.map(parseMessage).filter(Boolean);
  }

  return readMemory(classId);
}

export async function appendLiveChatMessage(classId, message) {
  const payload = JSON.stringify(message);

  if (isRedisReady()) {
    const redis = getRedisClient();
    const key = chatKey(classId);
    await redis.rpush(key, payload);
    await redis.ltrim(key, -CHAT_MAX_MESSAGES, -1);
    await redis.expire(key, CHAT_TTL_SEC);
    return message;
  }

  const bucket = memoryStore.get(classId) ?? [];
  bucket.push(message);

  if (bucket.length > CHAT_MAX_MESSAGES) {
    bucket.splice(0, bucket.length - CHAT_MAX_MESSAGES);
  }

  memoryStore.set(classId, bucket);
  return message;
}

export function resetLiveChatStoreForTests() {
  memoryStore.clear();
}

export { CHAT_MAX_MESSAGES };
