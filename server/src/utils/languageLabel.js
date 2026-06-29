import { DEFAULT_LANGUAGE } from '../constants/languages.js';

const LANGUAGE_LABELS = Object.freeze({
  en: 'English',
  hi: 'Hindi',
});

/** Human-readable label for AI prompt suffixes. */
export function languageLabel(code = DEFAULT_LANGUAGE) {
  return LANGUAGE_LABELS[code] ?? LANGUAGE_LABELS.en;
}

export function languageSuffix(code = DEFAULT_LANGUAGE) {
  const label = languageLabel(code);
  return `Language for all question text, options, and explanations: ${label}.`;
}

export function respondInLanguageSuffix(code = DEFAULT_LANGUAGE) {
  return `Respond in ${languageLabel(code)}.`;
}
