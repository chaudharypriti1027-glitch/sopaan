import * as SecureStore from 'expo-secure-store';
import { DEFAULT_LOCALE, isAppLocale } from '../i18n/config';
import type { AppLanguage } from './types';

const LANGUAGE_KEY = 'sopaan_app_language';

export async function loadStoredLanguage(): Promise<AppLanguage> {
  const raw = await SecureStore.getItemAsync(LANGUAGE_KEY);
  return isAppLocale(raw) ? raw : DEFAULT_LOCALE;
}

export async function saveStoredLanguage(language: AppLanguage): Promise<void> {
  await SecureStore.setItemAsync(LANGUAGE_KEY, language);
}
