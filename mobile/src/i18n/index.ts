import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LOCALE, NAMESPACE_LIST, type AppLocale } from './config';
import { enResources } from './locales/en';
import { hiResources } from './locales/hi';
import { guResources } from './locales/gu';

void i18n.use(initReactI18next).init({
  resources: {
    en: enResources,
    hi: hiResources,
    gu: guResources,
  },
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  defaultNS: 'common',
  ns: [...NAMESPACE_LIST],
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
  returnNull: false,
});

export default i18n;

export async function changeAppLocale(locale: AppLocale): Promise<void> {
  await i18n.changeLanguage(locale);
}

export function getCurrentLocale(): AppLocale {
  return (i18n.language?.split('-')[0] as AppLocale) ?? DEFAULT_LOCALE;
}
