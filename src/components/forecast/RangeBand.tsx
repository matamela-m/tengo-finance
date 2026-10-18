import { useTranslation } from 'react-i18next';
import { addDays, daysBetween } from '../../engine/dates';
import type { Forecast } from '../../engine/types';
import { useDates } from '../../lib/useLang';
import { Icon } from '../Icon';

/** A track from today showing the likely range for the date, the headline point and the next money. */
export function RangeBand({ forecast }: { forecast: Forecast }) {
  const { t } = useTranslation();
  const d = useDates();
  const { band, headlineDate, nextMoney, today, state, confidence } = forecast;
  const end = [band.to, nextMoney?.latest ?? today, addDays(today, 14)].reduce((a, b) => (a > b ? a : b));
  const span = Math.max(1, daysBetween(today, end) + 2);
  const pct = (iso: string) => `${Math.min(100, Math.max(0, (daysBetween(today, iso) / span) * 100))}%`;
  const sameDay = band.from === band.to;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="text-[15px] font-medium text-ink">
          {sameDay ? t('band.single', { date: d.dayShort(band.from) }) : t('band.between', { from: d.dayShort(band.from), to: d.dayShort(band.to) })}
        </p>
        {confidence === 'low' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-tight-soft px-2.5 py-0.5 text-xs font-semibold text-tight">
            <Icon name="info" size={14} />
            {t('band.lowConfidence')}
          </span>
        )}
      </div>
      <div className="relative mt-5 h-12" aria-hidden>
        <div className="absolute inset-x-0 top-[22px] h-1 rounded-full bg-surface-3" />
        <div
          className="absolute top-[17px] h-3.5 rounded-full border"
          style={{
            left: pct(band.from),
            width: `max(14px, calc(${pct(band.to)} - ${pct(band.from)}))`,
            background: `var(--color-${state}-soft)`,
            borderColor: `var(--color-${state})`,
          }}
        />
        {nextMoney && nextMoney.pattern !== 'unknown' && (
          <div className="absolute top-1 flex -translate-x-1/2 flex-col items-center" style={{ left: pct(nextMoney.typical) }}>
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            <span className="h-5 w-px bg-accent" />
          </div>
        )}
        <div className="absolute top-[16px] h-4 w-4 -translate-x-1/2 rounded-full ring-[3px] ring-surface" style={{ left: pct(headlineDate), background: `var(--color-${state})` }} />
        <span className="absolute left-0 top-8 text-xs font-medium text-subtle">{t('common.today')}</span>
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        <li className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: `var(--color-${state})` }} />
          {t('band.legendDate')}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-2.5 w-5 rounded-full border" style={{ background: `var(--color-${state}-soft)`, borderColor: `var(--color-${state})` }} />
          {t('band.legendRange')}
        </li>
        {nextMoney && nextMoney.pattern !== 'unknown' && (
          <li className="flex items-center gap-1.5">
            <span className="flex h-3 w-2.5 flex-col items-center">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="h-1.5 w-px bg-accent" />
            </span>
            {t('band.legendNext', { date: d.dayShort(nextMoney.typical) })}
          </li>
        )}
      </ul>
    </div>
  );
}
