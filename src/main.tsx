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
    void navigator.serviceWorker.register('/sw.js');
  });
}
