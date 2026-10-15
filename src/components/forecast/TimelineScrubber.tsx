import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DayProjection, Forecast } from '../../engine/types';
import { formatZAR } from '../../lib/format';
import { useDates } from '../../lib/useLang';
import { Icon } from '../Icon';
import { StateChip } from '../StateChip';

const PAD = { top: 12, right: 12, bottom: 8, left: 52 };

/** Rounds a step to 1, 2 or 5 times a power of ten so gridlines land on tidy amounts. */
function niceStep(range: number, ticks: number): number {
  const raw = range / Math.max(1, ticks);
  const pow = 10 ** Math.floor(Math.log10(Math.max(1, raw)));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

/** "R2 000" as "R2k" so the axis stays narrow. */
function compactZAR(v: number): string {
  if (v === 0) return 'R0';
  const abs = Math.abs(v);
  const s = abs >= 1000 ? `R${(abs / 1000).toFixed(abs % 1000 === 0 ? 0 : 1)}k` : `R${abs}`;
  return v < 0 ? `-${s}` : s;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry?.contentRect.width ?? 0)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * 30 day projection: likely range band, expected balance line, R0 line, money in and bill markers.
 * The whole plot is a native range input, so dragging, tapping, arrow keys, Home and End all work,
 * and screen readers get a full value text. A table view lists every day.
 */
export function TimelineScrubber({ forecast }: { forecast: Forecast }) {
  const { t } = useTranslation();
  const d = useDates();
  const id = useId();
  const days = forecast.timeline;
  const [index, setIndex] = useState(0);
  const [showTable, setShowTable] = useState(false);
  const [plotRef, width] = useWidth<HTMLDivElement>();
  const height = width < 400 ? 180 : 230;
  const day: DayProjection = days[Math.min(index, days.length - 1)]!;

  const geo = useMemo(() => {
    const w = Math.max(1, width - PAD.left - PAD.right);
    const h = height - PAD.top - PAD.bottom;
    const rawHi = Math.max(forecast.balance, ...days.map((p) => p.optimistic));
    const rawLo = Math.min(0, ...days.map((p) => p.pessimistic));
    const step = niceStep(rawHi - rawLo, 3);
    const hi = Math.ceil(rawHi / step) * step;
    const lo = Math.floor(rawLo / step) * step;
    const x = (i: number) => PAD.left + (i / Math.max(1, days.length - 1)) * w;
    const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo || 1)) * h;
    const ticks: number[] = [];
    for (let v = lo; v <= hi + 0.5; v += step) ticks.push(Math.round(v));
    const line = (pick: (p: DayProjection) => number) => days.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(pick(p)).toFixed(1)}`).join(' ');
    const lower = [...days]
      .map((p, i) => [x(i), y(p.pessimistic)] as const)
      .reverse()
      .map(([px, py]) => `L${px.toFixed(1)},${py.toFixed(1)}`)
      .join(' ');
    return { x, y, ticks, band: `${line((p) => p.optimistic)} ${lower} Z`, central: line((p) => p.central), zeroY: y(0), bottom: PAD.top + h, lo };
  }, [days, forecast.balance, width, height]);

  const xLabels = useMemo(() => (width < 400 ? [0, 14, days.length - 1] : [0, 7, 14, 21, days.length - 1]), [days.length, width]);

  const valueText = t('scrubber.valueText', {
    date: d.weekdayLong(day.date),
    amount: formatZAR(Math.round(day.central)),
    state: t(`state.${day.state}`),
  });
  const low = days.reduce((m, p) => (p.central < m.central ? p : m), days[0]!);
  const summary = t('scrubber.summary', { low: formatZAR(Math.round(low.central)), date: d.weekdayLong(low.date) });

  return (
    <section aria-labelledby={`${id}-title`} aria-describedby={`${id}-summary`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id={`${id}-title`} className="text-lg font-semibold">
          {t('scrubber.title')}
        </h2>
        <p className="text-sm text-muted">{t('scrubber.subtitle')}</p>
      </div>
      <p id={`${id}-summary`} className="sr-only">
        {summary}
      </p>

      {/* Readout for the picked day. The slider's value text already announces it. */}
      <div className="mt-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted">{index === 0 ? t('common.today') : d.dayShort(day.date)}</p>
          <p className="num mt-0.5 font-figures text-[34px] font-extrabold leading-none tracking-tight">{formatZAR(Math.round(day.central))}</p>
          <p className="num mt-1.5 text-sm text-muted">
            {t('scrubber.range', { low: formatZAR(Math.round(day.pessimistic)), high: formatZAR(Math.round(day.optimistic)) })}
          </p>
        </div>
        <StateChip state={day.state} className="shrink-0" />
      </div>
      <div className="mt-3 flex min-h-[28px] flex-wrap gap-2" aria-hidden>
        {day.incomeToday > 0 && (
          <span className="num inline-flex items-center gap-1.5 rounded-full bg-mint/50 px-3 py-1 text-xs font-semibold text-charcoal dark:bg-mint">
            <span className="h-2 w-2 rounded-full bg-deep-green" />
            {t('scrubber.expectedIncome')} {formatZAR(day.incomeToday, { sign: true })}
          </span>
        )}
        {day.billsToday.map((b) => (
          <span key={b.description} className="num inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold">
            <span className="h-2 w-2 rounded-full border-2 border-short-text" />
            {t('scrubber.billDue', { name: b.description })} {formatZAR(-b.amount)}
          </span>
        ))}
      </div>

      {/* Plot. The range input covers it, so the chart itself is the slider. */}
      <div ref={plotRef} className="scrub-plot relative mt-2 rounded-2xl" style={{ height }}>
        {width > 0 && (
          <svg width={width} height={height} className="block" aria-hidden>
            {geo.lo < 0 && <rect x={PAD.left} y={geo.zeroY} width={width - PAD.left - PAD.right} height={geo.bottom - geo.zeroY} fill="var(--c-short-soft)" opacity="0.55" />}
            {geo.ticks.map((v) => (
              <g key={v}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={geo.y(v)}
                  y2={geo.y(v)}
                  stroke={v === 0 ? 'var(--c-short-text)' : 'var(--c-line)'}
                  strokeDasharray={v === 0 ? '5 5' : undefined}
                  strokeWidth={v === 0 ? 1.5 : 1}
                />
                <text x={PAD.left - 10} y={geo.y(v) + 4} textAnchor="end" className="num" fontSize="11" fontWeight={v === 0 ? 700 : 500} fill={v === 0 ? 'var(--c-short-text)' : 'var(--c-muted)'}>
                  {compactZAR(v)}
                </text>
              </g>
            ))}
            <path d={geo.band} fill="var(--c-band)" />
            <path d={geo.central} fill="none" stroke="var(--c-brand)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            <line x1={geo.x(index)} x2={geo.x(index)} y1={PAD.top} y2={geo.bottom} stroke="var(--c-ink)" strokeOpacity="0.25" strokeWidth="1.5" />
            {days.map((p, i) =>
              p.incomeToday > 0 || p.billsToday.length > 0 ? (
                <circle
                  key={p.date}
                  cx={geo.x(i)}
                  cy={geo.y(p.central)}
                  r={4.5}
                  fill={p.incomeToday > 0 ? 'var(--c-brand)' : 'var(--c-surface)'}
                  stroke={p.billsToday.length > 0 ? 'var(--c-short-text)' : 'var(--c-surface)'}
                  strokeWidth={2}
                />
              ) : null,
            )}
            <circle cx={geo.x(index)} cy={geo.y(day.central)} r={8} fill="var(--c-brand)" stroke="var(--c-surface)" strokeWidth={3} />
          </svg>
        )}
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
          className="scrub-input absolute top-0 h-full cursor-pointer"
          style={{ left: PAD.left - 6, width: `calc(100% - ${PAD.left + PAD.right - 12}px)` }}
        />
      </div>

      {/* Date axis */}
      <div className="relative mt-1 h-5 text-xs font-medium text-muted" aria-hidden>
        {width > 0 &&
          xLabels.map((i, k) => (
            <span
              key={i}
              className="num absolute whitespace-nowrap"
              style={{
                left: geo.x(i),
                transform: k === 0 ? 'translateX(-4px)' : k === xLabels.length - 1 ? 'translateX(calc(-100% + 4px))' : 'translateX(-50%)',
              }}
            >
              {i === 0 ? t('common.today') : d.dayMonth(days[i]!.date)}
            </span>
          ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted" aria-label={t('scrubber.legend')}>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="h-[3px] w-4 rounded bg-brand" />
            {t('scrubber.legendExpected')}
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="h-3 w-4 rounded-sm" style={{ background: 'var(--c-band)' }} />
            {t('scrubber.legendRange')}
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-brand" />
            {t('scrubber.legendIncome')}
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full border-2 border-short-text" />
            {t('scrubber.legendBill')}
          </li>
        </ul>
        <button type="button" className="btn-ghost -mr-3 min-h-[44px] px-3 text-sm" aria-expanded={showTable} aria-controls={`${id}-table`} onClick={() => setShowTable((v) => !v)}>
          <Icon name={showTable ? 'chevronDown' : 'chevronRight'} size={16} />
          {showTable ? t('scrubber.hideTable') : t('scrubber.showTable')}
        </button>
      </div>

      {showTable && (
        <div id={`${id}-table`} className="mt-3 max-h-[360px] overflow-auto rounded-2xl border border-line">
          <table className="w-full min-w-[460px] text-left text-sm">
            <caption className="sr-only">{t('scrubber.tableCaption')}</caption>
            <thead className="sticky top-0 bg-surface-2 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-2 font-semibold">
                  {t('scrubber.colDay')}
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">
                  {t('scrubber.colExpected')}
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">
                  {t('scrubber.colRange')}
                </th>
                <th scope="col" className="px-4 py-2 font-semibold">
                  {t('scrubber.colCover')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {days.map((p) => (
                <tr key={p.date}>
                  <th scope="row" className="num whitespace-nowrap px-4 py-2 font-medium">
                    {d.dayShort(p.date)}
                  </th>
                  <td className="num px-4 py-2 text-right font-semibold">{formatZAR(Math.round(p.central))}</td>
                  <td className="num whitespace-nowrap px-4 py-2 text-right text-muted">
                    {t('common.rangeAmounts', { low: formatZAR(Math.round(p.pessimistic)), high: formatZAR(Math.round(p.optimistic)) })}
                  </td>
                  <td className="px-4 py-2">
                    <StateChip state={p.state} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
