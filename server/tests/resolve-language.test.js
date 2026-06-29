import {
  buildContentLanguageQuery,
  resolveLanguage,
  resolveLanguageFromRequest,
} from '../src/utils/resolveLanguage.js';

describe('resolveLanguage', () => {
  it('prefers query over header and profile', () => {
    expect(
      resolveLanguage({
        queryLanguage: 'hi',
        headerLanguage: 'en',
        profileLanguage: 'en',
      }),
    ).toBe('hi');
  });

  it('falls back to header then profile', () => {
    expect(resolveLanguage({ headerLanguage: 'hi', profileLanguage: 'en' })).toBe('hi');
    expect(resolveLanguage({ profileLanguage: 'hi' })).toBe('hi');
  });

  it('defaults to en for unsupported values', () => {
    expect(resolveLanguage({ queryLanguage: 'fr' })).toBe('en');
  });
});

describe('resolveLanguageFromRequest', () => {
  it('reads query and x-app-language header', () => {
    const req = {
      query: { language: 'hi' },
      get: (name) => (name === 'x-app-language' ? 'en' : undefined),
    };

    expect(resolveLanguageFromRequest(req)).toBe('hi');
    expect(resolveLanguageFromRequest({ query: {}, get: () => 'hi' })).toBe('hi');
  });
});

describe('buildContentLanguageQuery', () => {
  it('includes legacy English content when locale is en', () => {
    expect(buildContentLanguageQuery('en')).toEqual({
      $or: [{ language: 'en' }, { language: { $exists: false } }, { language: null }],
    });
  });

  it('filters strictly for non-default locales', () => {
    expect(buildContentLanguageQuery('hi')).toEqual({ language: 'hi' });
  });
});
