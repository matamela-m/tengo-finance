import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { WORK_COST_GROUPS } from '../engine/help';
import { spendingBreakdown, type SpendGroup } from '../engine/spending';
import type { ISODate, Transaction } from '../engine/types';
import { formatZAR } from '../lib/format';

/**
 * Where everyday money went in the last 30 days. Bars are labelled, so colour is not needed.
 * With `onFlexibleChange`, each group can be marked as able to bend; work costs cannot.
 */
export function SpendingCard({
  transactions,
  today,
  flexible = [],
  onFlexibleChange,
}: {
  transactions: Transaction[];
  today: ISODate;
  flexible?: SpendGroup[];
  onFlexibleChange?: (groups: SpendGroup[]) => void;
}) {
  const { t } = useTranslation();
  const slices = useMemo(() => spendingBreakdown(transactions, today), [transactions, today]);
  return (
    <section className="card p-6" aria-labelledby="spend-title">
      <h2 id="spend-title" className="font-heading text-h3 text-ink">
        {t('spending.title')}
      </h2>
      <p className="mt-1 text-sm text-muted">{t('spending.lead')}</p>
      {onFlexibleChange && <p className="mt-1 text-sm text-muted">{t('spending.flexibleHint')}</p>}
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
              {onFlexibleChange &&
                (WORK_COST_GROUPS.includes(s.group) ? (
                  <p className="mt-1.5 text-xs text-subtle">{t('spending.workCost')}</p>
                ) : (
                  <label className="mt-1 inline-flex min-h-[36px] cursor-pointer items-center gap-2 text-sm text-muted">
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-[var(--color-accent)]"
                      checked={flexible.includes(s.group)}
                      onChange={(e) => onFlexibleChange(e.target.checked ? [...flexible, s.group] : flexible.filter((g) => g !== s.group))}
                      aria-label={`${t('spending.flexibleLabel')}: ${t(`spending.groups.${s.group}`)}`}
                    />
                    {t('spending.flexibleLabel')}
                  </label>
                ))}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
