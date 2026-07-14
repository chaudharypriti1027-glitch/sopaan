import { describe, expect, it } from '@jest/globals';
import { ASK_AI_INSTANT_MS, ASK_AI_PROMPTS, ASK_AI_TABS } from '../askAiContent';

describe('askAiContent', () => {
  it('lists four starter prompts with unique keys', () => {
    const keys = ASK_AI_PROMPTS.map((entry) => entry.key);
    expect(keys).toEqual(['prompt1', 'prompt2', 'prompt3', 'prompt4']);
    expect(new Set(keys).size).toBe(4);
  });

  it('defines ask and evaluate tabs', () => {
    expect(ASK_AI_TABS).toEqual(['ask', 'evaluate']);
  });

  it('uses a sensible instant-answer threshold', () => {
    expect(ASK_AI_INSTANT_MS).toBeGreaterThan(500);
    expect(ASK_AI_INSTANT_MS).toBeLessThan(10_000);
  });
});
