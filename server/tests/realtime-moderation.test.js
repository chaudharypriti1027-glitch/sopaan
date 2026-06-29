import { describe, expect, it, beforeEach } from '@jest/globals';
import {
  checkChatRateLimit,
  resetChatModerationForTests,
  sanitizeChatMessage,
} from '../src/realtime/moderation.js';

describe('chat moderation', () => {
  beforeEach(() => {
    resetChatModerationForTests();
  });

  it('filters profanity from messages', () => {
    const result = sanitizeChatMessage('What the hell is this answer?');
    expect(result.ok).toBe(true);
    expect(result.text).not.toContain('hell');
  });

  it('rate limits rapid chat messages', () => {
    let last;

    for (let i = 0; i < 12; i += 1) {
      last = checkChatRateLimit('user-1');
      expect(last.ok).toBe(true);
    }

    last = checkChatRateLimit('user-1');
    expect(last.ok).toBe(false);
    expect(last.code).toBe('RATE_LIMITED');
  });
});
