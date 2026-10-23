import { Link } from 'react-router-dom';
import { EmptyState } from '../Feedback';
import { useTranslation } from 'react-i18next';
import type { Transaction } from '../../engine/types';
import { formatZAR } from '../../lib/format';
import { useDates } from '../../lib/useLang';
import { Icon } from '../Icon';

export function TransactionRow({ tx, compact = false, oneOff = false }: { tx: Transaction; compact?: boolean; oneOff?: boolean }) {
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
        <p className="line-clamp-2 break-words text-[15px] font-medium">{tx.description}</p>
        <p className="num text-xs text-subtle">
          {d.dayShort(tx.date)} · {t(`category.${tx.category}`)}
          {tx.accountId === 'cash' && ` · ${t('accounts.cashTag')}`}
          {tx.estimated && ` · ${t('setup.estimatedTag')}`}
          {oneOff && ` · ${t('edit.oneOff')}`}
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
        <div className="mt-3">
          <EmptyState compact icon="receipt" title={t('recent.empty')} />
        </div>
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
