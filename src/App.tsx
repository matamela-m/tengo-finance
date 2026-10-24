import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { A11yProvider, SkipLink } from './components/A11y';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CommandPaletteHost } from './components/CommandPaletteHost';
import { Preferences } from './components/Preferences';
import { PersonaProvider } from './data/PersonaProvider';
import { AppGate } from './layouts/AppGate';
import { LockProvider } from './components/Lock';
import { lazy, Suspense, useRef, type ReactNode } from 'react';
import { PageLoading } from './components/Feedback';
import Landing from './pages/Landing';

// Every page except the landing page is its own chunk, loaded when first visited.
const Picker = lazy(() => import('./pages/Picker'));
const Consent = lazy(() => import('./pages/Consent'));
const HomePage = lazy(() => import('./pages/Home'));
const PlanPage = lazy(() => import('./pages/Plan'));
const MoneyPage = lazy(() => import('./pages/Money'));
const ImportPage = lazy(() => import('./pages/Import'));
const SetupPage = lazy(() => import('./pages/Setup'));
const AccountPage = lazy(() => import('./pages/Account'));
const InboxPage = lazy(() => import('./pages/Inbox'));
const PrivacyPage = lazy(() => import('./pages/Privacy'));
const MePage = lazy(() => import('./pages/Me'));
const NotFound = lazy(() => import('./pages/NotFound'));
const SafetyPolicy = lazy(() => import('./pages/SafetyPolicy'));
const Welcome = lazy(() => import('./pages/Welcome'));
const PrivacyNotice = lazy(() => import('./pages/PrivacyNotice'));

/**
 * Fades each top-level page in as it opens. The app pages share one key, so the sidebar never fades.
 * The first page of a visit appears at once: only moving between pages fades.
 */
function PageFade({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const key = pathname.startsWith('/app') ? '/app' : pathname;
  const firstKey = useRef(key);
  return (
    <div key={key} className={key === firstKey.current ? undefined : 'page-fade'}>
      {children}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Preferences />
      <SkipLink />
      <A11yProvider>
      <LockProvider>
      <PersonaProvider>
        <CommandPaletteHost />
        <Suspense fallback={<PageLoading />}>
        <PageFade>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/start" element={<Picker />} />
          <Route path="/consent" element={<Consent />} />
          {/* Quick exit used to land here. Old links go to the profiles. */}
          <Route path="/exit" element={<Navigate to="/start" replace />} />
          <Route path="/safety" element={<SafetyPolicy />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/privacy-notice" element={<PrivacyNotice kind="notice" />} />
          <Route path="/terms" element={<PrivacyNotice kind="terms" />} />
          <Route path="/app" element={<AppGate />}>
            <Route index element={<HomePage />} />
            <Route path="plan" element={<PlanPage />} />
            <Route path="money" element={<MoneyPage />} />
            <Route path="money/import" element={<ImportPage />} />
            <Route path="money/setup" element={<SetupPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="inbox" element={<InboxPage />} />
            <Route path="privacy/*" element={<PrivacyPage />} />
            <Route path="me" element={<MePage />} />
            <Route path="*" element={<NotFound embedded />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        </PageFade>
        </Suspense>
      </PersonaProvider>
      </LockProvider>
      </A11yProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
