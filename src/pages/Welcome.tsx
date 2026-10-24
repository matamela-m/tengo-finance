import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Stepper } from '../components/Stepper';
import { Brand } from '../components/Brand';
import { ProfileChip } from '../components/DemoChip';
import { Notice, PageLoading } from '../components/Feedback';
import { DateHero } from '../components/forecast/DateHero';
import { Icon, type IconName } from '../components/Icon';
import { LanguageSelector } from '../components/LanguageSelector';
import { ManualSetupForm, type ManualSetupResult } from '../components/ManualSetupForm';
import { StateChip } from '../components/StateChip';
import { Toggle } from '../components/Toggle';
import { IconTile } from '../components/ui';
import { usePersona } from '../data/PersonaProvider';
import { accountsAvailable, useAccount } from '../data/account';
import { OWN_ID } from '../data/seed/personas';
import { estimatedHistory, SAMPLE_ANSWERS, SAMPLE_BANK_BALANCE, SAMPLE_CASH } from '../engine/setup';
import { NOTICE_VERSION } from '../lib/notice';
import { usePageTitle } from '../lib/usePageTitle';
import { useSession } from '../store/session';

const ASKS: { key: string; icon: IconName }[] = [
  { key: 'money', icon: 'money' },
  { key: 'bills', icon: 'receipt' },
  { key: 'never', icon: 'shield' },
  { key: 'where', icon: 'phone' },
];

type Way = 'choose' | 'manual';

/**
 * Onboarding for the person's own money, guest first: what Tengo asks for and why, consent choices
 * (messages and analytics off), add your money three ways, then the first forecast. The step reached is
 * saved, so it can be resumed.
 */
