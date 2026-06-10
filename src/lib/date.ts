/** Wedding dates are interpreted in China standard time. */
export const WEDDING_TIMEZONE = 'Asia/Shanghai';

function parseWeddingInstant(dateStr: string): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // datetime-local legacy saves without offset — treat as Asia/Shanghai wall time
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    const normalized = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
    const shanghai = new Date(`${normalized}+08:00`);
    if (!isNaN(shanghai.getTime())) return shanghai;
  }

  const date = new Date(trimmed);
  return isNaN(date.getTime()) ? null : date;
}

/** ISO / DB value → `YYYY-MM-DDTHH:mm` for datetime-local (Asia/Shanghai). */
export function toDatetimeLocalValue(dateStr: string): string {
  const date = parseWeddingInstant(dateStr);
  if (!date) return '';

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: WEDDING_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';

  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

/** datetime-local input → UTC ISO string (wall time in Asia/Shanghai). */
export function fromDatetimeLocalValue(value: string): string {
  if (!value) return '';
  const normalized = value.length === 16 ? `${value}:00` : value;
  const date = new Date(`${normalized}+08:00`);
  if (isNaN(date.getTime())) return '';
  return date.toISOString();
}

export function formatWeddingDate(dateStr: string): string {
  const date = parseWeddingInstant(dateStr);
  if (!date) return dateStr;
  return date.toLocaleDateString('zh-CN', {
    timeZone: WEDDING_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

export function formatTime(dateStr: string): string {
  const date = parseWeddingInstant(dateStr);
  if (!date) return '';
  return date.toLocaleTimeString('zh-CN', {
    timeZone: WEDDING_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  });
}

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export function getCountdown(targetDate: string): Countdown {
  const target = parseWeddingInstant(targetDate)?.getTime();
  if (target == null) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isPast: false };
}

export function pad(n: number): string {
  return n.toString().padStart(2, '0');
}
