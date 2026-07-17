import { describe, expect, it } from '@jest/globals';
import {
  ASK_AI_INSTANT_MS,
  ASK_AI_PROMPTS,
  ASK_AI_TABS,
  getAskAiPromptsForExam,
  resolveAskAiExamFamily,
} from '../askAiContent';

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

  it('resolves target exams to the matching family', () => {
    expect(resolveAskAiExamFamily('SSC CGL')).toBe('ssc');
    expect(resolveAskAiExamFamily('IBPS PO')).toBe('banking');
    expect(resolveAskAiExamFamily('RRB NTPC')).toBe('railway');
    expect(resolveAskAiExamFamily('CDS')).toBe('defence');
    expect(resolveAskAiExamFamily('CTET')).toBe('teaching');
    expect(resolveAskAiExamFamily('UPSC CSE')).toBe('upsc');
    expect(resolveAskAiExamFamily('MPPSC')).toBe('state_psc');
    expect(resolveAskAiExamFamily('Police Constable')).toBe('police');
    expect(resolveAskAiExamFamily('')).toBe('general');
    expect(resolveAskAiExamFamily(null)).toBe('general');
  });

  it('returns family-specific prompts instead of the generic set', () => {
    const ssc = getAskAiPromptsForExam('SSC CHSL');
    expect(ssc.every((p) => p.key.startsWith('examPrompts.ssc.'))).toBe(true);

    const banking = getAskAiPromptsForExam('SBI Clerk');
    expect(banking.every((p) => p.key.startsWith('examPrompts.banking.'))).toBe(true);

    const general = getAskAiPromptsForExam('');
    expect(general.map((p) => p.key)).toEqual(['prompt1', 'prompt2', 'prompt3']);
  });
});
