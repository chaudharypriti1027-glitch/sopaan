import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppLocale } from './config';
import {
  formatCurrencyPaise,
  formatDate,
  formatNumber,
  formatOrdinal,
  formatPercent,
  formatRelativeDay,
} from './format';

export function useFormat() {
  const { i18n } = useTranslation();
  const locale = (i18n.language?.split('-')[0] ?? 'en') as AppLocale;

  return {
    locale,
    formatNumber: useCallback(
      (value: number, options?: Intl.NumberFormatOptions) => formatNumber(value, locale, options),
      [locale],
    ),
    formatPercent: useCallback(
      (value: number, digits?: number) => formatPercent(value, locale, digits),
      [locale],
    ),
    formatDate: useCallback(
      (value: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
        formatDate(value, locale, options),
      [locale],
    ),
    formatRelativeDay: useCallback(
      (value: Date | string) => formatRelativeDay(value, locale),
      [locale],
    ),
    formatCurrencyPaise: useCallback(
      (paise: number) => formatCurrencyPaise(paise, locale),
      [locale],
    ),
    formatOrdinal: useCallback((value: number) => formatOrdinal(value, locale), [locale]),
  };
}
