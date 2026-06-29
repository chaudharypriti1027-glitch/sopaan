/** Supported app locales — add a folder under locales/ and register in resources.ts. */
export const SUPPORTED_LOCALES = ['en', 'hi', 'gu'] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

/** Locales that require RTL layout (Hindi uses LTR). */
export const RTL_LOCALES: readonly AppLocale[] = [];

export const DEFAULT_LOCALE: AppLocale = 'en';

export const LOCALE_INTL: Record<AppLocale, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  gu: 'gu-IN',
};

export const NAMESPACE_LIST = [
  'common',
  'navigation',
  'auth',
  'tabs',
  'settings',
  'app',
  'release',
] as const;

export type AppNamespace = (typeof NAMESPACE_LIST)[number];

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return SUPPORTED_LOCALES.includes(value as AppLocale);
}
