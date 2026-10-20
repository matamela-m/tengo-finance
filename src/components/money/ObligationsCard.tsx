import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePersona, useRecordPersona } from '../../data/PersonaProvider';
import { PROTECTED_OBLIGATIONS } from '../../engine/help';
import type { Obligation, ObligationKind } from '../../engine/types';
import { parseAmount } from '../../lib/csv';
import { formatZAR } from '../../lib/format';
import { useDates } from '../../lib/useLang';
import { Drawer } from '../Drawer';
import { Icon } from '../Icon';
import { Segmented } from '../Segmented';

const KINDS: ObligationKind[] = ['stokvel', 'burial', 'family', 'loan', 'other'];

interface Draft {
  id: string;
  kind: ObligationKind;
  name: string;
  amount: string;
  every: Obligation['every'];
  nextDate: string;
  movable: boolean;
}

/**
 * Money owed outside the bank, as first-class recurring items: stokvel, burial society, family support and
 * informal loans. They behave like bills in the forecast. Loans and burial societies can never be marked movable.
 */
export function ObligationsCard() {
  const { t } = useTranslation();
  const d = useDates();
  const { record, today } = useRecordPersona();
  const { updateMoney } = usePersona();
  const items = record.obligations ?? [];
  const [draft, setDraft] = useState<Draft | null>(null);

  const open = (o?: Obligation) =>
    setDraft(
      o
        ? { ...o, amount: String(o.amount) }
        : { id: `ob${Date.now().toString(36)}`, kind: 'stokvel', name: '', amount: '', every: 'month', nextDate: today, movable: false },
    );
  const amount = draft ? parseAmount(draft.amount) : null;
  const valid = Boolean(draft && draft.name.trim() && amount !== null && amount > 0 && draft.nextDate >= today);
  const canMove = draft ? !PROTECTED_OBLIGATIONS.includes(draft.kind) : false;
  const save = async () => {
    if (!draft || !valid || amount === null) return;
    const item: Obligation = { id: draft.id, kind: draft.kind, name: draft.name.trim(), amount, every: draft.every, nextDate: draft.nextDate, movable: canMove && draft.movable };
    const exists = items.some((o) => o.id === item.id);
    await updateMoney({ obligations: exists ? items.map((o) => (o.id === item.id ? item : o)) : [...items, item] });
    setDraft(null);
  };
  const remove = async (id: string) => {
    await updateMoney({ obligations: items.filter((o) => o.id !== id) });
    setDraft(null);
  };

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="ob-title">
      <div className="flex items-center gap-2">
        <Icon name="users" size={18} className="text-accent" />
        <h2 id="ob-title" className="font-heading text-h3 text-ink">
          {t('obligations.title')}
        </h2>
      </div>
      <p className="mt-1 text-sm text-muted">{t('obligations.lead')}</p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{t('obligations.none')}</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {items.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate font-medium">{o.name}</p>
                <p className="num text-xs text-muted">
                  {t(`obligations.kinds.${o.kind}`)} · {t(`obligations.every.${o.every}`)} · {t('obligations.next', { date: d.dayShort(o.nextDate) })}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className="num font-semibold">{formatZAR(o.amount)}</span>
                <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-surface-2" aria-label={t('obligations.editLabel', { name: o.name })} onClick={() => open(o)}>
                  <Icon name="edit" size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="btn-secondary mt-3 min-h-[44px]" onClick={() => open()}>
        <Icon name="plus" size={16} />
        {t('obligations.add')}
      </button>

      <Drawer
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft && items.some((o) => o.id === draft.id) ? t('obligations.editTitle') : t('obligations.addTitle')}
        footer={
          <div className="flex flex-wrap gap-3">
            <button type="submit" form="ob-form" className="btn-primary flex-1" disabled={!valid}>
              {t('common.save')}
            </button>
            {draft && items.some((o) => o.id === draft.id) && (
              <button type="button" className="btn-secondary" onClick={() => void remove(draft.id)}>
                <Icon name="trash" size={16} />
                {t('obligations.remove')}
              </button>
            )}
          </div>
        }
      >
        {draft && (
          <form
            id="ob-form"
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <div>
              <label className="label" htmlFor="ob-kind">
                {t('obligations.kind')}
              </label>
              <select id="ob-kind" className="field" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as ObligationKind })}>
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {t(`obligations.kinds.${k}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="ob-name">
                {t('obligations.name')}
              </label>
              <input id="ob-name" data-autofocus className="field" value={draft.name} placeholder={t(`obligations.placeholder.${draft.kind}`)} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="ob-amount">
                  {t('plan.amount')}
                </label>
                <input id="ob-amount" inputMode="decimal" className="field num" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="ob-next">
                  {t('obligations.nextLabel')}
                </label>
                <input id="ob-next" type="date" min={today} className="field num" value={draft.nextDate} onChange={(e) => setDraft({ ...draft, nextDate: e.target.value })} />
              </div>
            </div>
            <Segmented
              label={t('obligations.howOften')}
              value={draft.every}
              onChange={(every) => setDraft({ ...draft, every })}
              options={(['week', 'month'] as const).map((v) => ({ value: v, label: t(`obligations.every.${v}`) }))}
            />
            {canMove ? (
              <label className="flex min-h-[44px] cursor-pointer items-start gap-3 text-sm">
                <input type="checkbox" className="mt-0.5 h-5 w-5 accent-[var(--color-accent)]" checked={draft.movable} onChange={(e) => setDraft({ ...draft, movable: e.target.checked })} />
                <span>
                  <span className="font-medium">{t('money.movableLabel')}</span>
                  <span className="block text-muted">{t('obligations.movableHint')}</span>
                </span>
              </label>
            ) : (
              <p className="text-sm text-muted">{t('obligations.protected')}</p>
            )}
          </form>
        )}
      </Drawer>
    </section>
  );
}
