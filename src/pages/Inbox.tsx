import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../components/Avatar';
import { LoadingBlock, Notice } from '../components/Feedback';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { TengoLogo } from '../components/TengoLogo';
import { usePersona, useReadyPersona } from '../data/PersonaProvider';
import { LANGUAGES, isLanguageCode, type LanguageCode } from '../i18n/languages';
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
              <div role="radiogroup" aria-label={t('inbox.channel')} className="flex rounded-full bg-surface-2 p-1">
                {(['whatsapp', 'sms'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={channel === c}
                    onClick={() => setChannel(c)}
                    className={`flex min-h-[40px] items-center gap-1.5 rounded-full px-4 text-sm font-semibold ${channel === c ? 'bg-surface text-ink shadow-card' : 'text-muted'}`}
                  >
                    <Icon name={c === 'sms' ? 'phone' : 'inbox'} size={16} />
                    {t(`inbox.channels.${c}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className={`px-4 py-8 sm:px-8 ${channel === 'whatsapp' ? 'bg-[#E7DFD4]' : 'bg-surface-2'}`}>
              <div className="mx-auto max-w-md">
                <div className="mb-4 flex items-center justify-center gap-2">
                  <span className="rounded-full bg-surface/80 px-3 py-1 text-xs font-medium text-muted">{t('inbox.todayAt')}</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-1">
                    <TengoLogo variant="mark" height={20} decorative />
                  </span>
                  <div
                    className={`relative min-w-0 max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 text-[15px] leading-relaxed shadow-card ${
                      channel === 'whatsapp' ? 'bg-white text-charcoal' : 'bg-surface text-ink'
                    }`}
                    aria-live="polite"
                  >
                    <p className="mb-1 text-xs font-semibold text-deep-green">Tengo</p>
                    {message ? (
                      <p lang={message.language} className="num break-words">
                        {channel === 'whatsapp' ? <WhatsAppText text={message.text} /> : message.text}
                      </p>
                    ) : (
                      <LoadingBlock lines={3} />
                    )}
                    <p className="mt-1 text-right text-[11px] text-charcoal/60">07:00</p>
                  </div>
                </div>
              </div>
            </div>
            {message && channel === 'sms' && (
              <p className="num border-t border-line px-6 py-3 text-xs text-muted">{t('inbox.smsCount', { count: message.text.length, limit: SMS_LIMIT })}</p>
            )}
          </section>

          <div className="flex min-w-0 flex-col gap-6">
            <section className="card p-6" aria-labelledby="msg-lang">
              <label id="msg-lang" htmlFor="msg-language" className="flex items-center gap-2 text-lg font-semibold">
                <Icon name="globe" size={18} />
                {t('inbox.language')}
              </label>
              <p className="mt-1 text-sm text-muted">{t('inbox.languageHint')}</p>
              <select
                id="msg-language"
                className="field mt-3"
                value={language}
                onChange={(e) => isLanguageCode(e.target.value) && setLanguage(e.target.value)}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} lang={l.code}>
                    {l.native}
                  </option>
                ))}
              </select>
              {language !== 'en' && <p className="mt-2 text-xs text-muted">{t('language.pending')}</p>}
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
                    <Icon name="check" size={16} className="mt-0.5 shrink-0 text-enough-text" />
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
