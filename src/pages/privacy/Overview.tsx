import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Notice } from '../../components/Feedback';
import { Icon, type IconName } from '../../components/Icon';
import { PageHeader } from '../../components/PageHeader';
import { Toggle } from '../../components/Toggle';
import { IconTile } from '../../components/ui';
import { usePersona, useReadyPersona } from '../../data/PersonaProvider';
import type { ConsentRecord } from '../../data/repository';
import { useDates } from '../../lib/useLang';
import { retention } from './retention';
import { useAnnounce } from '../../components/A11y';

function Card({ icon, title, children, className = '' }: { icon: IconName; title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`card p-5 sm:p-6 ${className}`}>
      <div className="flex items-center gap-3">
        <IconTile name={icon} />
        <h2 className="font-heading text-h3 text-ink">{title}</h2>
      </div>
      <div className="mt-4 text-[15px]">{children}</div>
    </section>
  );
}

const LINKS: { to: string; key: string; icon: IconName }[] = [
  { to: 'data', key: 'data', icon: 'eye' },
  { to: 'audit', key: 'audit', icon: 'clock' },
  { to: 'review', key: 'review', icon: 'edit' },
  { to: 'breach', key: 'breach', icon: 'alert' },
  { to: 'delete', key: 'delete', icon: 'trash' },
];

export default function PrivacyOverview() {
  const { t } = useTranslation();
  const d = useDates();
  const { record } = useReadyPersona();
  const { consent, setConsent } = usePersona();
  const keep = retention(record.transactions);
  const announce = useAnnounce();

  const change = (key: keyof Omit<ConsentRecord, 'decidedAt'>, value: boolean) => {
    if (!consent) return;
    const next = { core: consent.core, messages: consent.messages, analytics: consent.analytics, [key]: value };
    const type = key === 'core' ? (value ? 'forecast.resumed' : 'forecast.paused') : 'consent.changed';
    void setConsent(next, type, { item: t(`consent.${key}.title`), value: value ? t('common.on') : t('common.off') }).then(() =>
      announce(key === 'core' && !value ? t('a11y.paused') : t('a11y.consentSaved')),
    );
  };

  return (
    <>
      <PageHeader title={t('privacy.title')} lead={t('privacy.lead')} />
      <Notice tone="warn" icon="shield" className="mb-6">
        <strong>{t('privacy.simulated')}</strong>
      </Notice>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <section className="card p-5 sm:p-6" aria-labelledby="consent-title">
            <div className="flex items-center gap-3">
              <IconTile name="check" tone="accent" />
              <h2 id="consent-title" className="font-heading text-h3 text-ink">
                {t('privacy.consentTitle')}
              </h2>
            </div>
            <div className="mt-2 divide-y divide-line">
              <Toggle checked={consent?.core ?? false} onChange={(v) => change('core', v)} label={t('consent.core.title')} description={t('privacy.coreEffect')} />
              <Toggle checked={consent?.messages ?? false} onChange={(v) => change('messages', v)} label={t('consent.messages.title')} description={t('privacy.messagesEffect')} />
              <Toggle checked={consent?.analytics ?? false} onChange={(v) => change('analytics', v)} label={t('consent.analytics.title')} description={t('consent.analytics.body')} />
            </div>
            {consent && <p className="mt-3 text-xs text-muted">{t('privacy.lastChanged', { date: d.stamp(consent.decidedAt) })}</p>}
          </section>

          <Card icon="filter" title={t('privacy.minimisation')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-surface-2 p-4">
                <p className="font-semibold">{t('privacy.uses')}</p>
                <ul className="mt-2 list-outside list-disc space-y-1 pl-5 text-sm">
                  {(['date', 'amount', 'description', 'balance'] as const).map((k) => (
                    <li key={k}>{t(`privacy.used.${k}`)}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl bg-surface-2 p-4">
                <p className="font-semibold">{t('privacy.neverUses')}</p>
                <ul className="mt-2 list-outside list-disc space-y-1 pl-5 text-sm">
                  {(['id', 'location', 'contacts', 'account'] as const).map((k) => (
                    <li key={k}>{t(`privacy.unused.${k}`)}</li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted">{t('privacy.descriptionsNote')}</p>
          </Card>

          <Card icon="lock" title={t('privacy.security')}>
            <h3 className="eyebrow">{t('privacy.securityNow')}</h3>
            <ul className="mt-2 space-y-2">
              {(['device', 'server', 'shared'] as const).map((k) => (
                <li key={k} className="flex items-start gap-2">
                  <Icon name="info" size={18} className="mt-0.5 shrink-0 text-muted" />
                  {t(`privacy.securityItems.${k}`)}
                </li>
              ))}
            </ul>
            <h3 className="eyebrow mt-5">{t('privacy.securityPlanned')}</h3>
            <ul className="mt-2 space-y-2">
              {(['transit', 'access'] as const).map((k) => (
                <li key={k} className="flex items-start gap-2 text-muted">
                  <Icon name="clock" size={18} className="mt-0.5 shrink-0" />
                  {t(`privacy.securityItems.${k}`)}
                </li>
              ))}
            </ul>
            <Link to="audit" className="btn-ghost -ml-3 mt-3">
              {t('privacy.links.audit.title')}
              <Icon name="chevronRight" size={16} />
            </Link>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <nav aria-label={t('privacy.rightsNav')} className="card p-3">
            <ul>
              {LINKS.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="flex min-h-[56px] items-center gap-3 rounded-2xl px-3 py-2 hover:bg-surface-2">
                    <IconTile name={l.icon} tone={l.key === 'delete' ? 'short' : 'neutral'} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{t(`privacy.links.${l.key}.title`)}</span>
                      <span className="block text-xs text-muted">{t(`privacy.links.${l.key}.body`)}</span>
                    </span>
                    <Icon name="chevronRight" size={16} className="text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Card icon="clock" title={t('privacy.retention')}>
            <p className="font-semibold">{t('privacy.retentionRule')}</p>
            <p className="num mt-2 text-muted">{keep.next ? t('privacy.nextRemoval', { date: d.long(keep.next), from: d.long(keep.oldest!) }) : t('privacy.nothingStored')}</p>
          </Card>

          <Card icon="map" title={t('privacy.crossBorder')}>
            <p>{t('privacy.crossBorderBody')}</p>
          </Card>

          <Card icon="user" title={t('privacy.officer')}>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted">{t('privacy.officerName')}</dt>
                <dd className="font-semibold">{t('privacy.placeholderName')}</dd>
              </div>
              <div>
                <dt className="text-muted">{t('privacy.officerEmail')}</dt>
                <dd className="font-semibold">privacy@example.org</dd>
              </div>
            </dl>
            <p className="mt-3 rounded-xl bg-tight-soft px-3 py-2 text-xs font-semibold text-tight">{t('privacy.placeholderNote')}</p>
            <p className="mt-3 text-sm text-muted">{t('privacy.complaints')}</p>
          </Card>
        </div>
      </div>
    </>
  );
}
