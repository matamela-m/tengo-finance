import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePersona } from '../data/PersonaProvider';
import { Notice } from './Feedback';

/** Shown when a save failed: storage full or blocked. The change was not kept, and the person is told so. */
export function StorageBanner() {
  const { t } = useTranslation();
  const { storageProblem, dismissStorageProblem } = usePersona();
  if (!storageProblem || storageProblem === 'corrupt') return null;
  return (
    <div role="alert" className="mb-5">
      <Notice tone="danger">
        <p className="font-semibold">{t(`storage.${storageProblem}.title`)}</p>
        <p className="mt-0.5">{t(`storage.${storageProblem}.body`)}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link to="/app/privacy/data" className="btn-secondary min-h-[44px]">
            {t('storage.export')}
          </Link>
          <button type="button" className="btn-ghost min-h-[44px]" onClick={dismissStorageProblem}>
            {t('common.close')}
          </button>
        </div>
      </Notice>
    </div>
  );
}
