import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ManualSetupForm, type ManualSetupResult } from '../components/ManualSetupForm';
import { PageHeader } from '../components/PageHeader';
import { useRecordPersona } from '../data/PersonaProvider';
import { estimatedHistory } from '../engine/setup';
import { usePageTitle } from '../lib/usePageTitle';

/** Set up by hand, for people without a statement. Replaces the history with one estimated from the answers. */
export default function SetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { saveManualSetup, today } = useRecordPersona();
  const [busy, setBusy] = useState(false);
  usePageTitle(t('setup.title'));

  const submit = async ({ answers, balance }: ManualSetupResult) => {
    setBusy(true);
    try {
      await saveManualSetup(estimatedHistory(answers, today), balance);
      navigate('/app');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title={t('setup.title')} lead={t('setup.lead')} />
      <section className="card max-w-3xl p-5 sm:p-7">
        <ManualSetupForm onSubmit={(r) => void submit(r)} submitLabel={t('setup.submit')} busy={busy} />
      </section>
    </>
  );
}
