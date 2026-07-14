const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})/;

/** Parse YYYY-MM-DD (or ISO string) as a local calendar date — avoids UTC timezone shifts. */
export function parseExamDate(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const match = ISO_DATE_RE.exec(value);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const local = new Date(year, month - 1, day, 12, 0, 0, 0);
    return Number.isNaN(local.getTime()) ? null : local;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toExamDatePayload(date: Date | null): string | null {
  if (!date) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function defaultExamDatePickerValue(existing?: Date | null): Date {
  if (existing) {
    return new Date(
      existing.getFullYear(),
      existing.getMonth(),
      existing.getDate(),
      12,
      0,
      0,
      0,
    );
  }

  const fallback = new Date();
  fallback.setMonth(fallback.getMonth() + 6);
  fallback.setHours(12, 0, 0, 0);
  return fallback;
}

export function startOfToday(): Date {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return today;
}

export function formatExamDateLabel(
  date: Date | null,
  optionalLabel: string,
  formatDate: (value: Date, options?: Intl.DateTimeFormatOptions) => string,
) {
  if (!date) {
    return optionalLabel;
  }

  return formatDate(date, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
