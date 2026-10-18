import { useTranslation } from 'react-i18next';
import { Notice } from '../../components/Feedback';
import { SubPage } from './Sub';

export default function Breach() {
  const { t } = useTranslation();
  const parts = ['happened', 'data', 'doing', 'you', 'contact'] as const;
  return (
    <SubPage title={t('privacy.links.breach.title')} lead={t('privacy.breachLead')}>
      <Notice tone="warn" className="mb-6">
        <strong>{t('privacy.breachSample')}</strong>
      </Notice>
      <article className="card relative mx-auto max-w-3xl overflow-hidden p-6 sm:p-10">
        <span aria-hidden className="pointer-events-none mb-4 inline-block rotate-3 sm:absolute sm:right-6 sm:top-6 sm:mb-0 sm:rotate-6 rounded-lg border-2 border-tight px-3 py-1 text-sm font-extrabold uppercase tracking-widest text-tight">
          {t('privacy.sampleStamp')}
        </span>
        <p className="text-sm text-muted">{t('privacy.breachDate')}</p>
        <h2 className="mt-2 text-2xl font-bold">{t('privacy.breachHeading')}</h2>
        {parts.map((p) => (
          <section key={p} className="mt-6">
            <h3 className="font-semibold">{t(`privacy.breach.${p}.title`)}</h3>
            <p className="mt-1 text-[15px] leading-relaxed text-ink">{t(`privacy.breach.${p}.body`)}</p>
          </section>
        ))}
      </article>
    </SubPage>
  );
}
