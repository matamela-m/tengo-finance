import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Notice } from '../../components/Feedback';
import { Icon } from '../../components/Icon';
import { usePersona, useRecordPersona } from '../../data/PersonaProvider';
import { SubPage } from './Sub';

export default function Delete() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { record, profile, audit } = useRecordPersona();
  const { deleteData } = usePersona();
  const [step, setStep] = useState<'ask' | 'confirm'>('ask');
  const [understood, setUnderstood] = useState(false);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    const receipt = await deleteData();
    navigate(`/start?deleted=${encodeURIComponent(receipt.id)}`, { replace: true });
  };

  return (
    <SubPage title={t('privacy.links.delete.title')} lead={t('privacy.deleteLead', { name: profile.name })}>
      <section className="card mx-auto max-w-2xl p-6 sm:p-8">
        <h2 className="font-heading text-h3 text-ink">{t('privacy.deleteWhat')}</h2>
        <ul className="mt-3 space-y-2 text-[15px]">
          <li className="flex gap-2">
            <Icon name="trash" size={18} className="mt-0.5 text-short" />
            {t('privacy.deleteTx', { count: record.transactions.length })}
          </li>
          <li className="flex gap-2">
            <Icon name="trash" size={18} className="mt-0.5 text-short" />
            {t('privacy.deleteConsent')}
          </li>
          <li className="flex gap-2">
            <Icon name="trash" size={18} className="mt-0.5 text-short" />
            {t('privacy.deleteAudit', { count: audit.length })}
          </li>
          <li className="flex gap-2">
            <Icon name="receipt" size={18} className="mt-0.5 text-muted" />
            {t('privacy.deleteReceipt')}
          </li>
        </ul>
        {step === 'ask' ? (
          <button type="button" className="btn-danger mt-6 w-full sm:w-auto" onClick={() => setStep('confirm')}>
            <Icon name="trash" size={18} />
            {t('privacy.deleteStart')}
          </button>
        ) : (
          <div className="mt-6 space-y-4">
            <Notice tone="danger">{t('privacy.deleteWarn')}</Notice>
            <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-[15px]">
              <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} className="h-5 w-5 accent-[var(--color-short)]" />
              {t('privacy.deleteCheck')}
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" className="btn-danger" disabled={!understood || busy} onClick={() => void remove()}>
                {busy ? t('common.saving') : t('privacy.deleteConfirm')}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setStep('ask')}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}
      </section>
    </SubPage>
  );
}
