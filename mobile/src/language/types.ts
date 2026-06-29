import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type AppLocale } from '../i18n/config';

export type AppLanguage = AppLocale;

export { SUPPORTED_LOCALES as APP_LANGUAGES, DEFAULT_LOCALE as DEFAULT_APP_LANGUAGE };

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  en: 'English',
  hi: 'हिंदी',
  gu: 'ગુજરાતી',
};
