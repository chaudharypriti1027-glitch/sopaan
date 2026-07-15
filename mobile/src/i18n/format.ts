import type { AppLocale } from './config';
import { LOCALE_INTL } from './config';

/** Fallback shown when a date cannot be parsed or formatted. */
export const INVALID_DATE_FALLBACK = '—';

export function getIntlLocale(locale: AppLocale): string {
  return LOCALE_INTL[locale] ?? LOCALE_INTL.en;
}

/**
 * Normalize API / epoch / ISO date inputs into a valid `Date`.
 * Handles seconds-vs-ms timestamps and rejects unparseable values.
 */
export function parseDate(value: Date | string | number | null | undefined): Date | null {
  if (value == null || value === '') {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return null;
    }
    // Values below 1e12 are almost certainly unix seconds (ms would be year ~2001+).
    const ms = Math.abs(value) < 1e12 ? value * 1000 : value;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
      return null;
    }

    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return parseDate(Number(trimmed));
    }

    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
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
  value: Date | string | number | null | undefined,
  locale: AppLocale,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = parseDate(value);
  if (!date) {
    return INVALID_DATE_FALLBACK;
  }

  try {
    return new Intl.DateTimeFormat(getIntlLocale(locale), options).format(date);
  } catch {
    return INVALID_DATE_FALLBACK;
  }
}

export function formatRelativeDay(
  value: Date | string | number | null | undefined,
  locale: AppLocale,
): string {
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

/** Manual fallback for engines (older Hermes builds) missing `Intl.PluralRules`. */
function englishOrdinalSuffix(n: number): string {
  const mod100 = Math.abs(n) % 100;
  if (mod100 >= 11 && mod100 <= 13) {
    return 'th';
  }
  switch (Math.abs(n) % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

/** Locale-aware ordinal suffix for ranks/percentiles (e.g. 1st, 2nd, 85वां). */
export function formatOrdinal(value: number, locale: AppLocale): string {
  const n = Math.round(value);
  const intlLocale = getIntlLocale(locale);

  if (locale === 'hi') {
    return `${formatNumber(n, locale)}वां`;
  }

  if (typeof Intl.PluralRules !== 'function') {
    return `${n}${englishOrdinalSuffix(n)}`;
  }

  try {
    const rule = new Intl.PluralRules(intlLocale, { type: 'ordinal' }).select(n);
    return `${n}${EN_ORDINAL_SUFFIX[rule]}`;
  } catch {
    return `${n}${englishOrdinalSuffix(n)}`;
  }
}
