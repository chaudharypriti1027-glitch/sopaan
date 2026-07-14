import { percentScore } from '../score';
import { describe, expect, it } from '@jest/globals';

describe('score helpers', () => {
  it('computes percentage scores', () => {
    expect(percentScore(3, 5)).toBe(60);
    expect(percentScore(5, 5)).toBe(100);
    expect(percentScore(0, 0)).toBe(0);
  });
});
