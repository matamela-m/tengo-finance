import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { addDays, daysBetween } from '../../engine/dates';
import type { Forecast } from '../../engine/types';
import { headlineKey } from '../../engine/view';
import { formatZAR } from '../../lib/format';
import { useDates } from '../../lib/useLang';
import { Drawer } from '../Drawer';
import { Icon } from '../Icon';
import { StateChip } from '../StateChip';

/** Three straight-ish runway paths from today's balance down to zero, with bills as steps. */
function RunwayChart({ forecast }: { forecast: Forecast }) {
  const { t } = useTranslation();
  const d = useDates();
  const { balance, rates, today, upcomingBills, nextMoney } = forecast;
  const lastZero = forecast.runway.optimistic ?? addDays(today, 60);
  const span = Math.min(60, Math.max(7, daysBetween(today, lastZero) + 2, nextMoney ? daysBetween(today, nextMoney.latest) + 2 : 0));
  const W = 400;
  const H = 150;
  const x = (i: number) => (i / span) * W;
  const y = (v: number) => 8 + (1 - Math.max(0, v) / Math.max(1, balance)) * (H - 16);

  const line = (rate: number) => {
    let bal = balance;
    const pts: string[] = [`M0,${y(bal).toFixed(1)}`];
    for (let i = 0; i < span && bal > 0; i++) {
      const date = addDays(today, i);
      bal -= rate;
      for (const b of upcomingBills) if (b.date === date) bal -= b.amount;
      pts.push(`L${x(i + 1).toFixed(1)},${y(bal).toFixed(1)}`);
    }
    return pts.join(' ');
  };

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={t('why.chartLabel')}>
        <line x1="0" x2={W} y1={H - 8} y2={H - 8} stroke="var(--color-short)" strokeDasharray="4 4" />
        {nextMoney && nextMoney.pattern !== 'unknown' && (
          <g>
            <rect x={x(daysBetween(today, nextMoney.earliest))} width={Math.max(4, x(daysBetween(nextMoney.earliest, nextMoney.latest) + 1))} y="0" height={H} fill="var(--color-accent)" opacity="0.1" />
            <line x1={x(daysBetween(today, nextMoney.typical))} x2={x(daysBetween(today, nextMoney.typical))} y1="0" y2={H} stroke="var(--color-accent)" strokeWidth="2" />
          </g>
        )}
        <path d={line(rates.optimistic)} fill="none" stroke="var(--color-text-subtle)" strokeWidth="2" strokeDasharray="5 4" />
        <path d={line(rates.pessimistic)} fill="none" stroke="var(--color-short)" strokeWidth="2" strokeDasharray="5 4" />
        <path d={line(rates.central)} fill="none" stroke="var(--color-accent)" strokeWidth="3" />
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-[3px] w-4 rounded bg-accent" />
          {t('why.lineCentral')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-[2px] w-4 border-t-2 border-dashed border-subtle" />
          {t('why.lineLight')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-[2px] w-4 border-t-2 border-dashed border-short" />
          {t('why.lineHeavy')}
        </span>
        {nextMoney && nextMoney.pattern !== 'unknown' && (
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-[2px] bg-accent" />
            {t('why.lineNext', { date: d.dayShort(nextMoney.typical) })}
          </span>
        )}
      </figcaption>
    </figure>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="text-sm text-muted">
        {label}
        {hint && <span className="mt-0.5 block text-xs">{hint}</span>}
      </dt>
      <dd className="num text-right text-[15px] font-semibold">{value}</dd>
    </div>
  );
}

export function WhyDrawer({ forecast, open, onClose }: { forecast: Forecast; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const d = useDates();
  const n = forecast.nextMoney;
  const known = n && n.pattern !== 'unknown';
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t('why.title')}
      footer={
        <Link to="/app/privacy/review" className="btn-secondary w-full" onClick={onClose}>
          <Icon name="edit" size={18} />
          {t('why.question')}
        </Link>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <StateChip state={forecast.state} />
        <p className="num text-[15px] font-semibold">
          {t(headlineKey(forecast))} {d.dayShort(forecast.headlineDate)}
        </p>
      </div>
      <p className="mt-4 text-[15px] leading-relaxed">{t('why.plain')}</p>
      {known && forecast.state !== 'short' && <p className="num mt-2 text-sm text-muted">{t('why.budgetSpread', { date: d.dayShort(n.latest) })}</p>}

      <div className="mt-5 rounded-2xl bg-surface-2 p-4">
        <RunwayChart forecast={forecast} />
      </div>

      <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted">{t('why.inputs')}</h3>
      <dl className="mt-1 divide-y divide-line">
        <Row label={t('why.balance')} value={formatZAR(forecast.balance)} />
        <Row
          label={t('why.dailySpend')}
          hint={t('why.dailySpendHint', { low: formatZAR(Math.round(forecast.rates.optimistic)), high: formatZAR(Math.round(forecast.rates.pessimistic)) })}
          value={t('why.perDay', { amount: formatZAR(Math.round(forecast.rates.central)) })}
        />
        <Row
          label={t('why.bills')}
          hint={forecast.billsBeforeNextMoney.map((b) => `${b.description}, ${d.dayMonth(b.date)}`).join('; ') || t('why.noBills')}
          value={formatZAR(forecast.billsTotalBeforeNextMoney)}
        />
        <Row
          label={t('why.income')}
          hint={known ? t('common.rangeDates', { from: d.dayMonth(n.earliest), to: d.dayMonth(n.latest) }) : t('next.unknown')}
          value={known ? t('why.incomeValue', { amount: formatZAR(n.amountTypical), date: d.dayShort(n.typical) }) : '-'}
        />
        <Row
          label={t('why.reserve')}
          hint={forecast.reserveBills.map((b) => `${b.description}, ${d.dayMonth(b.date)}`).join('; ') || t('why.reserveNone')}
          value={formatZAR(forecast.reserve)}
        />
        <Row label={t('why.history')} hint={t('why.historyHint', { count: forecast.historyDays })} value={t('why.historyValue', { count: forecast.windowDays })} />
        <Row label={t('why.confidence')} hint={t(`why.confidenceHint.${forecast.confidence}`)} value={t(`confidence.${forecast.confidence}`)} />
      </dl>

      <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted">{t('why.rulesTitle')}</h3>
      <ul className="mt-2 space-y-2 text-sm">
        {(['enough', 'tight', 'short'] as const).map((s) => (
          <li key={s} className="flex items-start gap-3">
            <StateChip state={s} size="sm" className="mt-0.5 w-[88px] justify-center" />
            <span className={forecast.state === s ? 'font-semibold' : 'text-muted'}>{t(`why.rule.${s}`)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-muted">{t('why.notAdvice')}</p>
    </Drawer>
  );
}
