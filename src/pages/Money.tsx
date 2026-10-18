import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TransactionRow } from '../components/forecast/Cards';
import { EmptyState } from '../components/Feedback';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { Segmented } from '../components/Segmented';
import { TransactionEditor } from '../components/TransactionEditor';
import { SpendingCard } from '../components/SpendingCard';
import { useReadyPersona } from '../data/PersonaProvider';
import { addDays } from '../engine/dates';
import type { Category, Transaction } from '../engine/types';
import { formatZAR } from '../lib/format';
import { useDates } from '../lib/useLang';
import { INTL_LOCALE } from '../i18n/languages';

type Filter = 'all' | Category;
const FILTERS: Filter[] = ['all', 'income', 'spend', 'bill'];
const PAGE = 40;

export default function MoneyPage() {
  const { t } = useTranslation();
  const d = useDates();
  const { record, forecast, today } = useReadyPersona();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(PAGE);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const sorted = useMemo(() => [...record.transactions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)), [record.transactions]);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((tx) => (filter === 'all' || tx.category === filter) && (!q || tx.description.toLowerCase().includes(q)));
  }, [sorted, filter, query]);

  const last30 = useMemo(() => {
    const from = addDays(today, -30);
    const recent = record.transactions.filter((x) => x.date >= from);
    return {
      income: recent.filter((x) => x.amount > 0).reduce((s, x) => s + x.amount, 0),
      out: recent.filter((x) => x.amount < 0).reduce((s, x) => s - x.amount, 0),
    };
  }, [record.transactions, today]);

  // Group the visible slice by month for scanability.
  const groups = useMemo(() => {
    const out: { month: string; items: Transaction[] }[] = [];
    for (const tx of list.slice(0, shown)) {
      const month = tx.date.slice(0, 7);
      const g = out[out.length - 1];
      if (g && g.month === month) g.items.push(tx);
      else out.push({ month, items: [tx] });
    }
    return out;
  }, [list, shown]);

  const monthLabel = (ym: string) => new Intl.DateTimeFormat(INTL_LOCALE[d.lang], { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${ym}-01T00:00:00Z`));

  return (
    <>
      <PageHeader
        title={t('money.title')}
        lead={t('money.lead')}
        actions={
          <Link to="/app/money/import" className="btn-primary">
            <Icon name="upload" size={18} />
            {t('money.import')}
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <section className="card min-w-0 p-5 sm:p-7" aria-labelledby="history-title">
          <h2 id="history-title" className="sr-only">
            {t('money.history')}
          </h2>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <Segmented
              label={t('money.filter')}
              variant="pills"
              value={filter}
              onChange={(f) => {
                setFilter(f);
                setShown(PAGE);
              }}
              options={FILTERS.map((f) => ({ value: f, label: f === 'all' ? t('money.all') : t(`money.filters.${f}`) }))}
            />
            <div className="relative xl:w-56">
              <label htmlFor="money-search" className="sr-only">
                {t('money.search')}
              </label>
              <Icon name="filter" size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input id="money-search" type="search" className="field pl-9" placeholder={t('money.search')} value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>

          <p className="mt-4 text-sm text-muted" aria-live="polite">
            {t('money.count', { count: list.length })}
          </p>

          {list.length === 0 ? (
            <div className="mt-4">
              <EmptyState icon="money" title={t('money.emptyTitle')} body={record.transactions.length === 0 ? t('money.emptyBodyNone') : t('money.emptyBodyFilter')} />
            </div>
          ) : (
            <div className="mt-2">
              {groups.map((g) => (
                <div key={g.month}>
                  <h3 className="eyebrow sticky top-[56px] z-10 -mx-2 bg-surface px-2 pb-1.5 pt-5 lg:top-0">{monthLabel(g.month)}</h3>
                  <ul className="divide-y divide-line">
                    {g.items.map((tx) => (
                      <li key={tx.id} className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <TransactionRow tx={tx} />
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditing(tx)}
                          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
                          aria-label={t('money.editLabel', { name: tx.description, date: d.dayShort(tx.date) })}
                        >
                          <Icon name="edit" size={18} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {list.length > shown && (
                <button type="button" className="btn-secondary mt-4 w-full" onClick={() => setShown((s) => s + PAGE)}>
                  {t('money.more', { count: Math.min(PAGE, list.length - shown) })}
                </button>
              )}
            </div>
          )}
        </section>

        <div className="order-first flex flex-col gap-6 lg:order-none">
          <section className="card p-5 sm:p-6" aria-labelledby="summary-title">
            <h2 id="summary-title" className="eyebrow">
              {t('money.last30')}
            </h2>
            <dl className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-enough/25 bg-enough-soft p-4">
                <dt className="flex items-center gap-1.5 text-xs font-medium text-muted">
                  <Icon name="arrowDown" size={14} />
                  {t('money.in')}
                </dt>
                <dd className="num mt-2 font-heading text-[26px] font-bold leading-none tracking-[-0.03em] text-ink">{formatZAR(Math.round(last30.income))}</dd>
              </div>
              <div className="rounded-xl border border-line bg-surface-2 p-4">
                <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                  <Icon name="arrowUp" size={14} />
                  {t('money.out')}
                </dt>
                <dd className="num mt-2 font-heading text-[26px] font-bold leading-none tracking-[-0.03em] text-ink">{formatZAR(Math.round(last30.out))}</dd>
              </div>
            </dl>
            <p className="num mt-4 text-sm text-muted">{t('money.balance', { amount: formatZAR(record.balance) })}</p>
          </section>

          <SpendingCard transactions={record.transactions} today={today} />

          <section className="card p-6" aria-labelledby="bills-title">
            <div className="flex items-center gap-2">
              <Icon name="repeat" size={18} className="text-accent" />
              <h2 id="bills-title" className="font-heading text-h3 text-ink">
                {t('money.bills')}
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted">{t('money.billsRule')}</p>
            {forecast.recurringBills.length === 0 ? (
              <p className="mt-4 text-sm text-muted">{t('money.noBills')}</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {forecast.recurringBills.map((b) => (
                  <li key={b.key} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{b.description}</p>
                      <p className="num text-xs text-muted">{t('money.billNext', { date: d.dayShort(b.nextDate), count: b.occurrences })}</p>
                    </div>
                    <p className="num shrink-0 font-semibold">{formatZAR(b.amount)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card hidden p-6 lg:block" aria-labelledby="import-title">
            <h2 id="import-title" className="font-heading text-h3 text-ink">
              {t('money.importTitle')}
            </h2>
            <p className="mt-1 text-sm text-muted">{t('money.importBody')}</p>
            <Link to="/app/money/import" className="btn-secondary mt-4 w-full">
              <Icon name="upload" size={18} />
              {t('money.import')}
            </Link>
          </section>
        </div>
      </div>

      <TransactionEditor tx={editing} onClose={() => setEditing(null)} />
    </>
  );
}
