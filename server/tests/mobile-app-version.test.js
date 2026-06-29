import { describe, expect, it } from '@jest/globals';
import { compareSemver, isVersionLessThan } from '../src/utils/semverCompare.js';
import { evaluateMobileVersionRequirements } from '../src/services/mobileAppService.js';

describe('semverCompare', () => {
  it('compares major.minor.patch correctly', () => {
    expect(compareSemver('0.1.0', '0.1.0')).toBe(0);
    expect(compareSemver('0.1.1', '0.1.0')).toBeGreaterThan(0);
    expect(compareSemver('0.0.9', '0.1.0')).toBeLessThan(0);
    expect(compareSemver('1.0.0', '0.9.9')).toBeGreaterThan(0);
  });

  it('ignores pre-release suffixes', () => {
    expect(compareSemver('0.1.0-beta', '0.1.0')).toBe(0);
  });

  it('detects versions below minimum', () => {
    expect(isVersionLessThan('0.0.9', '0.1.0')).toBe(true);
    expect(isVersionLessThan('0.1.0', '0.1.0')).toBe(false);
  });
});

describe('mobile version requirements', () => {
  it('requires force update when native version is below minimum', () => {
    const result = evaluateMobileVersionRequirements({
      platform: 'android',
      nativeVersion: '0.0.1',
    });

    expect(result.forceUpdate).toBe(true);
    expect(result.minNativeVersion).toBeTruthy();
    expect(result.storeUrl).toContain('play.google.com');
  });

  it('allows current versions at or above minimum', () => {
    const result = evaluateMobileVersionRequirements({
      platform: 'ios',
      nativeVersion: '99.0.0',
    });

    expect(result.forceUpdate).toBe(false);
  });
});
