import { describe, expect, it } from '@jest/globals';
import { e2eConfig } from '../src/config/e2eConfig.js';
import { stubDoubtAnswer } from '../src/services/ai/e2eStubs.js';

describe('E2E stubs', () => {
  it('exports e2e config shape', () => {
    expect(typeof e2eConfig.enabled).toBe('boolean');
    expect(typeof e2eConfig.stubAi).toBe('boolean');
  });

  it('returns stub doubt answers without calling Claude', () => {
    const result = stubDoubtAnswer('What is GDP?');
    expect(result.explanation).toContain('Local dev stub');
    expect(result.fromCache).toBe(false);
  });
});
