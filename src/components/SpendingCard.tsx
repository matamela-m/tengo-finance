import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { spendingBreakdown } from '../engine/spending';
import type { ISODate, Transaction } from '../engine/types';
import { formatZAR } from '../lib/format';

/** Where everyday money went in the last 30 days. Bars are labelled, so colour is not needed. */
export function SpendingCard({ transactions, today }: { transactions: Transaction[]; today: ISODate }) {
  const { t } = useTranslation();
  const slices = useMemo(() => spendingBreakdown(transactions, today), [transactions, today]);
  return (
    <section className="card p-6" aria-labelledby="spend-title">
      <h2 id="spend-title" className="font-heading text-h3 text-ink">
        {t('spending.title')}
      </h2>
      <p className="mt-1 text-sm text-muted">{t('spending.lead')}</p>
      {slices.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t('spending.empty')}</p>
      ) : (
        <ul className="mt-4 space-y-3.5">
          {slices.map((s) => (
            <li key={s.group}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">{t(`spending.groups.${s.group}`)}</span>
                <span className="num font-semibold">
                  {formatZAR(s.total)} <span className="font-normal text-muted">· {Math.round(s.share * 100)}%</span>
                </span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(3, s.share * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
