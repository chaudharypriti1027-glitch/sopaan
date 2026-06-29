import { DEFAULT_LANGUAGE, isSupportedLanguage } from '../constants/languages.js';

/**
 * Resolve content/AI language from query, header, authenticated profile, or default.
 */
export function resolveLanguage({
  queryLanguage,
  headerLanguage,
  profileLanguage,
  fallback = DEFAULT_LANGUAGE,
} = {}) {
  for (const candidate of [queryLanguage, headerLanguage, profileLanguage]) {
    if (typeof candidate === 'string' && isSupportedLanguage(candidate)) {
      return candidate;
    }
  }
  return fallback;
}

export function resolveLanguageFromRequest(req, profileLanguage) {
  return resolveLanguage({
    queryLanguage: req.query?.language,
    headerLanguage: req.get('x-app-language'),
    profileLanguage,
  });
}

export function buildContentLanguageQuery(language) {
  if (!language || language === DEFAULT_LANGUAGE) {
    return { $or: [{ language: 'en' }, { language: { $exists: false } }, { language: null }] };
  }
  return { language };
}
