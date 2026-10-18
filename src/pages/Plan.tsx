import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CoverBars } from '../components/CoverBars';
import { Notice } from '../components/Feedback';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { Segmented } from '../components/Segmented';
import { StateChip } from '../components/StateChip';
import { useReadyPersona } from '../data/PersonaProvider';
import { addDays } from '../engine/dates';
import { loanCheck, whatIf } from '../engine/forecast';
import type { Forecast } from '../engine/types';
import { parseAmount } from '../lib/csv';
import { formatZAR } from '../lib/format';
import { useDates } from '../lib/useLang';

interface Item {
  id: number;
  kind: 'income' | 'expense';
  amount: string;
  date: string;
  label: string;
}

function DeltaBadge({ days }: { days: number }) {
  const { t } = useTranslation();
  if (days === 0) return <span className="rounded-full bg-surface-2 px-3 py-1 text-sm font-semibold text-muted">{t('plan.noChange')}</span>;
  const up = days > 0;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${up ? 'bg-enough-soft text-enough' : 'bg-short-soft text-short'}`}>
      <Icon name={up ? 'arrowUp' : 'arrowDown'} size={14} strokeWidth={2.4} />
      {up ? t('plan.daysMore', { count: days }) : t('plan.daysLess', { count: -days })}
    </span>
  );
}

function Outcome({ label, f }: { label: string; f: Forecast }) {
  const { t } = useTranslation();
  const d = useDates();
  return (
    <div className="min-w-0 rounded-2xl bg-surface-2 p-4">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="num mt-1 text-sm text-muted">{f.state === 'short' ? t('hero.shortFrom') : t('hero.enoughUntil')}</p>
      <p className="num font-heading text-[22px] font-extrabold leading-tight tracking-tight sm:text-[26px]">{d.dayShort(f.headlineDate)}</p>
      <div className="mt-2 flex items-center gap-2">
        <StateChip state={f.state} size="sm" />
        <CoverBars state={f.state} size={20} />
      </div>
    </div>
  );
}

function WhatIf() {
  const { t } = useTranslation();
  const d = useDates();
  const { record, today } = useReadyPersona();
  const tomorrow = addDays(today, 1);
  const [items, setItems] = useState<Item[]>([{ id: 1, kind: 'expense', amount: '500', date: tomorrow, label: '' }]);
  const [nextId, setNextId] = useState(2);

  const parsed = items
    .map((i) => ({ ...i, value: parseAmount(i.amount) }))
    .filter((i): i is Item & { value: number } => i.value !== null && i.value > 0 && Boolean(i.date));
  const result = useMemo(
    () =>
      whatIf(
        { transactions: record.transactions, balance: record.balance, today },
        parsed.map((i) => ({ date: i.date, amount: i.kind === 'income' ? i.value : -i.value, description: i.label || i.kind })),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [record, today, JSON.stringify(parsed)],
  );

  const update = (id: number, patch: Partial<Item>) => setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  return (
    <section className="card p-6 sm:p-7" aria-labelledby="whatif-title">
      <div className="flex items-center gap-2">
        <Icon name="sliders" size={20} className="text-accent" />
        <h2 id="whatif-title" className="text-xl font-semibold">
          {t('plan.whatIf')}
        </h2>
      </div>
      <p className="mt-1 text-sm text-muted">{t('plan.whatIfLead')}</p>

      <ul className="mt-5 space-y-3">
        {items.map((item, idx) => (
          <li key={item.id} className="rounded-2xl border border-line p-4">
            <fieldset>
              <legend className="sr-only">{t('plan.itemLabel', { n: idx + 1 })}</legend>
              <div className="flex items-center justify-between gap-3">
                <Segmented
                  label={t('plan.kind')}
                  value={item.kind}
                  onChange={(k) => update(item.id, { kind: k })}
                  options={(['income', 'expense'] as const).map((k) => ({ value: k, label: t(`plan.${k}`) }))}
                />
                <button
                  type="button"
                  onClick={() => setItems((l) => l.filter((i) => i.id !== item.id))}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-surface-2"
                  aria-label={t('plan.remove', { n: idx + 1 })}
                >
                  <Icon name="trash" size={18} />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor={`amt-${item.id}`}>
                    {t('plan.amount')}
                  </label>
                  <input
                    id={`amt-${item.id}`}
                    inputMode="decimal"
                    className="field num"
                    value={item.amount}
                    onChange={(e) => update(item.id, { amount: e.target.value })}
                    aria-invalid={item.amount !== '' && !(parseAmount(item.amount)! > 0)}
                    aria-describedby={item.amount !== '' && !(parseAmount(item.amount)! > 0) ? `amt-err-${item.id}` : undefined}
                  />
                  {item.amount !== '' && !(parseAmount(item.amount)! > 0) && (
                    <p id={`amt-err-${item.id}`} className="mt-1 text-xs font-medium text-short">
                      {t('plan.amountError')}
                    </p>
                  )}
                </div>
                <div>
                  <label className="label" htmlFor={`date-${item.id}`}>
                    {t('plan.date')}
                  </label>
                  <input id={`date-${item.id}`} type="date" min={today} className="field num" value={item.date} onChange={(e) => update(item.id, { date: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor={`lbl-${item.id}`}>
                    {t('plan.label')}
                  </label>
                  <input id={`lbl-${item.id}`} className="field" placeholder={t('plan.labelPlaceholder')} value={item.label} onChange={(e) => update(item.id, { label: e.target.value })} />
                </div>
              </div>
            </fieldset>
          </li>
        ))}
      </ul>
      {items.length === 0 && <p className="mt-4 text-sm text-muted">{t('plan.noItems')}</p>}
      <button
        type="button"
        className="btn-secondary mt-3"
        onClick={() => {
          setItems((l) => [...l, { id: nextId, kind: 'income', amount: '', date: tomorrow, label: '' }]);
          setNextId((n) => n + 1);
        }}
      >
        <Icon name="plus" size={18} />
        {t('plan.add')}
      </button>

      <div className="mt-6 border-t border-line pt-5">
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {t('plan.whatIfSpoken', {
            label: result.after.state === 'short' ? t('hero.shortFrom') : t('hero.enoughUntil'),
            date: d.weekdayLong(result.after.headlineDate),
            state: t(`state.${result.after.state}`),
            change: result.deltaDays === 0 ? t('plan.noChange') : result.deltaDays > 0 ? t('plan.daysMore', { count: result.deltaDays }) : t('plan.daysLess', { count: -result.deltaDays }),
          })}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold">{t('plan.result')}</h3>
          <DeltaBadge days={result.deltaDays} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Outcome label={t('plan.now')} f={result.before} />
          <Outcome label={t('plan.withChanges')} f={result.after} />
        </div>
        <p className="num mt-3 text-sm text-muted">
          {t('plan.stsChange', { before: formatZAR(result.before.safeToSpendToday), after: formatZAR(result.after.safeToSpendToday) })}
        </p>
      </div>
    </section>
  );
}

function LoanCheck() {
  const { t } = useTranslation();
  const d = useDates();
  const { record, today } = useReadyPersona();
  const [amount, setAmount] = useState('300');
  const value = parseAmount(amount);
  const valid = value !== null && value > 0;
  const result = useMemo(() => loanCheck({ transactions: record.transactions, balance: record.balance, today }, valid ? value : 0), [record, today, valid, value]);
  const worse = result.after.state !== result.before.state;

  return (
    <section className="card p-6 sm:p-7" aria-labelledby="loan-title">
      <div className="flex items-center gap-2">
        <Icon name="scale" size={20} className="text-accent" />
        <h2 id="loan-title" className="text-xl font-semibold">
          {t('plan.loan')}
        </h2>
      </div>
      <p className="mt-1 text-sm text-muted">{t('plan.loanLead')}</p>

      <div className="mt-5 rounded-3xl bg-accent-soft p-5">
        <p className="text-sm font-semibold text-ink">{t('plan.safeToLend')}</p>
        <p className="num mt-1 font-heading text-[40px] font-extrabold leading-none text-ink">{formatZAR(result.safeToLend)}</p>
        <p className="mt-2 text-sm text-muted">{result.before.state === 'short' ? t('plan.safeToLendShort') : t('plan.safeToLendHint', { state: t(`state.${result.before.state}`) })}</p>
      </div>

      <div className="mt-5">
        <label className="label" htmlFor="loan-amount">
          {t('plan.loanAmount')}
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-muted">R</span>
          <input
            id="loan-amount"
            inputMode="decimal"
            className="field num pl-8 text-lg font-semibold"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-invalid={!valid && amount !== ''}
            aria-describedby={!valid && amount !== '' ? 'loan-err' : undefined}
          />
        </div>
        {!valid && amount !== '' && (
          <p id="loan-err" className="mt-1 text-xs font-medium text-short">
            {t('plan.amountError')}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {[200, 500, 1000].map((v) => (
            <button key={v} type="button" className="num min-h-[40px] rounded-full bg-surface-2 px-4 text-sm font-semibold hover:bg-line" onClick={() => setAmount(String(v))}>
              {formatZAR(v)}
            </button>
          ))}
          {result.safeToLend > 0 && (
            <button type="button" className="num min-h-[40px] rounded-full border border-accent px-4 text-sm font-semibold text-accent" onClick={() => setAmount(String(result.safeToLend))}>
              {t('plan.useSafe', { amount: formatZAR(result.safeToLend) })}
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {valid
            ? t('plan.loanSpoken', {
                amount: formatZAR(value),
                label: result.after.state === 'short' ? t('hero.shortFrom') : t('hero.enoughUntil'),
                date: d.weekdayLong(result.after.headlineDate),
                state: t(`state.${result.after.state}`),
                count: result.daysOff,
              })
            : ''}
        </p>
        {!valid ? (
          <p className="text-sm text-muted">{t('plan.enterAmount')}</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold">{t('plan.ifLend', { amount: formatZAR(value) })}</h3>
              <DeltaBadge days={-result.daysOff} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Outcome label={t('plan.now')} f={result.before} />
              <Outcome label={t('plan.afterLoan')} f={result.after} />
            </div>
            {worse && (
              <Notice tone={result.after.state === 'short' ? 'danger' : 'warn'} className="mt-4">
                {t('plan.stateDrops', { from: t(`state.${result.before.state}`), to: t(`state.${result.after.state}`) })}
              </Notice>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default function PlanPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t('plan.title')} lead={t('plan.lead')} />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <WhatIf />
        <LoanCheck />
      </div>
    </>
  );
}
