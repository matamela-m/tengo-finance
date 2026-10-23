import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAnnounce } from '../components/A11y';
import { Notice } from '../components/Feedback';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { deviceProfileRepository, setOwnStorage } from '../data';
import { accountBackend, accountsAvailable, afterVerify, applyChoice, useAccount, type SignInChoice, type SignInSituation } from '../data/account';
import { CODE_COOLDOWN_S } from '../data/account/memoryBackend';
import { usePersona } from '../data/PersonaProvider';
import { OWN_ID } from '../data/seed/personas';
import { downloadText } from '../lib/sampleStatement';
import { usePageTitle } from '../lib/usePageTitle';

type Stage = 'email' | 'code' | 'choose' | 'done';

/**
 * Optional account for the person's own profile. Reached only after a guest has seen value. Passwordless:
 * a one-time code by email. The forecast keeps running on the device; the account only stores data.
 */
export default function AccountPage() {
  const { t } = useTranslation();
  usePageTitle(t('account.title'));
  const navigate = useNavigate();
  const announce = useAnnounce();
  const { personaId, record, reload, today } = usePersona();
  const { mode, email: savedEmail, setSignedIn, setSignedOut } = useAccount();
  const [stage, setStage] = useState<Stage>(mode === 'account' ? 'done' : 'email');
  const [email, setEmail] = useState('');
  const [adult, setAdult] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [situation, setSituation] = useState<SignInSituation | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [adultAt, setAdultAt] = useState('');

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  if (personaId !== OWN_ID) return <Navigate to="/app/me" replace />;
  if (!accountsAvailable()) {
    return (
      <>
        <PageHeader title={t('account.title')} lead={t('account.unavailable')} />
      </>
    );
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      const msg = (e as Error).message;
      setError(t(`account.errors.${['rate_limited', 'invalid_code'].includes(msg) ? msg : 'generic'}`));
    } finally {
      setBusy(false);
    }
  };

  const sendCode = () =>
    run(async () => {
      await accountBackend().requestCode(email.trim());
      setAdultAt(new Date().toISOString());
      setCooldown(CODE_COOLDOWN_S);
      setStage('code');
      announce(t('account.codeSent'));
    });

  const verify = () =>
    run(async () => {
      const user = await accountBackend().verifyCode(email.trim(), code);
      const local = await deviceProfileRepository.getRecord(OWN_ID, today);
      setSituation(await afterVerify(user, local));
      setStage('choose');
    });

  const choose = (choice: SignInChoice) =>
    run(async () => {
      const local = await deviceProfileRepository.getRecord(OWN_ID, today);
      await applyChoice(choice, local, deviceProfileRepository, adultAt);
      setSignedIn(situation?.user.email ?? email.trim(), adultAt);
      setOwnStorage('account');
      await accountBackend().addAudit('account.signedIn');
      await reload();
      setStage('done');
      announce(t('account.saved'));
      navigate(choice === 'startEmpty' ? '/welcome' : '/app');
    });

  const signOut = (everywhere: boolean) =>
    run(async () => {
      await accountBackend().signOut(everywhere);
      setSignedOut();
      setOwnStorage('device');
      navigate('/start', { replace: true });
    });

  const exportServer = (format: 'json' | 'csv') =>
    run(async () => {
      const data = (await accountBackend().exportAll()) as { transactions?: Record<string, unknown>[] };
      const stamp = new Date().toISOString().slice(0, 10);
      if (format === 'json') downloadText(`tengo-account-${stamp}.json`, JSON.stringify(data, null, 2), 'application/json');
      else {
        const { toCsv } = await import('../lib/csv');
        const rows = (data.transactions ?? []).map((x) => [String(x.date), String(x.description), String(x.amount), String(x.category), String(x.account_id ?? x.accountId ?? 'bank')]);
        downloadText(`tengo-account-${stamp}.csv`, toCsv([['date', 'description', 'amount', 'category', 'account'], ...rows]) + '\n');
      }
    });

  const deleteAccount = () =>
    run(async () => {
      const receipt = await accountBackend().deleteAccount();
      setSignedOut();
      setOwnStorage('device');
      navigate('/start', { replace: true, state: { receipt } });
    });

  return (
    <>
      <PageHeader title={t('account.title')} lead={stage === 'done' ? t('account.leadSaved') : t('account.lead')} />
      <div className="grid max-w-3xl gap-6">
        {error && (
          <div role="alert">
            <Notice tone="danger">{error}</Notice>
          </div>
        )}

        {stage === 'email' && (
          <section className="card p-5 sm:p-7" aria-labelledby="acc-email">
            <h2 id="acc-email" className="font-heading text-h3 text-ink">
              {t('account.saveTitle')}
            </h2>
            <ul className="mt-3 list-outside list-disc space-y-1 pl-5 text-sm text-muted">
              {(['passwordless', 'device', 'where', 'leave'] as const).map((k) => (
                <li key={k}>{t(`account.facts.${k}`)}</li>
              ))}
            </ul>
            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void sendCode();
              }}
            >
              <div>
                <label className="label" htmlFor="acc-mail">
                  {t('account.email')}
                </label>
                <input id="acc-mail" type="email" autoComplete="email" inputMode="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <label className="flex min-h-[44px] cursor-pointer items-start gap-3 text-[15px]">
                <input type="checkbox" className="mt-0.5 h-5 w-5 accent-[var(--color-accent)]" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
                <span>{t('account.adult')}</span>
              </label>
              <p className="text-xs text-muted">{t('account.adultHint')}</p>
              <button type="submit" className="btn-primary min-h-[48px]" disabled={busy || !adult || !/^\S+@\S+\.\S+$/.test(email.trim())}>
                {t('account.sendCode')}
              </button>
            </form>
          </section>
        )}

        {stage === 'code' && (
          <section className="card p-5 sm:p-7" aria-labelledby="acc-code">
            <h2 id="acc-code" className="font-heading text-h3 text-ink">
              {t('account.codeTitle')}
            </h2>
            <p className="mt-1 text-sm text-muted">{t('account.codeLead', { email: email.trim() })}</p>
            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void verify();
              }}
            >
              <div>
                <label className="label" htmlFor="acc-otp">
                  {t('account.code')}
                </label>
                <input id="acc-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={8} className="field num text-lg tracking-[0.3em]" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="submit" className="btn-primary min-h-[48px]" disabled={busy || code.length < 6}>
                  {t('account.verify')}
                </button>
                <button type="button" className="btn-ghost min-h-[48px]" disabled={busy || cooldown > 0} onClick={() => void sendCode()}>
                  {cooldown > 0 ? t('account.resendIn', { count: cooldown }) : t('account.resend')}
                </button>
              </div>
            </form>
          </section>
        )}

        {stage === 'choose' && situation && (
          <section className="card p-5 sm:p-7" aria-labelledby="acc-choose">
            <h2 id="acc-choose" className="font-heading text-h3 text-ink">
              {situation.remote ? t('account.conflictTitle') : t('account.uploadTitle')}
            </h2>
            <p className="mt-1 text-sm text-muted">{situation.remote ? (situation.localHasData ? t('account.conflictLead') : t('account.useLead')) : situation.localHasData ? t('account.uploadLead') : t('account.emptyLead')}</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {situation.options.map((o, i) => (
                <button key={o} type="button" className={i === 0 ? 'btn-primary min-h-[48px]' : 'btn-secondary min-h-[48px]'} disabled={busy} onClick={() => void choose(o)}>
                  {t(`account.choices.${o}`)}
                </button>
              ))}
            </div>
            {situation.options.includes('replaceAccount') && <p className="mt-3 text-xs text-muted">{t('account.replaceWarn')}</p>}
          </section>
        )}

        {stage === 'done' && (
          <>
            <section className="card p-5 sm:p-7" aria-labelledby="acc-done">
              <h2 id="acc-done" className="flex items-center gap-2 font-heading text-h3 text-ink">
                <Icon name="cloud" size={20} className="text-link" />
                {t('account.signedInAs', { email: savedEmail ?? record?.profile?.nickname ?? '' })}
              </h2>
              <p className="mt-1 text-sm text-muted">{t('account.savedFacts')}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="btn-secondary min-h-[44px]" disabled={busy} onClick={() => void exportServer('json')}>
                  {t('privacy.exportJson')}
                </button>
                <button type="button" className="btn-secondary min-h-[44px]" disabled={busy} onClick={() => void exportServer('csv')}>
                  {t('privacy.exportCsv')}
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                <button type="button" className="btn-secondary min-h-[44px]" disabled={busy} onClick={() => void signOut(false)}>
                  {t('account.signOut')}
                </button>
                <button type="button" className="btn-ghost min-h-[44px]" disabled={busy} onClick={() => void signOut(true)}>
                  {t('account.signOutEverywhere')}
                </button>
              </div>
            </section>
            <section className="card p-5 sm:p-7" aria-labelledby="acc-delete">
              <h2 id="acc-delete" className="font-heading text-h3 text-ink">
                {t('account.deleteTitle')}
              </h2>
              <p className="mt-1 text-sm text-muted">{t('account.deleteBody')}</p>
              {confirmDelete ? (
                <div className="mt-4 space-y-3">
                  <Notice tone="danger">{t('account.deleteWarn')}</Notice>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn-danger min-h-[44px]" disabled={busy} onClick={() => void deleteAccount()}>
                      {t('account.deleteConfirm')}
                    </button>
                    <button type="button" className="btn-secondary min-h-[44px]" onClick={() => setConfirmDelete(false)}>
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="btn-secondary mt-4 min-h-[44px]" onClick={() => setConfirmDelete(true)}>
                  <Icon name="trash" size={16} />
                  {t('account.deleteTitle')}
                </button>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}
