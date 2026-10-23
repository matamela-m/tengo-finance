import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Transaction } from '../../engine/types';
import { formatZAR } from '../../lib/format';
import { useDates } from '../../lib/useLang';
import { Icon } from '../Icon';

type SortKey = 'date' | 'description' | 'amount';
type Dir = 'asc' | 'desc';

interface Props {
  transactions: Transaction[];
  /** How many rows to show, for the Show more button below. */
  limit: number;
  oneOffIds: Set<string>;
  onEdit: (tx: Transaction) => void;
}

/**
 * The transaction history as a sortable table, for screens 768px and wider. Phones keep the card list, so
 * nothing scrolls sideways. Filtering and search happen before the rows reach this table.
 */
export function TransactionTable({ transactions, limit, oneOffIds, onEdit }: Props) {
  const { t } = useTranslation();
  const d = useDates();
  const [sort, setSort] = useState<{ key: SortKey; dir: Dir }>({ key: 'date', dir: 'desc' });

  const rows = useMemo(() => {
    const k = sort.key;
    const sign = sort.dir === 'asc' ? 1 : -1;
    return [...transactions]
      .sort((a, b) => {
        const v = k === 'amount' ? a.amount - b.amount : k === 'description' ? a.description.localeCompare(b.description) : a.date.localeCompare(b.date);
        return v * sign || b.date.localeCompare(a.date);
      })
      .slice(0, limit);
  }, [transactions, sort, limit]);

  const header = (key: SortKey, label: string, align: 'left' | 'right' = 'left') => {
    const active = sort.key === key;
    return (
      <th scope="col" aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'} className={`py-2 font-medium ${align === 'right' ? 'text-right' : 'text-left'}`}>
        <button
          type="button"
          className={`-mx-2 inline-flex min-h-[44px] items-center gap-1 rounded-lg px-2 text-xs uppercase tracking-[0.08em] hover:text-ink ${active ? 'text-ink' : 'text-muted'}`}
          onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 'asc' ? 'desc' : 'asc') : key === 'description' ? 'asc' : 'desc' }))}
        >
          {/* The name comes from text, not aria-label, so it never doubles as a form field label. */}
          <span className="sr-only">{t('money.sortBy', { column: label })}</span>
          <span aria-hidden>{label}</span>
          <Icon name={active ? (sort.dir === 'asc' ? 'arrowUp' : 'arrowDown') : 'chevronsUpDown'} size={14} />
        </button>
      </th>
    );
  };

  return (
    <table className="mt-2 w-full border-collapse text-[15px]">
      <caption className="sr-only">{t('money.history')}</caption>
      <thead className="border-b border-line">
        <tr>
          {header('date', t('import.field.date'))}
          {header('description', t('import.field.description'))}
          <th scope="col" className="py-2 text-left text-xs font-medium uppercase tracking-[0.08em] text-muted">
            {t('import.type')}
          </th>
          {header('amount', t('import.field.amount'), 'right')}
          <th scope="col" className="w-12 py-2">
            <span className="sr-only">{t('edit.title')}</span>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {rows.map((tx) => (
          <tr key={tx.id} className="transition-colors duration-150 hover:bg-surface-2/60">
            <td className="num whitespace-nowrap py-2.5 pr-3 text-sm text-muted">{d.dayShort(tx.date)}</td>
            <td className="py-2.5 pr-3">
              <span className="line-clamp-2 break-words font-medium text-ink">{tx.description}</span>
              {(tx.accountId === 'cash' || tx.estimated || oneOffIds.has(tx.id)) && (
                <span className="num block text-xs text-subtle">
                  {[tx.accountId === 'cash' && t('accounts.cashTag'), tx.estimated && t('setup.estimatedTag'), oneOffIds.has(tx.id) && t('edit.oneOff')].filter(Boolean).join(' · ')}
                </span>
              )}
            </td>
            <td className="whitespace-nowrap py-2.5 pr-3 text-sm text-muted">{t(`category.${tx.category}`)}</td>
            <td className={`num whitespace-nowrap py-2.5 text-right font-semibold ${tx.amount > 0 ? 'text-enough' : 'text-ink'}`}>
              <span aria-hidden>{formatZAR(tx.amount, { sign: true })}</span>
              <span className="sr-only">{t(tx.amount > 0 ? 'a11y.moneyIn' : 'a11y.moneyOut', { amount: formatZAR(Math.abs(tx.amount)) })}</span>
            </td>
            <td className="py-1 text-right">
              <button
                type="button"
                onClick={() => onEdit(tx)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
                aria-label={t('money.editLabel', { name: tx.description, date: d.dayShort(tx.date) })}
              >
                <Icon name="edit" size={18} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
