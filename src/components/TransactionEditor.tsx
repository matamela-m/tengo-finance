import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePersona } from '../data/PersonaProvider';
import { useAnnounce } from './A11y';
import type { Category, Transaction } from '../engine/types';
import { parseAmount } from '../lib/csv';
import { Drawer } from './Drawer';
import { Notice } from './Feedback';

const CATEGORIES: Category[] = ['income', 'spend', 'bill'];

/** Correct or recategorise one transaction. Every save writes an audit entry. */
export function TransactionEditor({ tx, onClose }: { tx: Transaction | null; onClose: () => void }) {
  const { t } = useTranslation();
  const { updateTransaction } = usePersona();
  const announce = useAnnounce();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('spend');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!tx) return;
    setDescription(tx.description);
    setAmount(String(tx.amount));
    setCategory(tx.category);
  }, [tx]);

  if (!tx) return null;
  const parsed = parseAmount(amount);
  const valid = description.trim().length > 0 && parsed !== null && parsed !== 0;

  const save = async () => {
    if (!valid || parsed === null) return;
    setSaving(true);
    const changes: string[] = [];
    if (description.trim() !== tx.description) changes.push('description');
    if (parsed !== tx.amount) changes.push('amount');
    if (category !== tx.category) changes.push('category');
    if (changes.length) {
      await updateTransaction(tx.id, { description: description.trim(), amount: parsed, category }, { name: tx.description, fields: changes.join(', ') });
    }
    setSaving(false);
    announce(changes.length ? t('a11y.saved') : t('a11y.noChanges'));
    onClose();
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={t('edit.title')}
      footer={
        <div className="flex gap-3">
          <button type="submit" form="edit-form" className="btn-primary flex-1" disabled={!valid || saving}>
            {saving ? t('common.saving') : t('common.save')}
          </button>
          <button type="button" className="btn-secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
        </div>
      }
    >
      <form
        id="edit-form"
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div>
          <label className="label" htmlFor="edit-desc">
            {t('edit.description')}
          </label>
          <input id="edit-desc" className="field" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="edit-amount">
            {t('edit.amount')}
          </label>
          <input id="edit-amount" inputMode="decimal" className="field num" value={amount} onChange={(e) => setAmount(e.target.value)} aria-describedby="edit-amount-hint" aria-invalid={parsed === null} />
          <p id="edit-amount-hint" className="mt-1 text-xs text-muted">
            {t('edit.amountHint')}
          </p>
        </div>
        <fieldset>
          <legend className="label">{t('edit.category')}</legend>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((c) => (
              <label
                key={c}
                className={`flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[var(--color-focus)] ${
                  category === c ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface'
                }`}
              >
                <input type="radio" name="category" className="sr-only" checked={category === c} onChange={() => setCategory(c)} />
                {t(`category.${c}`)}
              </label>
            ))}
          </div>
        </fieldset>
        <Notice>{t('edit.auditNote')}</Notice>
      </form>
    </Drawer>
  );
}
