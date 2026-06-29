import type { AppLocale } from './config';
import { LOCALE_INTL } from './config';

export function getIntlLocale(locale: AppLocale): string {
  return LOCALE_INTL[locale] ?? LOCALE_INTL.en;
}

export function formatNumber(value: number, locale: AppLocale, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(getIntlLocale(locale), options).format(value);
}

export function formatPercent(value: number, locale: AppLocale, digits = 0): string {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: 'percent',
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value / 100);
}

export function formatDate(
  value: Date | string | number,
  locale: AppLocale,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(getIntlLocale(locale), options).format(date);
}

export function formatRelativeDay(value: Date | string, locale: AppLocale): string {
  return formatDate(value, locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatCurrencyPaise(paise: number, locale: AppLocale): string {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

const EN_ORDINAL_SUFFIX: Record<Intl.LDMLPluralRule, string> = {
  zero: 'th',
  one: 'st',
  two: 'nd',
  few: 'rd',
  many: 'th',
  other: 'th',
};

/** Locale-aware ordinal suffix for ranks/percentiles (e.g. 1st, 2nd, 85वां). */
export function formatOrdinal(value: number, locale: AppLocale): string {
  const n = Math.round(value);
  const intlLocale = getIntlLocale(locale);

  if (locale === 'hi') {
    return `${formatNumber(n, locale)}वां`;
  }

  const rule = new Intl.PluralRules(intlLocale, { type: 'ordinal' }).select(n);
  return `${n}${EN_ORDINAL_SUFFIX[rule]}`;
}
