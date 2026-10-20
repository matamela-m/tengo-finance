import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePersona, useRecordPersona } from '../../data/PersonaProvider';
import { accountsOf, totalOf, type Account, type AccountKind } from '../../data/repository';
import { parseAmount } from '../../lib/csv';
import { formatZAR } from '../../lib/format';
import { CashQuickAdd } from '../CashQuickAdd';
import { Icon, type IconName } from '../Icon';

const ICON: Record<AccountKind, IconName> = { bank: 'money', cash: 'coins', wallet: 'wallet' };

/** Every place money is kept, with a balance each. The forecast uses the total. */
export function AccountsCard() {
  const { t } = useTranslation();
  const { record } = useRecordPersona();
  const { updateMoney } = usePersona();
  const accounts = accountsOf(record);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<{ account: Account; text: string }[]>([]);

  const start = () => {
    setDraft(accounts.map((a) => ({ account: a, text: String(a.balance) })));
    setEditing(true);
  };
  const valid = draft.every((d) => parseAmount(d.text) !== null && d.account.name.trim() !== '');
  const save = async () => {
    if (!valid) return;
    await updateMoney({ accounts: draft.map((d) => ({ ...d.account, name: d.account.name.trim(), balance: parseAmount(d.text)! })) });
    setEditing(false);
  };
  const addWallet = () =>
    setDraft((list) => [...list, { account: { id: `w${Date.now().toString(36)}`, kind: 'wallet', name: t('accounts.walletName'), balance: 0 }, text: '0' }]);

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="accounts-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="accounts-title" className="font-heading text-h3 text-ink">
          {t('accounts.title')}
        </h2>
        {!editing && (
          <button type="button" className="btn-ghost -mr-3 min-h-[44px] px-3 text-sm text-accent" onClick={start}>
            <Icon name="edit" size={16} />
            {t('accounts.edit')}
          </button>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">{t('accounts.lead')}</p>
      {!editing ? (
        <>
          <ul className="mt-3 divide-y divide-line">
            {accounts.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="flex min-w-0 items-center gap-2.5">
                  <Icon name={ICON[a.kind]} size={18} className="shrink-0 text-muted" />
                  <span className="truncate font-medium">{a.name}</span>
                </span>
                <span className="num shrink-0 font-semibold">{formatZAR(a.balance)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center justify-between border-t border-line pt-3">
            <span className="text-sm font-semibold">{t('accounts.total')}</span>
            <span className="num font-heading text-[20px] font-bold">{formatZAR(totalOf(accounts))}</span>
          </div>
          <CashQuickAdd className="mt-4 w-full" />
        </>
      ) : (
        <form
          className="mt-3 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          {draft.map((d, i) => (
            <fieldset key={d.account.id} className="rounded-xl bg-surface-2/60 p-3">
              <legend className="sr-only">{d.account.name}</legend>
              <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-2">
                <div>
                  <label className="label" htmlFor={`acc-name-${i}`}>
                    {t('accounts.name')}
                  </label>
                  <input
                    id={`acc-name-${i}`}
                    className="field"
                    value={d.account.name}
                    onChange={(e) => setDraft((l) => l.map((x, j) => (j === i ? { ...x, account: { ...x.account, name: e.target.value } } : x)))}
                  />
                </div>
                <div>
                  <label className="label" htmlFor={`acc-bal-${i}`}>
                    {t('accounts.balance')}
                  </label>
                  <input
                    id={`acc-bal-${i}`}
                    inputMode="decimal"
                    className="field num"
                    value={d.text}
                    aria-invalid={parseAmount(d.text) === null}
                    onChange={(e) => setDraft((l) => l.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
                  />
                </div>
              </div>
              {d.account.kind === 'wallet' && (
                <button type="button" className="btn-ghost -ml-3 mt-1 min-h-[44px] px-3 text-sm text-muted" onClick={() => setDraft((l) => l.filter((_, j) => j !== i))}>
                  <Icon name="trash" size={16} />
                  {t('accounts.remove')}
                </button>
              )}
            </fieldset>
          ))}
          <button type="button" className="btn-secondary min-h-[44px]" onClick={addWallet}>
            <Icon name="plus" size={16} />
            {t('accounts.addWallet')}
          </button>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary flex-1" disabled={!valid}>
              {t('common.save')}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
