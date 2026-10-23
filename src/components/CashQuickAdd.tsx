import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePersona } from '../data/PersonaProvider';
import { parseAmount } from '../lib/csv';
import { useAnnounce } from './A11y';
import { Drawer } from './Drawer';
import { Icon } from './Icon';
import { Segmented } from './Segmented';

type Mode = 'in' | 'out' | 'hand';

/**
 * One-tap cash entry: cash in, cash out, or how much cash is on hand right now. Cash in and out are
 * entries on the cash account, so they feed the forecast like any transaction; cash on hand only sets
 * the cash balance, which counts in the total.
 */
export function CashQuickAdd({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  const announce = useAnnounce();
  const { addCash, setCashOnHand } = usePersona();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('out');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const value = parseAmount(amount);
  const valid = value !== null && (mode === 'hand' ? value >= 0 : value > 0);

  const save = async () => {
    if (!valid || value === null) return;
    setSaving(true);
    try {
      if (mode === 'hand') await setCashOnHand(value);
      else await addCash(mode, value, note);
      announce(t('cash.saved'));
      setAmount('');
      setNote('');
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button type="button" className={`btn-secondary min-h-[44px] ${className}`} onClick={() => setOpen(true)}>
        <Icon name="coins" size={18} />
        {t('cash.add')}
      </button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={t('cash.title')}
        footer={
          <div className="flex gap-3">
            <button type="submit" form="cash-form" className="btn-primary flex-1" disabled={!valid || saving}>
              {saving ? t('common.saving') : t('common.save')}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </button>
          </div>
        }
      >
        <form
          id="cash-form"
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <Segmented
            label={t('cash.kind')}
            value={mode}
            onChange={setMode}
            options={(['in', 'out', 'hand'] as const).map((m) => ({ value: m, label: t(`cash.modes.${m}`) }))}
          />
          <p className="text-sm text-muted">{t(`cash.hints.${mode}`)}</p>
          <div>
            <label className="label" htmlFor="cash-amount">
              {t('plan.amount')}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-muted">R</span>
              <input
                id="cash-amount"
                data-autofocus
                inputMode="decimal"
                className="field num pl-8 text-lg font-semibold"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                aria-invalid={amount !== '' && !valid}
                aria-describedby={amount !== '' && !valid ? 'cash-err' : undefined}
              />
            </div>
            {amount !== '' && !valid && (
              <p id="cash-err" role="alert" className="mt-1 text-xs font-medium text-danger-text">
                {t('plan.amountError')}
              </p>
            )}
          </div>
          {mode !== 'hand' && (
            <div>
              <label className="label" htmlFor="cash-note">
                {t('plan.label')}
              </label>
              <input id="cash-note" className="field" value={note} placeholder={t(`cash.notePlaceholder.${mode}`)} onChange={(e) => setNote(e.target.value)} />
            </div>
          )}
        </form>
      </Drawer>
    </>
  );
}
