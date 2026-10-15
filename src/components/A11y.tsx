import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type Announce = (message: string) => void;
const AnnounceCtx = createContext<Announce>(() => undefined);

/**
 * One polite live region for the whole app, plus route change handling:
 * after navigation, focus moves to the main content and the new page title is announced.
 */
export function A11yProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const announce = useCallback<Announce>((m) => {
    // Clear first so the same message twice is still read out.
    setMessage('');
    window.setTimeout(() => setMessage(m), 60);
  }, []);
  return (
    <AnnounceCtx.Provider value={announce}>
      <RouteFocus announce={announce} />
      {children}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {message}
      </div>
    </AnnounceCtx.Provider>
  );
}

function RouteFocus({ announce }: { announce: Announce }) {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    // Wait for the new page to render and set its title.
    const id = window.setTimeout(() => {
      const main = document.getElementById('main');
      if (main) {
        main.setAttribute('tabindex', '-1');
        main.focus({ preventScroll: true });
      }
      window.scrollTo({ top: 0 });
      announce(document.title.replace(' | Tengo', ''));
    }, 120);
    return () => window.clearTimeout(id);
  }, [pathname, announce]);
  return null;
}

export function useAnnounce(): Announce {
  return useContext(AnnounceCtx);
}

export function SkipLink() {
  const { t } = useTranslation();
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-full focus:bg-surface focus:px-4 focus:py-2 focus:font-semibold focus:shadow-lift"
    >
      {t('common.skipToContent')}
    </a>
  );
}
