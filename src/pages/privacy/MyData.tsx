import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TransactionRow } from '../../components/forecast/Cards';
import { Icon } from '../../components/Icon';
import { useRecordPersona } from '../../data/PersonaProvider';
import { toCsv } from '../../lib/csv';
import { formatZAR } from '../../lib/format';
import { downloadText } from '../../lib/sampleStatement';
import { useDates } from '../../lib/useLang';
import { SubPage } from './Sub';
import { useAnnounce } from '../../components/A11y';

export default function MyData() {
  const { t } = useTranslation();
  const d = useDates();
  const { record, profile, consent, audit, reviews, log } = useRecordPersona();
  const logged = useRef(false);
  const announce = useAnnounce();

  useEffect(() => {
    if (logged.current) return;
    logged.current = true;
    void log('data.viewed');
  }, [log]);

  const stamp = new Date().toISOString().slice(0, 10);
  const exportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      note: 'Fictional demo data from Tengo. Not real personal information.',
      persona: { id: profile.id, name: profile.name, fictional: true },
      balance: record.balance,
      source: record.source,
      consent,
      transactions: record.transactions,
      auditLog: audit,
      reviewRequests: reviews,
    };
    downloadText(`tengo-${profile.id}-${stamp}.json`, JSON.stringify(payload, null, 2), 'application/json');
    void log('data.exported', { format: 'JSON' });
    announce(t('a11y.exported', { format: 'JSON' }));
  };
  const exportCsv = () => {
    const rows = [['date', 'description', 'amount', 'category'], ...record.transactions.map((x) => [x.date, x.description, x.amount.toFixed(2), x.category])];
    downloadText(`tengo-${profile.id}-${stamp}.csv`, toCsv(rows) + '\n');
    void log('data.exported', { format: 'CSV' });
    announce(t('a11y.exported', { format: 'CSV' }));
  };

  const sorted = [...record.transactions].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <SubPage
      title={t('privacy.links.data.title')}
      lead={t('privacy.dataLead')}
      actions={
        <>
          <button type="button" className="btn-primary" onClick={exportJson}>
            <Icon name="download" size={18} />
            {t('privacy.exportJson')}
          </button>
          <button type="button" className="btn-secondary" onClick={exportCsv}>
            <Icon name="download" size={18} />
            {t('privacy.exportCsv')}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <section className="card h-fit min-w-0 p-6" aria-labelledby="held-title">
          <h2 id="held-title" className="font-heading text-h3 text-ink">
            {t('privacy.held')}
          </h2>
          <dl className="mt-3 divide-y divide-line text-sm">
            {[
              [t('privacy.heldPersona'), `${profile.name} (${t('personas.fictional').toLowerCase()})`],
              [t('privacy.heldBalance'), formatZAR(record.balance)],
              [t('privacy.heldTransactions'), String(record.transactions.length)],
              [t('privacy.heldSource'), t(`privacy.source.${record.source}`)],
              [t('privacy.heldConsent'), consent ? d.stamp(consent.decidedAt) : '-'],
              [t('privacy.heldAudit'), String(audit.length)],
              [t('privacy.heldReviews'), String(reviews.length)],
              [t('privacy.heldWhere'), t('privacy.heldWhereValue')],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5">
                <dt className="text-muted">{k}</dt>
                <dd className="num text-right font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-muted">{t('privacy.correctHint')}</p>
        </section>
        <section className="card min-w-0 p-6" aria-labelledby="tx-title">
          <h2 id="tx-title" className="font-heading text-h3 text-ink">
            {t('privacy.heldTransactions')}
          </h2>
          <ul tabIndex={0} aria-labelledby="tx-title" className="mt-2 max-h-[640px] divide-y divide-line overflow-y-auto rounded-xl pr-1">
            {sorted.map((tx) => (
              <li key={tx.id}>
                <TransactionRow tx={tx} compact />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </SubPage>
  );
}
