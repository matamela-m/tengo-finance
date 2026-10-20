import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState, PageLoading } from '../components/Feedback';
import { usePersona } from '../data/PersonaProvider';
import { AppLayout } from './AppLayout';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { LockScreen, useLock } from '../components/Lock';
import { ForecastPaused } from '../pages/ForecastPaused';

/** Pages that still work while the forecast is paused, so people can see or delete their data. */
const OPEN_WHEN_PAUSED = ['/app/privacy', '/app/me'];

export function AppGate() {
  const { t } = useTranslation();
  const { personaId, status, consent, record, reload, storageProblem, startFresh } = usePersona();
  const { pathname } = useLocation();
  const { locked } = useLock();

  if (!personaId) return <Navigate to="/start" replace />;
  // A locked app shows only the PIN screen: no names, amounts or dates.
  if (locked) return <LockScreen />;
  if (status === 'ready' && !consent) return <Navigate to="/consent" replace />;

  let content;
  if (status === 'error' && storageProblem === 'corrupt') {
    content = (
      <EmptyState
        icon="alert"
        title={t('storage.corrupt.title')}
        body={t('storage.corrupt.body')}
        action={
          <button type="button" className="btn-primary" onClick={() => void startFresh()}>
            {t('storage.corrupt.action')}
          </button>
        }
      />
    );
  } else if (status === 'error') {
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
        <ErrorBoundary embedded resetKey={pathname}>
          <Outlet />
        </ErrorBoundary>
      </div>
    );
  }

  return <AppLayout>{content}</AppLayout>;
}
