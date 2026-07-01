import { isStrongPassword, PASSWORD_RULES } from '../passwordPolicy';

describe('passwordPolicy', () => {
  it('accepts a password with upper, lower, number, and symbol', () => {
    expect(isStrongPassword('Kuldip@1')).toBe(true);
  });

  it('rejects password without symbol', () => {
    expect(isStrongPassword('Kuldip12')).toBe(false);
  });

  it('rejects password without uppercase', () => {
    expect(isStrongPassword('kuldip@1')).toBe(false);
  });

  it('has five rules', () => {
    expect(PASSWORD_RULES).toHaveLength(5);
  });
});
