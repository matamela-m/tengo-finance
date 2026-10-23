import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Arrival, SetupAnswers } from '../engine/setup';
import { parseAmount } from '../lib/csv';
import { useDates } from '../lib/useLang';
import { Icon } from './Icon';
import { Segmented } from './Segmented';

interface BillDraft {
  key: number;
  name: string;
  amount: string;
  day: string;
}

export interface ManualSetupResult {
  answers: SetupAnswers;
  balance: number;
}

/**
 * Setup for people without a statement: balance, how money usually arrives, typical amounts and regular
 * bills. The answers make an estimated starting history, labelled as such, replaced as real entries arrive.
 */
export function ManualSetupForm({ onSubmit, submitLabel, busy = false }: { onSubmit: (r: ManualSetupResult) => void; submitLabel: string; busy?: boolean }) {
  const { t } = useTranslation();
  const d = useDates();
  const [balance, setBalance] = useState('');
  const [arrives, setArrives] = useState<Arrival>('weekly');
  const [amount, setAmount] = useState('');
  const [weekday, setWeekday] = useState('5');
  const [dom, setDom] = useState('25');
  const [every, setEvery] = useState('7');
  const [spend, setSpend] = useState('');
  const [bills, setBills] = useState<BillDraft[]>([]);
  const [tried, setTried] = useState(false);

  const nums = { balance: parseAmount(balance), amount: parseAmount(amount), spend: parseAmount(spend), dom: Number(dom), every: Number(every) };
  const billsOk = bills.every((b) => b.name.trim() && (parseAmount(b.amount) ?? 0) > 0 && Number(b.day) >= 1 && Number(b.day) <= 31);
  const errors = {
    balance: nums.balance === null,
    amount: nums.amount === null || nums.amount <= 0,
    spend: nums.spend === null || nums.spend < 0,
    dom: arrives === 'monthly' && !(nums.dom >= 1 && nums.dom <= 31),
    every: arrives === 'irregular' && !(nums.every >= 2 && nums.every <= 60),
  };
  const valid = !Object.values(errors).some(Boolean) && billsOk;

  const submit = () => {
    setTried(true);
    if (!valid) return;
    onSubmit({
      balance: nums.balance!,
      answers: {
        arrives,
        amount: nums.amount!,
        weekday: Number(weekday),
        dayOfMonth: nums.dom,
        everyDays: nums.every,
        dailySpend: nums.spend!,
        bills: bills.map((b) => ({ name: b.name.trim(), amount: parseAmount(b.amount)!, dayOfMonth: Number(b.day) })),
      },
    });
  };

  const err = (show: boolean, id: string) =>
    tried && show ? (
      <p id={id} role="alert" className="mt-1 text-xs font-medium text-danger-text">
        {t('setup.fieldError')}
      </p>
    ) : null;

  return (
    <form
      className="space-y-6"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <p className="flex items-start gap-2 rounded-xl bg-surface-2 px-3 py-2 text-sm text-muted">
        <Icon name="info" size={16} className="mt-0.5 shrink-0" />
        {t('setup.pretend')}
      </p>
      <div>
        <label className="label" htmlFor="setup-balance">
          {t('setup.balance')}
        </label>
        <input id="setup-balance" inputMode="decimal" className="field num" value={balance} onChange={(e) => setBalance(e.target.value)} aria-invalid={tried && errors.balance} aria-describedby="setup-balance-err" />
        {err(errors.balance, 'setup-balance-err')}
      </div>
      <div>
        <p className="label" aria-hidden>
          {t('setup.arrives')}
        </p>
        <Segmented label={t('setup.arrives')} value={arrives} onChange={setArrives} options={(['daily', 'weekly', 'monthly', 'irregular'] as const).map((a) => ({ value: a, label: t(`setup.arrival.${a}`) }))} />
        <p className="mt-2 text-sm text-muted">{t(`setup.arrivalHint.${arrives}`)}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="setup-amount">
            {t(arrives === 'daily' ? 'setup.amountDaily' : 'setup.amount')}
          </label>
          <input id="setup-amount" inputMode="decimal" className="field num" value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={tried && errors.amount} aria-describedby="setup-amount-err" />
          {err(errors.amount, 'setup-amount-err')}
        </div>
        {arrives === 'weekly' && (
          <div>
            <label className="label" htmlFor="setup-weekday">
              {t('setup.weekday')}
            </label>
            <select id="setup-weekday" className="field" value={weekday} onChange={(e) => setWeekday(e.target.value)}>
              {[1, 2, 3, 4, 5, 6, 0].map((w) => (
                <option key={w} value={w}>
                  {d.weekday(`2026-10-${String(18 + w).padStart(2, '0')}`)}
                </option>
              ))}
            </select>
          </div>
        )}
        {arrives === 'monthly' && (
          <div>
            <label className="label" htmlFor="setup-dom">
              {t('setup.dayOfMonth')}
            </label>
            <input id="setup-dom" inputMode="numeric" className="field num" value={dom} onChange={(e) => setDom(e.target.value)} aria-invalid={tried && errors.dom} aria-describedby="setup-dom-err" />
            {err(errors.dom, 'setup-dom-err')}
          </div>
        )}
        {arrives === 'irregular' && (
          <div>
            <label className="label" htmlFor="setup-every">
              {t('setup.everyDays')}
            </label>
            <input id="setup-every" inputMode="numeric" className="field num" value={every} onChange={(e) => setEvery(e.target.value)} aria-invalid={tried && errors.every} aria-describedby="setup-every-err" />
            {err(errors.every, 'setup-every-err')}
          </div>
        )}
      </div>
      <div>
        <label className="label" htmlFor="setup-spend">
          {t('setup.dailySpend')}
        </label>
        <input id="setup-spend" inputMode="decimal" className="field num" value={spend} onChange={(e) => setSpend(e.target.value)} aria-invalid={tried && errors.spend} aria-describedby="setup-spend-hint setup-spend-err" />
        <p id="setup-spend-hint" className="mt-1 text-xs text-muted">
          {t('setup.dailySpendHint')}
        </p>
        {err(errors.spend, 'setup-spend-err')}
      </div>
      <fieldset>
        <legend className="label">{t('setup.bills')}</legend>
        <p className="-mt-1 mb-2 text-sm text-muted">{t('setup.billsHint')}</p>
        <ul className="space-y-3">
          {bills.map((b, i) => (
            <li key={b.key} className="grid grid-cols-[minmax(0,1fr)_96px_72px_44px] items-end gap-2">
              <div>
                <label className="label" htmlFor={`bill-name-${b.key}`}>
                  {t('setup.billName')}
                </label>
                <input id={`bill-name-${b.key}`} className="field" value={b.name} onChange={(e) => setBills((l) => l.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              </div>
              <div>
                <label className="label" htmlFor={`bill-amt-${b.key}`}>
                  {t('plan.amount')}
                </label>
                <input id={`bill-amt-${b.key}`} inputMode="decimal" className="field num" value={b.amount} onChange={(e) => setBills((l) => l.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} />
              </div>
              <div>
                <label className="label" htmlFor={`bill-day-${b.key}`}>
                  {t('setup.billDay')}
                </label>
                <input id={`bill-day-${b.key}`} inputMode="numeric" className="field num" value={b.day} onChange={(e) => setBills((l) => l.map((x, j) => (j === i ? { ...x, day: e.target.value } : x)))} />
              </div>
              <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-surface-2" aria-label={t('setup.removeBill', { n: i + 1 })} onClick={() => setBills((l) => l.filter((_, j) => j !== i))}>
                <Icon name="trash" size={18} />
              </button>
            </li>
          ))}
        </ul>
        {tried && !billsOk && (
          <p role="alert" className="mt-1 text-xs font-medium text-danger-text">
            {t('setup.billError')}
          </p>
        )}
        <button type="button" className="btn-secondary mt-3 min-h-[44px]" onClick={() => setBills((l) => [...l, { key: Date.now(), name: '', amount: '', day: '1' }])}>
          <Icon name="plus" size={16} />
          {t('setup.addBill')}
        </button>
      </fieldset>
      <p className="text-sm text-muted">{t('setup.estimatedNote')}</p>
      <button type="submit" className="btn-primary min-h-[52px] w-full sm:w-auto" disabled={busy}>
        {busy ? t('common.saving') : submitLabel}
      </button>
    </form>
  );
}
