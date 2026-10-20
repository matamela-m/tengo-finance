import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Brand } from '../components/Brand';
import { Notice } from '../components/Feedback';
import { usePageTitle } from '../lib/usePageTitle';

const SECTIONS = ['adults', 'shared', 'control', 'care', 'never'] as const;

/** Written policy for vulnerable users and children. Public, so it can be read before using Tengo. */
export default function SafetyPolicy() {
  const { t } = useTranslation();
  usePageTitle(t('safetyPolicy.title'));
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-5">
          <Link to="/" className="inline-flex min-h-[44px] items-center rounded-md" aria-label={`Tengo, ${t('landing.home')}`}>
            <Brand size={22} decorative />
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="font-heading text-h1 text-ink">{t('safetyPolicy.title')}</h1>
        <p className="mt-3 text-lg text-muted">{t('safetyPolicy.lead')}</p>
        <Notice tone="warn" className="mt-6">
          {t('safetyPolicy.draft')}
        </Notice>
        {SECTIONS.map((s) => (
          <section key={s} className="mt-8" aria-labelledby={`sp-${s}`}>
            <h2 id={`sp-${s}`} className="font-heading text-h3 text-ink">
              {t(`safetyPolicy.${s}.title`)}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{t(`safetyPolicy.${s}.body`)}</p>
          </section>
        ))}
        <section className="mt-8" aria-labelledby="sp-help">
          <h2 id="sp-help" className="font-heading text-h3 text-ink">
            {t('safetyPolicy.help.title')}
          </h2>
          <ul className="mt-2 list-outside list-disc space-y-1.5 pl-5 text-[15px] text-muted">
            <li>{t('safetyPolicy.help.police')}</li>
            <li>{t('safetyPolicy.help.gbv')}</li>
            <li>{t('safetyPolicy.help.childline')}</li>
          </ul>
          <p className="mt-2 text-xs text-subtle">{t('safetyPolicy.help.note')}</p>
        </section>
      </main>
    </div>
  );
}
