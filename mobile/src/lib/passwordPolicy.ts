export type PasswordRuleId = 'length' | 'upper' | 'lower' | 'digit' | 'symbol';

export type PasswordRule = {
  id: PasswordRuleId;
  test: (password: string) => boolean;
  labelKey: `passwordRules.${PasswordRuleId}`;
};

export const PASSWORD_RULES: PasswordRule[] = [
  { id: 'length', test: (p) => p.length >= 8, labelKey: 'passwordRules.length' },
  { id: 'upper', test: (p) => /[A-Z]/.test(p), labelKey: 'passwordRules.upper' },
  { id: 'lower', test: (p) => /[a-z]/.test(p), labelKey: 'passwordRules.lower' },
  { id: 'digit', test: (p) => /[0-9]/.test(p), labelKey: 'passwordRules.digit' },
  { id: 'symbol', test: (p) => /[^A-Za-z0-9]/.test(p), labelKey: 'passwordRules.symbol' },
];

export function isStrongPassword(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

export function firstFailedPasswordRule(password: string): PasswordRule | undefined {
  return PASSWORD_RULES.find((rule) => !rule.test(password));
}
