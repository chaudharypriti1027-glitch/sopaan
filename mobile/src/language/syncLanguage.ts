import { I18nManager } from 'react-native';
import { setAppLanguage } from '../api/language';
import { changeAppLocale, getCurrentLocale } from '../i18n';
import type { AppLanguage } from './types';
import { isAppLocale, RTL_LOCALES } from '../i18n/config';
import { saveStoredLanguage } from './languageStorage';

function applyLayoutDirection(locale: AppLanguage) {
  const shouldUseRtl = RTL_LOCALES.includes(locale);
  if (I18nManager.isRTL !== shouldUseRtl) {
    I18nManager.allowRTL(shouldUseRtl);
    I18nManager.forceRTL(shouldUseRtl);
  }
}

export async function applyAppLanguage(locale: AppLanguage): Promise<void> {
  setAppLanguage(locale);
  applyLayoutDirection(locale);
  await changeAppLocale(locale);
  await saveStoredLanguage(locale);
}

export async function syncLanguageFromProfile(
  profileLanguage: string | null | undefined,
): Promise<AppLanguage | null> {
  if (!isAppLocale(profileLanguage)) {
    return null;
  }

  if (getCurrentLocale() === profileLanguage) {
    setAppLanguage(profileLanguage);
    return profileLanguage;
  }

  await applyAppLanguage(profileLanguage);
  return profileLanguage;
}
