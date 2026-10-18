import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState, PageLoading } from '../components/Feedback';
import { usePersona } from '../data/PersonaProvider';
import { AppLayout } from './AppLayout';
import { ForecastPaused } from '../pages/ForecastPaused';

/** Pages that still work while the forecast is paused, so people can see or delete their data. */
const OPEN_WHEN_PAUSED = ['/app/privacy', '/app/me'];

export function AppGate() {
  const { t } = useTranslation();
  const { personaId, status, consent, record, reload } = usePersona();
  const { pathname } = useLocation();

  if (!personaId) return <Navigate to="/start" replace />;
  if (status === 'ready' && !consent) return <Navigate to="/consent" replace />;

  let content;
  if (status === 'error') {
    content = (
      <EmptyState
        icon="alert"
        title={t('errors.loadTitle')}
        body={t('errors.loadBody')}
        action={
          <button type="button" className="btn-primary" onClick={() => void reload()}>
            {t('errors.retry')}
          </button>
        }
      />
    );
  } else if (status !== 'ready' || !record) {
    content = <PageLoading />;
  } else if (consent && !consent.core && !OPEN_WHEN_PAUSED.some((p) => pathname.startsWith(p))) {
    content = <ForecastPaused />;
  } else {
    // Fades in on every page change and when loading finishes, instead of snapping.
    content = (
      <div key={pathname} className="animate-page">
        <Outlet />
      </div>
    );
  }

  return <AppLayout>{content}</AppLayout>;
}
