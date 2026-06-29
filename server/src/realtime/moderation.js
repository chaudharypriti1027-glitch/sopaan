const PROFANITY = [
  'damn',
  'hell',
  'shit',
  'fuck',
  'bitch',
  'asshole',
  'bastard',
  'dick',
  'crap',
];

const WINDOW_MS = 30_000;
const MAX_MESSAGES_PER_WINDOW = 12;
const MAX_MESSAGE_LENGTH = 500;

const rateBuckets = new Map();

export function sanitizeChatMessage(text) {
  const trimmed = text.trim();

  if (!trimmed) {
    return { ok: false, code: 'EMPTY_MESSAGE', message: 'Message cannot be empty' };
  }

  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return {
      ok: false,
      code: 'MESSAGE_TOO_LONG',
      message: `Message must be at most ${MAX_MESSAGE_LENGTH} characters`,
    };
  }

  let filtered = trimmed;

  for (const word of PROFANITY) {
    const pattern = new RegExp(`\\b${word}\\b`, 'gi');
    filtered = filtered.replace(pattern, '*'.repeat(Math.min(word.length, 4)));
  }

  return { ok: true, text: filtered };
}

export function checkChatRateLimit(userId) {
  const now = Date.now();
  const bucket = rateBuckets.get(userId) ?? { count: 0, resetAt: now + WINDOW_MS };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + WINDOW_MS;
  }

  bucket.count += 1;
  rateBuckets.set(userId, bucket);

  if (bucket.count > MAX_MESSAGES_PER_WINDOW) {
    return {
      ok: false,
      code: 'RATE_LIMITED',
      message: 'You are sending messages too quickly. Please slow down.',
    };
  }

  return { ok: true };
}

export function resetChatModerationForTests() {
  rateBuckets.clear();
}
