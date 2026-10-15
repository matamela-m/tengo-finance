import { INTL_LOCALE, type LanguageCode } from '../i18n/languages';

const NBSP = ' ';

/** Formats rand amounts as "R1 250", with decimals only when the value has cents. */
export function formatZAR(value: number, opts: { sign?: boolean } = {}): string {
  const negative = value < 0;
  const abs = Math.abs(value);
  const hasCents = Math.round(abs * 100) % 100 !== 0;
  const whole = Math.floor(hasCents ? abs : Math.round(abs));
  const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  const cents = hasCents ? '.' + String(Math.round(abs * 100) % 100).padStart(2, '0') : '';
  const prefix = negative ? '-' : opts.sign && value > 0 ? '+' : '';
  return `${prefix}R${grouped}${cents}`;
}

/** Parses "YYYY-MM-DD" as a calendar date in UTC so time zones never shift the day. */
function toUTCDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
}

function parts(iso: string, lang: LanguageCode, options: Intl.DateTimeFormatOptions) {
  const fmt = new Intl.DateTimeFormat(INTL_LOCALE[lang], { ...options, timeZone: 'UTC' });
  const out: Record<string, string> = {};
  for (const p of fmt.formatToParts(toUTCDate(iso))) out[p.type] = p.value;
  return out;
}

/** "Thu 23 Oct" */
export function formatDayShort(iso: string, lang: LanguageCode): string {
  const p = parts(iso, lang, { weekday: 'short', day: 'numeric', month: 'short' });
  return `${p.weekday} ${p.day} ${p.month}`;
}

/** "Thursday 23 October", for screen readers and long labels. */
export function formatDayLong(iso: string, lang: LanguageCode): string {
  const p = parts(iso, lang, { weekday: 'long', day: 'numeric', month: 'long' });
  return `${p.weekday} ${p.day} ${p.month}`;
}

/** "23 Oct" */
export function formatDayMonth(iso: string, lang: LanguageCode): string {
  const p = parts(iso, lang, { day: 'numeric', month: 'short' });
  return `${p.day} ${p.month}`;
}

/** "23 Oct 2026" */
export function formatDateLong(iso: string, lang: LanguageCode): string {
  const p = parts(iso, lang, { day: 'numeric', month: 'short', year: 'numeric' });
  return `${p.day} ${p.month} ${p.year}`;
}

/** "Thursday" */
export function formatWeekday(iso: string, lang: LanguageCode): string {
  return parts(iso, lang, { weekday: 'long' }).weekday ?? '';
}

/** Timestamp for audit logs: "12 Oct 2026, 14:05" in the viewer's local time. */
export function formatTimestamp(isoDateTime: string, lang: LanguageCode): string {
  const d = new Date(isoDateTime);
  const date = new Intl.DateTimeFormat(INTL_LOCALE[lang], { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  const time = new Intl.DateTimeFormat(INTL_LOCALE[lang], { hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  return `${date}, ${time}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}
