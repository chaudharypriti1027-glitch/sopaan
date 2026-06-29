/** IST (Asia/Kolkata) date helpers for home feed and scheduling. */

export const IST_TIMEZONE = 'Asia/Kolkata';

const istDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: IST_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const istLabelFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST_TIMEZONE,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

const istLongLabelFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST_TIMEZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const istHourFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST_TIMEZONE,
  hour: 'numeric',
  hour12: false,
});

/** YYYY-MM-DD in IST for the given instant. */
export function toIstDateKey(date = new Date()) {
  return istDateFormatter.format(date);
}

/** Start of calendar day in IST as a UTC Date. */
export function startOfIstDay(date = new Date()) {
  const key = toIstDateKey(date);
  return new Date(`${key}T00:00:00+05:30`);
}

/** End of calendar day in IST as a UTC Date. */
export function endOfIstDay(date = new Date()) {
  const key = toIstDateKey(date);
  return new Date(`${key}T23:59:59.999+05:30`);
}

export function isSameIstDay(left, right) {
  if (!left || !right) {
    return false;
  }

  return toIstDateKey(new Date(left)) === toIstDateKey(new Date(right));
}

export function isYesterdayIst(date, now = new Date()) {
  if (!date) {
    return false;
  }

  const yesterdayStart = new Date(startOfIstDay(now).getTime() - 24 * 60 * 60 * 1000);
  return toIstDateKey(new Date(date)) === toIstDateKey(yesterdayStart);
}

export function isMondayIst(now = new Date()) {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIMEZONE,
    weekday: 'short',
  }).format(new Date(now));

  return weekday === 'Mon';
}

/** @deprecated alias */
export function yesterdayStartIst(now = new Date()) {
  return new Date(startOfIstDay(now).getTime() - 24 * 60 * 60 * 1000);
}

/** Whole days from IST start-of-day `from` until IST start-of-day of `target`. */
export function daysUntilIst(targetDate, from = new Date()) {
  const targetStart = startOfIstDay(new Date(targetDate));
  const fromStart = startOfIstDay(from);
  const diffMs = targetStart.getTime() - fromStart.getTime();
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

export function formatIstDateLabel(date = new Date()) {
  return istLabelFormatter.format(new Date(date));
}

export function formatIstLongDateLabel(date = new Date()) {
  return istLongLabelFormatter.format(new Date(date));
}

export function getIstHour(date = new Date()) {
  const hourPart = istHourFormatter.formatToParts(new Date(date)).find((part) => part.type === 'hour');
  return Number(hourPart?.value ?? 0);
}

export function greetingMessageForHour(hour) {
  if (hour < 12) {
    return 'Good morning';
  }

  if (hour < 17) {
    return 'Good afternoon';
  }

  return 'Good evening';
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
