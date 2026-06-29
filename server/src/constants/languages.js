/** Supported UI + content language codes (keep in sync with mobile/src/i18n/config.ts). */
export const SUPPORTED_LANGUAGES = Object.freeze(['en', 'hi', 'gu']);

export const DEFAULT_LANGUAGE = 'en';

export function isSupportedLanguage(value) {
  return SUPPORTED_LANGUAGES.includes(value);
}
