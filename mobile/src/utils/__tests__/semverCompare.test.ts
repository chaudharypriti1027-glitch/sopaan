import { describe, expect, it } from '@jest/globals';
import { compareSemver, isVersionLessThan } from '../semverCompare';

describe('semverCompare', () => {
  it('compares patch versions', () => {
    expect(compareSemver('0.1.1', '0.1.0')).toBeGreaterThan(0);
    expect(isVersionLessThan('0.1.0', '0.2.0')).toBe(true);
  });
});
