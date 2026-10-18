import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Forecast, Transaction } from '../../engine/types';
import { formatZAR } from '../../lib/format';
import { useCountUp } from '../../lib/useCountUp';
import { useDates } from '../../lib/useLang';
import { CoverBars } from '../CoverBars';
import { Icon } from '../Icon';
import { StateChip } from '../StateChip';

export function SafeToSpendCard({ forecast }: { forecast: Forecast }) {
  const { t } = useTranslation();
  const d = useDates();
  const until = forecast.nextMoney?.latest ?? forecast.today;
  const shown = useCountUp(forecast.safeToSpendToday);
  return (
    <section className="card p-6" aria-labelledby="sts-title">
      <h2 id="sts-title" className="text-sm font-semibold text-muted">
        {t('sts.title')}
      </h2>
      <p className="num mt-1 font-heading text-[48px] font-extrabold leading-none tracking-tight sm:text-[56px]">
        <span aria-hidden>{formatZAR(shown)}</span>
        <span className="sr-only">{formatZAR(forecast.safeToSpendToday)}</span>
      </p>
      <p className="mt-3 text-sm text-muted">
        {forecast.billsTotalBeforeNextMoney > 0
          ? t('sts.withBills', { date: d.dayShort(until), bills: formatZAR(forecast.billsTotalBeforeNextMoney) })
          : t('sts.noBills', { date: d.dayShort(until) })}
      </p>
    </section>
  );
}

export function StateCard({ forecast, onWhy }: { forecast: Forecast; onWhy: () => void }) {
  const { t } = useTranslation();
  const { state } = forecast;
  return (
    <section className="card p-6" aria-labelledby="state-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="state-title" className="text-sm font-semibold text-muted">
            {t('stateCard.title')}
          </h2>
          <StateChip state={state} size="lg" className="mt-2" />
        </div>
        <CoverBars state={state} size={72} />
      </div>
      <p className="mt-4 text-[15px] text-ink">{t(`stateCard.${state}`, { count: forecast.gapDays })}</p>
      <button type="button" onClick={onWhy} className="btn-secondary mt-5 w-full sm:w-auto">
        <Icon name="info" size={18} />
        {t('why.open')}
      </button>
    </section>
  );
}

export function NextMoneyCard({ forecast }: { forecast: Forecast }) {
  const { t } = useTranslation();
  const d = useDates();
  const n = forecast.nextMoney;
  return (
    <section className="card p-6" aria-labelledby="next-title">
      <h2 id="next-title" className="text-sm font-semibold text-muted">
        {t('next.title')}
      </h2>
      {!n || n.pattern === 'unknown' ? (
        <p className="mt-2 text-[15px]">{t('next.unknown')}</p>
      ) : (
        <>
          <p className="mt-1 flex items-center gap-2 text-2xl font-bold">
            <Icon name="calendar" size={22} className="text-accent" />
            <span className="num">{t('next.around', { date: d.dayShort(n.typical) })}</span>
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted">{t('next.window')}</dt>
              <dd className="num mt-0.5 font-semibold">
                {n.earliest === n.latest ? d.dayShort(n.typical) : t('common.rangeDates', { from: d.dayMonth(n.earliest), to: d.dayMonth(n.latest) })}
              </dd>
            </div>
            <div>
              <dt className="text-muted">{t('next.amount')}</dt>
              <dd className="num mt-0.5 font-semibold">
                {n.amountLow === n.amountHigh ? formatZAR(n.amountTypical) : t('common.rangeAmounts', { low: formatZAR(n.amountLow), high: formatZAR(n.amountHigh) })}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-muted">
            {n.pattern === 'weekday' ? t('next.patternWeekday', { day: d.weekday(n.typical) }) : t('next.patternInterval', { count: n.typicalGapDays })}
          </p>
        </>
      )}
    </section>
  );
}

export function TransactionRow({ tx, compact = false }: { tx: Transaction; compact?: boolean }) {
  const { t } = useTranslation();
  const d = useDates();
  const icon = tx.category === 'income' ? 'arrowDown' : tx.category === 'bill' ? 'receipt' : 'arrowUp';
  const tone = tx.category === 'income' ? 'border-enough/25 bg-enough-soft text-enough' : tx.category === 'bill' ? 'border-tight/25 bg-tight-soft text-tight' : 'border-line bg-surface-2 text-muted';
  return (
    <div className={`flex items-center gap-3 ${compact ? 'py-2.5' : 'py-3'}`}>
      <span aria-hidden className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border ${tone}`}>
        <Icon name={icon} size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium">{tx.description}</p>
        <p className="num text-xs text-subtle">
          {d.dayShort(tx.date)} · {t(`category.${tx.category}`)}
        </p>
      </div>
      <p className={`num shrink-0 text-[15px] font-semibold ${tx.amount > 0 ? 'text-enough' : 'text-ink'}`}>
        <span aria-hidden>{formatZAR(tx.amount, { sign: true })}</span>
        <span className="sr-only">{t(tx.amount > 0 ? 'a11y.moneyIn' : 'a11y.moneyOut', { amount: formatZAR(Math.abs(tx.amount)) })}</span>
      </p>
    </div>
  );
}

export function RecentActivity({ transactions }: { transactions: Transaction[] }) {
  const { t } = useTranslation();
  const recent = [...transactions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, 6);
  return (
    <section className="card p-5 sm:p-6" aria-labelledby="recent-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="recent-title" className="eyebrow">
          {t('recent.title')}
        </h2>
        <Link to="/app/money" className="btn-ghost -mr-3 min-h-[44px] px-3 text-sm text-muted">
          {t('recent.all')}
          <Icon name="chevronRight" size={16} />
        </Link>
      </div>
      {recent.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{t('recent.empty')}</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {recent.map((tx, i) => (
            <li key={tx.id} className={i >= 3 ? 'hidden sm:block' : undefined}>
              <TransactionRow tx={tx} compact />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
