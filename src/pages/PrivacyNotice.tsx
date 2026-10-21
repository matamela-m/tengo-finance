import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Brand } from '../components/Brand';
import { Notice } from '../components/Feedback';
import { NOTICE_VERSION } from '../lib/notice';
import { OPERATOR, OPERATOR_IS_PLACEHOLDER } from '../lib/operator';
import { usePageTitle } from '../lib/usePageTitle';

const SECTIONS = ['what', 'why', 'where', 'who', 'keep', 'rights', 'not', 'changes'] as const;

/**
 * The privacy notice and terms of use, in plain words, matching what the app actually does. A draft for a
 * lawyer to review. Responsible party and Information Officer come from environment variables.
 */
export default function PrivacyNotice({ kind = 'notice' }: { kind?: 'notice' | 'terms' }) {
  const { t } = useTranslation();
  usePageTitle(t(`legalDoc.${kind}.title`));
  const sections = kind === 'notice' ? SECTIONS : (['use', 'estimate', 'liability', 'accounts', 'ending', 'complaints'] as const);
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Link to="/" className="inline-flex min-h-[44px] items-center rounded-md" aria-label={`Tengo, ${t('landing.home')}`}>
            <Brand size={22} decorative />
          </Link>
          <Link to={kind === 'notice' ? '/terms' : '/privacy-notice'} className="text-sm text-accent underline-offset-4 hover:underline">
            {t(`legalDoc.${kind === 'notice' ? 'terms' : 'notice'}.title`)}
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="font-heading text-h1 text-ink">{t(`legalDoc.${kind}.title`)}</h1>
        <p className="mt-2 text-sm text-muted">{t('legalDoc.version', { version: NOTICE_VERSION })}</p>
        <Notice tone="warn" className="mt-6">
          {t('legalDoc.draft')}
        </Notice>
        {OPERATOR_IS_PLACEHOLDER && (
          <Notice tone="danger" className="mt-3">
            {t('legalDoc.placeholderWarning')}
          </Notice>
        )}
        <dl className="mt-6 grid gap-x-6 gap-y-2 rounded-2xl bg-surface-2 p-5 text-sm sm:grid-cols-[max-content_1fr]">
          <dt className="font-semibold">{t('legalDoc.party')}</dt>
          <dd>{OPERATOR.responsibleParty}</dd>
          <dt className="font-semibold">{t('legalDoc.address')}</dt>
          <dd>{OPERATOR.address}</dd>
          <dt className="font-semibold">{t('legalDoc.officer')}</dt>
          <dd>{OPERATOR.informationOfficer}</dd>
          <dt className="font-semibold">{t('legalDoc.contact')}</dt>
          <dd>{OPERATOR.contactEmail}</dd>
        </dl>
        {sections.map((s) => (
          <section key={s} className="mt-8" aria-labelledby={`ld-${s}`}>
            <h2 id={`ld-${s}`} className="font-heading text-h3 text-ink">
              {t(`legalDoc.${kind}.${s}.title`)}
            </h2>
            <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-muted">{t(`legalDoc.${kind}.${s}.body`)}</p>
          </section>
        ))}
      </main>
    </div>
  );
}
