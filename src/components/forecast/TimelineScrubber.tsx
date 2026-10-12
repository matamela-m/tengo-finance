import { useId, useMemo, useRef, useState, type PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { DayProjection, Forecast } from '../../engine/types';
import { formatZAR } from '../../lib/format';
import { useDates } from '../../lib/useLang';
import { Icon } from '../Icon';
import { StateChip } from '../StateChip';

const W = 600;
const H = 220;
const PAD_Y = 14;

function path(points: [number, number][]): string {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

/**
 * 30 day projection with the optimistic to pessimistic band, the central line and a zero line.
 * A native range input drives it, so arrow keys, Home and End work and screen readers get a value text.
 */
export function TimelineScrubber({ forecast }: { forecast: Forecast }) {
  const { t } = useTranslation();
  const d = useDates();
  const id = useId();
  const days = forecast.timeline;
  const [index, setIndex] = useState(0);
  const chartRef = useRef<HTMLDivElement>(null);
  const day: DayProjection = days[Math.min(index, days.length - 1)]!;

  const geo = useMemo(() => {
    const hi = Math.max(forecast.balance, ...days.map((p) => p.optimistic)) * 1.08;
    const lo = Math.min(0, ...days.map((p) => p.pessimistic)) * 1.08;
    const x = (i: number) => (i / Math.max(1, days.length - 1)) * W;
    const y = (v: number) => PAD_Y + (1 - (v - lo) / (hi - lo || 1)) * (H - PAD_Y * 2);
    const upper = days.map((p, i) => [x(i), y(p.optimistic)] as [number, number]);
    const lower = days.map((p, i) => [x(i), y(p.pessimistic)] as [number, number]).reverse();
    return {
      x,
      y,
      zeroY: y(0),
      band: `${path(upper)} ${path(lower).replace(/^M/, 'L')} Z`,
      central: path(days.map((p, i) => [x(i), y(p.central)])),
    };
  }, [days, forecast.balance]);

  const pickFromPointer = (e: PointerEvent<HTMLDivElement>) => {
    const box = chartRef.current?.getBoundingClientRect();
    if (!box) return;
    const ratio = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    setIndex(Math.round(ratio * (days.length - 1)));
  };

  const valueText = t('scrubber.valueText', {
    date: d.dayShort(day.date),
    amount: formatZAR(Math.round(day.central)),
    state: t(`state.${day.state}`),
  });
  const leftPct = (geo.x(index) / W) * 100;

  return (
    <section aria-labelledby={`${id}-title`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`${id}-title`} className="text-lg font-semibold">
          {t('scrubber.title')}
        </h2>
        <p className="text-sm text-muted">{t('scrubber.subtitle')}</p>
      </div>

      {/* Readout for the picked day */}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3" aria-live="polite">
        <div>
          <p className="text-sm font-medium text-muted">{index === 0 ? t('common.today') : d.dayShort(day.date)}</p>
          <p className="num font-display text-[34px] font-extrabold leading-none tracking-tight">{formatZAR(Math.round(day.central))}</p>
          <p className="num mt-1 text-sm text-muted">
            {t('scrubber.range', { low: formatZAR(Math.round(day.pessimistic)), high: formatZAR(Math.round(day.optimistic)) })}
          </p>
        </div>
        <StateChip state={day.state} />
      </div>

      <div
        ref={chartRef}
        className="relative mt-4 touch-none select-none"
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          pickFromPointer(e);
        }}
        onPointerMove={(e) => e.buttons === 1 && pickFromPointer(e)}
        aria-hidden
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-[180px] w-full sm:h-[220px]">
          <defs>
            <linearGradient id={`${id}-band`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#7AAB88" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#B6DFB2" stopOpacity="0.25" />
            </linearGradient>
          </defs>
          <path d={geo.band} fill={`url(#${id}-band)`} />
          <line x1="0" x2={W} y1={geo.zeroY} y2={geo.zeroY} stroke="var(--c-short-text)" strokeDasharray="6 6" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          <path d={geo.central} fill="none" stroke="var(--c-brand)" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          <line x1={geo.x(index)} x2={geo.x(index)} y1="0" y2={H} stroke="var(--c-ink)" strokeOpacity="0.35" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
        {/* HTML markers so circles are not stretched by the SVG aspect ratio */}
        <span
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-surface bg-brand shadow-card"
          style={{ left: `${leftPct}%`, top: `${(geo.y(day.central) / H) * 100}%` }}
        />
        <span className="pointer-events-none absolute right-0 rounded bg-surface/80 px-1 text-[11px] font-semibold text-short-text" style={{ top: `calc(${(geo.zeroY / H) * 100}% - 18px)` }}>
          R0
        </span>
        {days.map((p, i) =>
          p.billsToday.length > 0 || p.incomeToday > 0 ? (
            <span
              key={p.date}
              className={`pointer-events-none absolute bottom-0 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full ${p.incomeToday > 0 ? 'bg-brand text-on-brand' : 'bg-surface text-short-text ring-1 ring-line'}`}
              style={{ left: `${(geo.x(i) / W) * 100}%` }}
            >
              <Icon name={p.incomeToday > 0 ? 'arrowDown' : 'receipt'} size={12} strokeWidth={2.4} />
            </span>
          ) : null,
        )}
      </div>

      {/* Day state strip, decorative. The readout above carries the word and icon. */}
      <div className="mt-2 grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }} aria-hidden>
        {days.map((p, i) => (
          <span key={p.date} className={`h-1.5 rounded-full ${i === index ? 'opacity-100' : 'opacity-60'}`} style={{ background: `var(--c-${p.state})` }} />
        ))}
      </div>

      <label htmlFor={`${id}-range`} className="sr-only">
        {t('scrubber.label')}
      </label>
      <input
        id={`${id}-range`}
        type="range"
        min={0}
        max={days.length - 1}
        step={1}
        value={index}
        onChange={(e) => setIndex(Number(e.target.value))}
        aria-valuetext={valueText}
        className="scrubber mt-3 w-full"
      />
      <div className="flex justify-between text-xs font-medium text-muted">
        <span>{t('common.today')}</span>
        <span className="num">{d.dayShort(days[days.length - 1]!.date)}</span>
      </div>

      {(day.billsToday.length > 0 || day.incomeToday > 0) && (
        <ul className="mt-4 space-y-2">
          {day.incomeToday > 0 && (
            <li className="flex items-center justify-between gap-3 rounded-2xl bg-mint/40 px-4 py-2.5 text-sm text-charcoal dark:bg-mint">
              <span className="flex items-center gap-2 font-medium">
                <Icon name="arrowDown" size={16} />
                {t('scrubber.expectedIncome')}
              </span>
              <span className="num font-semibold">{formatZAR(day.incomeToday, { sign: true })}</span>
            </li>
          )}
          {day.billsToday.map((b) => (
            <li key={b.description} className="flex items-center justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-2.5 text-sm">
              <span className="flex items-center gap-2 font-medium">
                <Icon name="receipt" size={16} />
                {t('scrubber.billDue', { name: b.description })}
              </span>
              <span className="num font-semibold">{formatZAR(-b.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
