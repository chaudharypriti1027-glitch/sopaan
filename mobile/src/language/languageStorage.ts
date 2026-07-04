import { getSecureItem, setSecureItem } from '../lib/secureStorage';
import { DEFAULT_LOCALE, isAppLocale } from '../i18n/config';
import type { AppLanguage } from './types';

const LANGUAGE_KEY = 'sopaan_app_language';

export async function loadStoredLanguage(): Promise<AppLanguage> {
  const raw = await getSecureItem(LANGUAGE_KEY);
  return isAppLocale(raw) ? raw : DEFAULT_LOCALE;
}

export async function saveStoredLanguage(language: AppLanguage): Promise<void> {
  await setSecureItem(LANGUAGE_KEY, language);
}
