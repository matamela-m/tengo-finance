import { useSession } from '../store/session';
import { formatDayLong, formatDayShort, formatDayMonth, formatDateLong, formatTimestamp, formatWeekday } from './format';

/** Date formatters bound to the current language. */
export function useDates() {
  const lang = useSession((s) => s.language);
  return {
    lang,
    dayShort: (iso: string) => formatDayShort(iso, lang),
    dayMonth: (iso: string) => formatDayMonth(iso, lang),
    long: (iso: string) => formatDateLong(iso, lang),
    weekday: (iso: string) => formatWeekday(iso, lang),
    weekdayLong: (iso: string) => formatDayLong(iso, lang),
    stamp: (iso: string) => formatTimestamp(iso, lang),
  };
}
