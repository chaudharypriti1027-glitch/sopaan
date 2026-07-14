import {
  AUTH_BRAND_VALUES,
  AUTH_HERO_VARIANTS,
  WELCOME_FEATURES,
} from '../authBrandContent';

describe('authBrandContent', () => {
  it('defines shared brand value chips', () => {
    expect(AUTH_BRAND_VALUES).toHaveLength(3);
    expect(AUTH_BRAND_VALUES.map((item) => item.labelKey)).toEqual([
      'brand.valueAi',
      'brand.valueGames',
      'brand.valueCoach',
    ]);
  });

  it('maps every auth hero variant to i18n keys', () => {
    const variants = Object.keys(AUTH_HERO_VARIANTS);
    expect(variants).toEqual(
      expect.arrayContaining(['welcome', 'login', 'otp', 'verify', 'signup', 'profile']),
    );

    for (const variant of variants) {
      const config = AUTH_HERO_VARIANTS[variant as keyof typeof AUTH_HERO_VARIANTS];
      expect(config.badgeKey.startsWith('brand.') || config.badgeKey.includes('.')).toBe(true);
      expect(config.subtitleKey.length).toBeGreaterThan(0);
      expect(config.testID.length).toBeGreaterThan(0);
      expect(typeof config.showMotivation).toBe('boolean');
    }
  });

  it('lists four welcome feature cards', () => {
    expect(WELCOME_FEATURES).toHaveLength(4);
    expect(WELCOME_FEATURES.map((item) => item.key)).toEqual([
      'ai',
      'games',
      'streak',
      'offline',
    ]);
  });
});
