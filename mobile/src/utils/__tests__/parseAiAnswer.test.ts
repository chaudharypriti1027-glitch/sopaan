import { historyToChatMessages } from '../../components/ai/historyToChatMessages';
import { describe, expect, it } from '@jest/globals';
import { parseAiAnswer } from '../parseAiAnswer';

describe('parseAiAnswer', () => {
  it('detects formula lines', () => {
    const blocks = parseAiAnswer('Growth formula\n\nA = P × (1 + r/n)^(n·t)');
    expect(blocks.some((block) => block.type === 'formula')).toBe(true);
  });

  it('detects bullet lists', () => {
    const blocks = parseAiAnswer('- First point\n- Second point');
    expect(blocks[0]?.type).toBe('bullet');
  });
});

describe('historyToChatMessages', () => {
  it('maps saved answers into chat pairs', () => {
    const messages = historyToChatMessages([
      {
        id: '1',
        question: 'What is GDP?',
        explanation: 'GDP measures output.',
        language: 'en',
        imageAttached: false,
        createdAt: '2026-06-01T00:00:00.000Z',
        fromCache: true,
        responseMs: 400,
      },
    ]);

    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('user');
    expect(messages[1].role).toBe('assistant');
    expect(messages[1].answerId).toBe('1');
  });
});
