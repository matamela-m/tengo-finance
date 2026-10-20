import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { A11yProvider, SkipLink } from './components/A11y';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CommandPalette } from './components/CommandPalette';
import { Preferences } from './components/Preferences';
import { PersonaProvider } from './data/PersonaProvider';
import { AppGate } from './layouts/AppGate';
import { LockProvider } from './components/Lock';
import { lazy, Suspense } from 'react';
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
const InboxPage = lazy(() => import('./pages/Inbox'));
const PrivacyPage = lazy(() => import('./pages/Privacy'));
const MePage = lazy(() => import('./pages/Me'));
const NotFound = lazy(() => import('./pages/NotFound'));
const ExitPage = lazy(() => import('./pages/Exit'));
const SafetyPolicy = lazy(() => import('./pages/SafetyPolicy'));

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Preferences />
      <SkipLink />
      <A11yProvider>
      <LockProvider>
      <PersonaProvider>
        <CommandPalette />
        <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/start" element={<Picker />} />
          <Route path="/consent" element={<Consent />} />
          <Route path="/exit" element={<ExitPage />} />
          <Route path="/safety" element={<SafetyPolicy />} />
          <Route path="/app" element={<AppGate />}>
            <Route index element={<HomePage />} />
            <Route path="plan" element={<PlanPage />} />
            <Route path="money" element={<MoneyPage />} />
            <Route path="money/import" element={<ImportPage />} />
            <Route path="money/setup" element={<SetupPage />} />
            <Route path="inbox" element={<InboxPage />} />
            <Route path="privacy/*" element={<PrivacyPage />} />
            <Route path="me" element={<MePage />} />
            <Route path="*" element={<NotFound embedded />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </PersonaProvider>
      </LockProvider>
      </A11yProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
