import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../components/Avatar';
import { LoadingBlock, Notice } from '../components/Feedback';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { Segmented } from '../components/Segmented';
import { Brand } from '../components/Brand';
import { usePersona, useReadyPersona } from '../data/PersonaProvider';
import type { LanguageCode } from '../i18n/languages';
import { LanguageSelect } from '../components/LanguageSelector';
import { SMS_LIMIT, type Channel, type DailyMessage } from '../messages/MessageWriter';
import { messageWriter } from '../messages/templates';
import { useSession } from '../store/session';

/** Renders *bold* markers the way WhatsApp does. */
function WhatsAppText({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line.split(/(\*[^*]+\*)/g).map((part, j) => (part.startsWith('*') && part.endsWith('*') ? <strong key={j}>{part.slice(1, -1)}</strong> : <Fragment key={j}>{part}</Fragment>))}
        </Fragment>
      ))}
    </>
  );
}

export default function InboxPage() {
  const { t } = useTranslation();
  const { forecast, profile } = useReadyPersona();
  const { consent, setConsent } = usePersona();
  const appLanguage = useSession((s) => s.language);
  const [channel, setChannel] = useState<Channel>('whatsapp');
  const [language, setLanguage] = useState<LanguageCode>(appLanguage);
  const [message, setMessage] = useState<DailyMessage | null>(null);
  const enabled = consent?.messages ?? false;

  useEffect(() => {
    if (!enabled) return;
    let live = true;
    setMessage(null);
    void messageWriter.write({ name: profile.name, forecast, language, channel }).then((m) => live && setMessage(m));
    return () => {
      live = false;
    };
  }, [enabled, profile.name, forecast, language, channel]);

  return (
    <>
      <PageHeader title={t('inbox.title')} lead={t('inbox.lead')} />
      <Notice tone="warn" icon="info" className="mb-6">
        <strong>{t('inbox.simulated')}</strong>
      </Notice>

      {!enabled ? (
        <section className="card mx-auto max-w-2xl p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-muted">
            <Icon name="inbox" size={26} />
          </span>
          <h2 className="mt-4 text-xl font-semibold">{t('inbox.offTitle')}</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">{t('inbox.offBody')}</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              className="btn-primary"
              onClick={() =>
                consent && void setConsent({ ...consent, messages: true }, 'consent.changed', { item: t('consent.messages.title'), value: t('common.on') })
              }
            >
              {t('inbox.turnOn')}
            </button>
            <Link to="/app/privacy" className="btn-secondary">
              {t('nav.privacy')}
            </Link>
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <section className="card min-w-0 overflow-hidden" aria-labelledby="preview-title">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 sm:px-6">
              <h2 id="preview-title" className="font-semibold">
                {t('inbox.preview')}
              </h2>
              <Segmented
                label={t('inbox.channel')}
                value={channel}
                onChange={setChannel}
                options={(['whatsapp', 'sms'] as const).map((c) => ({
                  value: c,
                  label: (
                    <>
                      <Icon name={c === 'sms' ? 'phone' : 'inbox'} size={16} />
                      {t(`inbox.channels.${c}`)}
                    </>
                  ),
                }))}
              />
            </div>

            <div className={`px-4 py-8 sm:px-8 ${channel === 'whatsapp' ? 'bg-surface-3' : 'bg-surface-2'}`}>
              <div className="mx-auto max-w-md">
                <div className="mb-4 flex items-center justify-center gap-2">
                  <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted">{t('inbox.todayAt')}</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface p-1">
                    <Brand variant="mark" size={20} decorative />
                  </span>
                  <div
                    className={`relative min-w-0 max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 text-[15px] leading-relaxed shadow-card ${
                      channel === 'whatsapp' ? 'bg-surface text-ink' : 'bg-surface text-ink'
                    }`}
                  >
                    <p className="mb-1 text-xs font-semibold text-accent">Tengo</p>
                    {message ? (
                      <p lang={message.language} className="num break-words">
                        {channel === 'whatsapp' ? <WhatsAppText text={message.text} /> : message.text}
                      </p>
                    ) : (
                      <LoadingBlock lines={3} />
                    )}
                    <p className="mt-1 text-right text-[11px] text-muted">07:00</p>
                  </div>
                </div>
              </div>
            </div>
            {message && channel === 'sms' && (
              <p className="num border-t border-line px-6 py-3 text-xs text-muted">{t('inbox.smsCount', { count: message.text.length, limit: SMS_LIMIT })}</p>
            )}
          </section>

          <div className="flex min-w-0 flex-col gap-6">
            <section className="card p-6">
              <LanguageSelect value={language} onChange={setLanguage} label={t('inbox.language')} hint={t('inbox.languageHint')} />
            </section>
            <section className="card p-6">
              <div className="flex items-center gap-3">
                <Avatar persona={profile} size={40} />
                <div>
                  <p className="font-semibold">{t('inbox.to', { name: profile.name })}</p>
                  <p className="text-sm text-muted">{t('inbox.schedule')}</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {(['what', 'never', 'stop'] as const).map((k) => (
                  <li key={k} className="flex gap-2">
                    <Icon name="check" size={16} className="mt-0.5 shrink-0 text-enough" />
                    {t(`inbox.facts.${k}`)}
                  </li>
                ))}
              </ul>
              <Link to="/app/privacy" className="btn-ghost -ml-3 mt-3 text-sm">
                {t('inbox.manage')}
                <Icon name="chevronRight" size={16} />
              </Link>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
