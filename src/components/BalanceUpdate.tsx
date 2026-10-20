import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePersona } from '../data/PersonaProvider';
import { parseAmount } from '../lib/csv';
import { useAnnounce } from './A11y';

/** A small form to enter today's balance. Saving makes the forecast run from today. */
export function BalanceUpdate({ initial, onDone, compact = false }: { initial?: number; onDone?: () => void; compact?: boolean }) {
  const { t } = useTranslation();
  const id = useId();
  const { setBalance } = usePersona();
  const announce = useAnnounce();
  const [text, setText] = useState(initial !== undefined ? String(initial) : '');
  const [saving, setSaving] = useState(false);
  const value = parseAmount(text);
  const invalid = text.trim() !== '' && value === null;

  const save = async () => {
    if (value === null) return;
    setSaving(true);
    await setBalance(value);
    setSaving(false);
    announce(t('balance.saved'));
    onDone?.();
  };

  return (
    <form
      className={`flex flex-wrap items-end gap-2 ${compact ? '' : 'mt-3'}`}
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <div className="min-w-[160px] flex-1">
        <label className="label" htmlFor={`${id}-bal`}>
          {t('balance.label')}
        </label>
        <input
          id={`${id}-bal`}
          inputMode="decimal"
          className="field num"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${id}-err` : undefined}
        />
      </div>
      <button type="submit" className="btn-primary min-h-[48px]" disabled={saving || value === null}>
        {t('balance.save')}
      </button>
      {invalid && (
        <p id={`${id}-err`} className="w-full text-xs font-medium text-short">
          {t('balance.error')}
        </p>
      )}
    </form>
  );
}
