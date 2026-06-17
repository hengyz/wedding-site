import type { SiteConfig } from '../types';

export type SiteMode = SiteConfig['mode'];

const WEDDING_TIMEZONE = 'Asia/Shanghai';

function parseWeddingInstant(dateStr: string): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    const normalized = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
    const shanghai = new Date(`${normalized}+08:00`);
    if (!isNaN(shanghai.getTime())) return shanghai;
  }

  const date = new Date(trimmed);
  return isNaN(date.getTime()) ? null : date;
}

function calendarDayInShanghai(instant: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: WEDDING_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

/** Derive display mode from wedding date (Asia/Shanghai calendar day). */
export function resolveEffectiveMode(
  weddingDate: string,
  now: Date = new Date()
): SiteMode {
  const wedding = parseWeddingInstant(weddingDate);
  if (!wedding) return 'before_wedding';

  const weddingDay = calendarDayInShanghai(wedding);
  const today = calendarDayInShanghai(now);

  if (today < weddingDay) return 'before_wedding';
  if (today === weddingDay) return 'wedding_day';
  return 'after_wedding';
}
