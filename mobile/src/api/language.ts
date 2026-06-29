import type { AppLanguage } from '../language/types';

let currentLanguage: AppLanguage = 'en';

export function getAppLanguage(): AppLanguage {
  return currentLanguage;
}

export function setAppLanguage(language: AppLanguage): void {
  currentLanguage = language;
}

export function withLanguageParams<T extends Record<string, unknown>>(
  params?: T,
): T & { language: AppLanguage } {
  return {
    ...(params ?? ({} as T)),
    language: getAppLanguage(),
  };
}
