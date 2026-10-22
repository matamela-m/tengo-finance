import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/figtree';
import './styles/index.css';
import './i18n';
import App from './App';
import { recordDiagnostic } from './lib/diagnostics';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Unexpected errors are noted locally by name and route only, never with their message.
window.addEventListener('error', (e) => recordDiagnostic('error', e.error, window.location.pathname));
window.addEventListener('unhandledrejection', (e) => recordDiagnostic('promise', e.reason, window.location.pathname));

// Offline support and install, production builds only so development always sees fresh code.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
  });
}

// After a redeploy, a tab opened on the previous build can ask for a code chunk that no longer exists. Reload to
// pick up the new build instead of showing an error, at most once every 30 seconds so an outage cannot loop.
window.addEventListener('vite:preloadError', (e) => {
  try {
    const last = Number(sessionStorage.getItem('tengo.reloadedForNewBuild') ?? 0);
    if (Date.now() - last < 30_000) return;
    sessionStorage.setItem('tengo.reloadedForNewBuild', String(Date.now()));
  } catch {
    return;
  }
  e.preventDefault();
  window.location.reload();
});
