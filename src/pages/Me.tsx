import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../components/Avatar';
import { Notice } from '../components/Feedback';
import { Icon, type IconName } from '../components/Icon';
import { LanguageSelector } from '../components/LanguageSelector';
import { PageHeader } from '../components/PageHeader';
import { StateChip } from '../components/StateChip';
import { repository } from '../data';
import { usePersona } from '../data/PersonaProvider';
import { PERSONAS } from '../data/seed/personas';
import { useSession, type ThemePref } from '../store/session';

const THEMES: { value: ThemePref; icon: IconName }[] = [
  { value: 'light', icon: 'sun' },
  { value: 'dark', icon: 'moon' },
  { value: 'system', icon: 'sliders' },
];

export default function MePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { personaId } = usePersona();
  const theme = useSession((s) => s.theme);
  const setTheme = useSession((s) => s.setTheme);
  const setActive = useSession((s) => s.setActivePersona);
  const [confirmReset, setConfirmReset] = useState(false);

  const switchTo = async (id: string) => {
    if (id === personaId) return;
    const consent = await repository.getConsent(id as (typeof PERSONAS)[number]['id']);
    setActive(id);
    navigate(consent ? '/app' : '/consent');
  };

  const reset = async () => {
    await repository.resetAll();
    setActive(null);
    setTheme('light');
    navigate('/', { replace: true });
  };

  return (
    <>
      <PageHeader title={t('me.title')} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="card p-6" aria-labelledby="who-title">
            <h2 id="who-title" className="text-lg font-semibold">
              {t('me.persona')}
            </h2>
            <ul className="mt-3 space-y-2">
              {PERSONAS.map((p) => {
                const active = p.id === personaId;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => void switchTo(p.id)}
                      aria-current={active ? 'true' : undefined}
                      className={`flex min-h-[64px] w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left ${active ? 'border-accent bg-accent-soft dark:bg-surface-2' : 'border-line hover:bg-surface-2'}`}
                    >
                      <Avatar persona={p} size={44} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{p.name}</span>
                        <span className="block truncate text-sm text-muted">
                          {t(`personas.${p.id}.role`)}, {p.place}
                        </span>
                      </span>
                      {active ? (
                        <span className="flex items-center gap-1 text-sm font-semibold text-accent">
                          <Icon name="check" size={16} />
                          {t('me.current')}
                        </span>
                      ) : (
                        <StateChip state={p.startState} size="sm" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-muted">{t('personas.fictional')}</p>
          </section>

          <section className="card p-6" aria-label={t('language.label')}>
            <LanguageSelector />
          </section>

          <section className="card p-6">
            <fieldset>
              <legend className="mb-3 text-lg font-semibold">{t('me.theme')}</legend>
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map((th) => (
                  <label
                    key={th.value}
                    className={`flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-2xl border text-sm font-semibold focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[var(--color-focus)] ${
                      theme === th.value ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface hover:bg-surface-2'
                    }`}
                  >
                    <input type="radio" name="theme" className="sr-only" checked={theme === th.value} onChange={() => setTheme(th.value)} />
                    <Icon name={th.icon} size={16} />
                    {t(`me.themes.${th.value}`)}
                  </label>
                ))}
              </div>
            </fieldset>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <section className="card p-6 sm:p-7" aria-labelledby="about-title">
            <h2 id="about-title" className="font-heading text-[26px] font-extrabold">
              {t('me.about')}
            </h2>
            <h3 className="mt-5 font-semibold">{t('me.nameTitle')}</h3>
            <p className="mt-1 text-[15px] text-muted">{t('me.nameBody')}</p>
            <h3 className="mt-5 font-semibold">{t('me.howTitle')}</h3>
            <ol className="mt-2 list-outside list-decimal space-y-1.5 pl-5 text-[15px] text-muted">
              {(['1', '2', '3', '4', '5'] as const).map((k) => (
                <li key={k}>{t(`me.how.${k}`)}</li>
              ))}
            </ol>
            <h3 className="mt-5 font-semibold">{t('me.simTitle')}</h3>
            <ul className="mt-2 list-outside list-disc space-y-1.5 pl-5 text-[15px] text-muted">
              {(['data', 'bank', 'messages', 'privacy', 'translations'] as const).map((k) => (
                <li key={k}>{t(`me.sim.${k}`)}</li>
              ))}
            </ul>
          </section>

          <section className="card p-6" aria-labelledby="reset-title">
            <h2 id="reset-title" className="text-lg font-semibold">
              {t('me.reset')}
            </h2>
            <p className="mt-1 text-sm text-muted">{t('me.resetBody')}</p>
            {confirmReset ? (
              <div className="mt-4 space-y-3">
                <Notice tone="danger">{t('me.resetWarn')}</Notice>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button type="button" className="btn-danger" onClick={() => void reset()}>
                    {t('me.resetConfirm')}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setConfirmReset(false)}>
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="btn-secondary mt-4" onClick={() => setConfirmReset(true)}>
                <Icon name="refresh" size={18} />
                {t('me.reset')}
              </button>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
