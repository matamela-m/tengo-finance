import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CoverBars } from '../components/CoverBars';
import { Notice } from '../components/Feedback';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
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
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${up ? 'bg-enough-soft text-enough-text' : 'bg-short-soft text-short-text'}`}>
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
      <p className="num font-figures text-[22px] font-extrabold leading-tight tracking-tight sm:text-[26px]">{d.dayShort(f.headlineDate)}</p>
      <div className="mt-2 flex items-center gap-2">
        <StateChip state={f.state} size="sm" />
        <CoverBars state={f.state} size={20} />
      </div>
    </div>
  );
}

function WhatIf() {
  const { t } = useTranslation();
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
        <Icon name="sliders" size={20} className="text-brand-ink" />
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
                <div role="radiogroup" aria-label={t('plan.kind')} className="flex rounded-full bg-surface-2 p-1">
                  {(['income', 'expense'] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={item.kind === k}
                      onClick={() => update(item.id, { kind: k })}
                      className={`min-h-[36px] rounded-full px-4 text-sm font-semibold ${item.kind === k ? 'bg-surface text-ink shadow-card' : 'text-muted'}`}
                    >
                      {t(`plan.${k}`)}
                    </button>
                  ))}
                </div>
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
                  <input id={`amt-${item.id}`} inputMode="decimal" className="field num" value={item.amount} onChange={(e) => update(item.id, { amount: e.target.value })} />
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

      <div className="mt-6 border-t border-line pt-5" aria-live="polite">
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
  const { record, today } = useReadyPersona();
  const [amount, setAmount] = useState('300');
  const value = parseAmount(amount);
  const valid = value !== null && value > 0;
  const result = useMemo(() => loanCheck({ transactions: record.transactions, balance: record.balance, today }, valid ? value : 0), [record, today, valid, value]);
  const worse = result.after.state !== result.before.state;

  return (
    <section className="card p-6 sm:p-7" aria-labelledby="loan-title">
      <div className="flex items-center gap-2">
        <Icon name="scale" size={20} className="text-brand-ink" />
        <h2 id="loan-title" className="text-xl font-semibold">
          {t('plan.loan')}
        </h2>
      </div>
      <p className="mt-1 text-sm text-muted">{t('plan.loanLead')}</p>

      <div className="mt-5 rounded-3xl bg-mint/40 p-5 dark:bg-mint">
        <p className="text-sm font-semibold text-charcoal">{t('plan.safeToLend')}</p>
        <p className="num mt-1 font-figures text-[40px] font-extrabold leading-none text-charcoal">{formatZAR(result.safeToLend)}</p>
        <p className="mt-2 text-sm text-charcoal/80">{result.before.state === 'short' ? t('plan.safeToLendShort') : t('plan.safeToLendHint', { state: t(`state.${result.before.state}`) })}</p>
      </div>

      <div className="mt-5">
        <label className="label" htmlFor="loan-amount">
          {t('plan.loanAmount')}
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-muted">R</span>
          <input id="loan-amount" inputMode="decimal" className="field num pl-8 text-lg font-semibold" value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={!valid && amount !== ''} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[200, 500, 1000].map((v) => (
            <button key={v} type="button" className="num min-h-[40px] rounded-full bg-surface-2 px-4 text-sm font-semibold hover:bg-line" onClick={() => setAmount(String(v))}>
              {formatZAR(v)}
            </button>
          ))}
          {result.safeToLend > 0 && (
            <button type="button" className="num min-h-[40px] rounded-full border border-brand px-4 text-sm font-semibold text-brand-ink" onClick={() => setAmount(String(result.safeToLend))}>
              {t('plan.useSafe', { amount: formatZAR(result.safeToLend) })}
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-line pt-5" aria-live="polite">
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