export default function Welcome() {
  const { t } = useTranslation();
  usePageTitle(t('welcome.title'));
  const navigate = useNavigate();
  const active = useSession((s) => s.activePersonaId);
  const setActive = useSession((s) => s.setActivePersona);
  const { personaId, status, record, consent, forecast, setConsent, updateProfile, saveManualSetup, updateMoney } = usePersona();
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState('');
  const [messages, setMessages] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [way, setWay] = useState<Way>('choose');
  const [busy, setBusy] = useState(false);
  const named = useRef(false);
  // Set when the person moves between steps, so focus goes to the new step's heading (not on first load).
  const moved = useRef(false);

  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    document.getElementById(`w${step}`)?.focus();
  }, [step]);
  const accountMode = useAccount((s) => s.mode);

  useEffect(() => {
    if (active !== OWN_ID) setActive(OWN_ID);
  }, [active, setActive]);

  // Resume where the person left off, once, when the profile first loads. Later changes to the profile (such as
  // going back a step) must not push the step forward again.
  const resumed = useRef(false);
  useEffect(() => {
    if (status !== 'ready' || !record || resumed.current) return;
    resumed.current = true;
    const saved = record.profile?.onboardingStep ?? 0;
    const reached = consent?.core ? Math.max(3, saved) : Math.max(1, Math.min(saved, 2));
    setStep((s) => Math.max(s, Math.min(reached, record.transactions.length > 0 ? 4 : 3)));
    if (!named.current) {
      named.current = true;
      setNickname(record.profile?.nickname ?? '');
    }
  }, [status, record, consent]);

  if (personaId && personaId !== OWN_ID) return <Navigate to="/start" replace />;
  if (status !== 'ready' || !record) {
    return (
      <Shell step={step}>
        <PageLoading />
      </Shell>
    );
  }

  const go = async (n: number, extra: { nickname?: string } = {}) => {
    await updateProfile({ onboardingStep: n, ...extra });
    if (n === 3) setWay('choose');
    setStep(n);
    moved.current = true;
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const agree = async () => {
    setBusy(true);
    try {
      await setConsent({ core: true, messages, analytics, noticeVersion: NOTICE_VERSION }, 'consent.given', { messages: messages ? 'on' : 'off', analytics: analytics ? 'on' : 'off' });
      await updateProfile({ noticeVersion: NOTICE_VERSION, nickname: nickname.trim() || undefined });
      await go(3);
    } finally {
      setBusy(false);
    }
  };

  const trySample = async () => {
    setBusy(true);
    try {
      const today = new Date();
      const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      await saveManualSetup(estimatedHistory(SAMPLE_ANSWERS, iso, undefined, 'sample'), SAMPLE_BANK_BALANCE);
      await updateMoney({
        accounts: [
          { id: 'bank', kind: 'bank', name: t('accounts.bankName'), balance: SAMPLE_BANK_BALANCE },
          { id: 'cash', kind: 'cash', name: t('accounts.cashName'), balance: SAMPLE_CASH },
        ],
      });
      await updateProfile({ sample: true });
      await go(4);
    } finally {
      setBusy(false);
    }
  };

  const manual = async ({ answers, balance }: ManualSetupResult) => {
    setBusy(true);
    try {
      const today = new Date();
      const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      await saveManualSetup(estimatedHistory(answers, iso), balance);
      await updateProfile({ sample: false });
      await go(4);
    } finally {
      setBusy(false);
    }
  };

  const toImport = async () => {
    await updateProfile({ onboardingStep: 4, sample: false });
    navigate('/app/money/import');
  };

  return (
    <Shell step={step} onGo={(n) => void go(n)}>
      {step === 1 && (
        <section aria-labelledby="w1">
          <h1 id="w1" tabIndex={-1} className="font-heading text-h1 text-ink outline-none">
            {t('welcome.s1.title')}
          </h1>
          <p className="mt-3 text-lg text-muted">{t('welcome.s1.lead')}</p>
          <ul className="mt-6 space-y-3">
            {ASKS.map((a) => (
              <li key={a.key} className="card flex gap-4 p-5">
                <IconTile name={a.icon} />
                <div>
                  <h2 className="font-heading text-[17px] font-semibold text-ink">{t(`welcome.s1.${a.key}.title`)}</h2>
                  <p className="mt-1 text-[15px] text-muted">{t(`welcome.s1.${a.key}.body`)}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 max-w-sm">
            <label className="label" htmlFor="nickname">
              {t('welcome.nickname')}
            </label>
            <input id="nickname" className="field" value={nickname} autoComplete="nickname" onChange={(e) => setNickname(e.target.value)} aria-describedby="nickname-hint" />
            <p id="nickname-hint" className="mt-1 text-xs text-muted">
              {t('welcome.nicknameHint')}
            </p>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button type="button" className="btn-primary min-h-[52px]" onClick={() => void go(2, { nickname: nickname.trim() || undefined })}>
              {t('welcome.next')}
              <Icon name="arrowRight" size={18} />
            </button>
            <button type="button" className="btn-ghost min-h-[52px]" onClick={() => void go(3)}>
              {t('welcome.back')}
            </button>
            {accountsAvailable() && accountMode === 'device' && (
              <Link to="/app/account" className="btn-ghost min-h-[52px]">
                {t('welcome.signIn')}
              </Link>
            )}
          </div>
        </section>
      )}

      {step === 2 && (
        <section aria-labelledby="w2">
          <h1 id="w2" tabIndex={-1} className="font-heading text-h1 text-ink outline-none">
            {t('welcome.s2.title')}
          </h1>
          <p className="mt-3 text-lg text-muted">{t('welcome.s2.lead')}</p>
          <div className="card mt-6 p-5 sm:p-6">
            <div className="divide-y divide-line">
              <Toggle checked disabled label={t('consent.core.title')} description={t('welcome.s2.core')} badge={t('consent.required')} onChange={() => undefined} />
              <Toggle checked={messages} onChange={setMessages} label={t('consent.messages.title')} description={t('consent.messages.body')} />
              <Toggle checked={analytics} onChange={setAnalytics} label={t('consent.analytics.title')} description={t('consent.analytics.body')} />
            </div>
            <p className="mt-4 text-sm text-muted">{t('consent.changeLater')}</p>
            <p className="mt-2 text-sm text-muted">
              {t('welcome.s2.notice')}{' '}
              <Link to="/privacy-notice" className="font-medium text-link underline-offset-4 hover:underline">
                {t('welcome.s2.noticeLink')}
              </Link>
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" className="btn-primary min-h-[52px]" disabled={busy} onClick={() => void agree()}>
              {busy ? t('common.saving') : t('consent.agree')}
            </button>
            <button type="button" className="btn-ghost min-h-[52px]" onClick={() => void go(1)}>
              {t('welcome.back')}
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section aria-labelledby="w3">
          <h1 id="w3" tabIndex={-1} className="font-heading text-h1 text-ink outline-none">
            {t('welcome.s3.title')}
          </h1>
          <p className="mt-3 text-lg text-muted">{t('welcome.s3.lead')}</p>
          <Notice icon="info" className="mt-4">
            {t('setup.pretend')}
          </Notice>
          {way === 'choose' ? (
            <ul className="mt-6 grid gap-3 md:grid-cols-3">
              <li>
                <button type="button" className="card-interactive flex h-full w-full flex-col items-start gap-3 p-5 text-left" onClick={() => void toImport()}>
                  <IconTile name="upload" tone="accent" />
                  <span className="font-heading text-[17px] font-semibold text-ink">{t('welcome.s3.import')}</span>
                  <span className="text-sm text-muted">{t('welcome.s3.importBody')}</span>
                </button>
              </li>
              <li>
                <button type="button" className="card-interactive flex h-full w-full flex-col items-start gap-3 p-5 text-left" onClick={() => setWay('manual')}>
                  <IconTile name="sliders" tone="accent" />
                  <span className="font-heading text-[17px] font-semibold text-ink">{t('welcome.s3.manual')}</span>
                  <span className="text-sm text-muted">{t('welcome.s3.manualBody')}</span>
                </button>
              </li>
              <li>
                <button type="button" className="card-interactive flex h-full w-full flex-col items-start gap-3 p-5 text-left" disabled={busy} onClick={() => void trySample()}>
                  <IconTile name="sparkle" tone="accent" />
                  <span className="font-heading text-[17px] font-semibold text-ink">{t('welcome.s3.sample')}</span>
                  <span className="text-sm text-muted">{t('welcome.s3.sampleBody')}</span>
                </button>
              </li>
            </ul>
          ) : null}
          {way === 'choose' && (
            <button type="button" className="btn-ghost mt-6 min-h-[48px]" onClick={() => void go(2)}>
              {t('welcome.back')}
            </button>
          )}
          {way === 'choose' ? null : (
            <div className="card mt-6 p-5 sm:p-7">
              <ManualSetupForm onSubmit={(r) => void manual(r)} submitLabel={t('setup.submit')} busy={busy} />
              <button type="button" className="btn-ghost mt-4" onClick={() => setWay('choose')}>
                {t('welcome.back')}
              </button>
            </div>
          )}
        </section>
      )}

      {step === 4 && forecast && (
        <section aria-labelledby="w4">
          <p className="eyebrow">{t('welcome.s4.eyebrow')}</p>
          <div id="w4" tabIndex={-1} className="mt-3 outline-none">
            <DateHero forecast={forecast} />
          </div>
          {forecast.status !== 'unclear' && <StateChip state={forecast.status} size="lg" className="mt-4" />}
          <p className="mt-4 max-w-xl text-muted">{record.profile?.sample ? t('welcome.s4.sample') : t('welcome.s4.lead')}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button type="button" className="btn-primary min-h-[52px]" onClick={() => navigate('/app')}>
              {t('welcome.s4.open')}
              <Icon name="arrowRight" size={18} />
            </button>
            <button type="button" className="btn-ghost min-h-[52px]" onClick={() => void go(3)}>
              {t('welcome.back')}
            </button>
            {accountsAvailable() && accountMode === 'device' && (
              <Link to="/app/account" className="btn-ghost min-h-[52px]">
                <Icon name="cloud" size={18} />
                {t('account.saveTitle')}
              </Link>
            )}
          </div>
        </section>
      )}
    </Shell>
  );
}

function Shell({ step, children, onGo }: { step: number; children: React.ReactNode; onGo?: (n: number) => void }) {
  const { t } = useTranslation();
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between gap-3 px-5 sm:px-8">
          <Link to="/start" className="rounded-md" aria-label={`Tengo, ${t('picker.backHome')}`}>
            <Brand size={22} />
          </Link>
          <ProfileChip />
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-[1100px] px-5 pb-16 pt-8 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="eyebrow">{t('welcome.step', { n: Math.min(step, 4), total: 4 })}</p>
          <LanguageSelector className="w-full sm:w-72" />
        </div>
        <div className="mt-4">
          <Stepper
            label={t('welcome.stepper.label')}
            steps={[t('welcome.stepper.s1'), t('welcome.stepper.s2'), t('welcome.stepper.s3'), t('welcome.stepper.s4')]}
            current={Math.min(step, 4)}
            doneLabel={t('welcome.stepper.done')}
            currentLabel={t('welcome.stepper.current')}
            onGo={onGo}
          />
        </div>
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
