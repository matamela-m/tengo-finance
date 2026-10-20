import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../components/Avatar';
import { DemoChip } from '../components/DemoChip';
import { Notice, PageLoading } from '../components/Feedback';
import type { IconName } from '../components/Icon';
import { Toggle } from '../components/Toggle';
import { IconTile } from '../components/ui';
import { Brand } from '../components/Brand';
import { usePersona } from '../data/PersonaProvider';
import { usePageTitle } from '../lib/usePageTitle';

const NOTICE: { key: string; icon: IconName }[] = [
  { key: 'what', icon: 'file' },
  { key: 'why', icon: 'calendar' },
  { key: 'who', icon: 'eye' },
  { key: 'where', icon: 'map' },
  { key: 'how', icon: 'clock' },
];

export default function Consent() {
  const { t } = useTranslation();
  usePageTitle(t('consent.title'));
  const navigate = useNavigate();
  const { personaId, profile, status, consent, setConsent } = usePersona();
  // Messages stay off until the person opts in.
  const [messages, setMessages] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!personaId || !profile) return <Navigate to="/start" replace />;
  if (status === 'ready' && consent) return <Navigate to="/app" replace />;

  const agree = async () => {
    setSaving(true);
    await setConsent({ core: true, messages, analytics }, 'consent.given', {
      messages: messages ? 'on' : 'off',
      analytics: analytics ? 'on' : 'off',
    });
    navigate('/app');
  };

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between gap-3 px-5 sm:px-8">
          <Brand size={22} />
          <DemoChip />
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-[1280px] px-5 pb-16 pt-8 sm:px-8">
        {status !== 'ready' ? (
          <PageLoading />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-10">
            <div>
              <div className="flex items-center gap-3">
                <Avatar persona={profile} size={44} />
                <p className="text-sm font-medium text-muted">{t('consent.as', { name: profile.name })}</p>
              </div>
              <p className="eyebrow mt-6">{t('consent.step')}</p>
              <h1 className="mt-3 font-heading text-h1 text-ink">{t('consent.title')}</h1>
              <p className="mt-3 text-lg text-muted">{t('consent.lead')}</p>
              <Notice tone="warn" icon="shield" className="mt-6">
                {t('privacy.simulated')}
              </Notice>
              <ul className="mt-6 space-y-3">
                {NOTICE.map((n) => (
                  <li key={n.key} className="card flex gap-4 p-5">
                    <IconTile name={n.icon} />
                    <div>
                      <h2 className="font-heading text-[17px] font-semibold text-ink">{t(`consent.notice.${n.key}.title`)}</h2>
                      <p className="mt-1 text-[15px] text-muted">{t(`consent.notice.${n.key}.body`)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <section className="lg:sticky lg:top-6 lg:self-start" aria-labelledby="choices-title">
              <div className="card p-6 sm:p-7">
                <h2 id="choices-title" className="font-heading text-h3 text-ink">
                  {t('consent.choices')}
                </h2>
                <div className="mt-4 divide-y divide-line">
                  <Toggle checked disabled label={t('consent.core.title')} description={t('consent.core.body')} badge={t('consent.required')} onChange={() => undefined} />
                  <Toggle checked={messages} onChange={setMessages} label={t('consent.messages.title')} description={t('consent.messages.body')} />
                  <Toggle checked={analytics} onChange={setAnalytics} label={t('consent.analytics.title')} description={t('consent.analytics.body')} />
                </div>
                <p className="mt-4 text-sm text-muted">{t('consent.changeLater')}</p>
                <button type="button" className="btn-primary mt-6 w-full min-h-[52px]" onClick={() => void agree()} disabled={saving}>
                  {saving ? t('common.saving') : t('consent.agree')}
                </button>
                <button type="button" className="btn-ghost mt-2 w-full" onClick={() => navigate('/start')}>
                  {t('consent.notNow')}
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
