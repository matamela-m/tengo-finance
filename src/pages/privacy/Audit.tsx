import { useTranslation } from 'react-i18next';
import { EmptyState } from '../../components/Feedback';
import { Icon, type IconName } from '../../components/Icon';
import { usePersona } from '../../data/PersonaProvider';
import type { AuditType } from '../../data/repository';
import { useDates } from '../../lib/useLang';
import { SubPage } from './Sub';

const ICONS: Record<AuditType, IconName> = {
  'session.opened': 'eye',
  'consent.given': 'check',
  'consent.changed': 'sliders',
  'data.viewed': 'eye',
  'data.exported': 'download',
  'statement.imported': 'upload',
  'transaction.edited': 'edit',
  'transaction.added': 'plus',
  'balance.updated': 'refresh',
  'bill.answered': 'receipt',
  'review.requested': 'mail',
  'forecast.paused': 'pause',
  'forecast.resumed': 'refresh',
};

export default function Audit() {
  const { t } = useTranslation();
  const d = useDates();
  const { audit } = usePersona();
  return (
    <SubPage title={t('privacy.links.audit.title')} lead={t('privacy.auditLead')}>
      <section className="card p-6" aria-label={t('privacy.links.audit.title')}>
        {audit.length === 0 ? (
          <EmptyState icon="clock" title={t('privacy.auditEmpty')} />
        ) : (
          <ol className="divide-y divide-line">
            {audit.map((a) => (
              <li key={a.id} className="flex items-start gap-3 py-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2">
                  <Icon name={ICONS[a.type]} size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{t(`audit.${a.type.replace('.', '_')}`, a.params ?? {})}</p>
                  <p className="text-xs text-muted">{t('privacy.auditActor')}</p>
                </div>
                <time dateTime={a.at} className="num shrink-0 text-right text-sm text-muted">
                  {d.stamp(a.at)}
                </time>
              </li>
            ))}
          </ol>
        )}
      </section>
    </SubPage>
  );
}
