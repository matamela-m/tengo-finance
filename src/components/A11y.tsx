import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';

type Announce = (message: string, options?: { toast?: boolean }) => void;
const AnnounceCtx = createContext<Announce>(() => undefined);

/**
 * One polite live region for the whole app, plus route change handling:
 * after navigation, focus moves to the main content and the new page title is announced.
 * Action messages also show as a short visual toast.
 */
export function A11yProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const announce = useCallback<Announce>((m, options) => {
    // Clear first so the same message twice is still read out.
    setMessage('');
    window.setTimeout(() => setMessage(m), 60);
    if (options?.toast === false) return;
    setToast({ text: m, id: Date.now() });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);
  return (
    <AnnounceCtx.Provider value={announce}>
      <RouteFocus announce={announce} />
      {children}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {message}
      </div>
      {toast && (
        <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-[88px] z-[70] flex justify-center px-4 lg:bottom-8">
          <div key={toast.id} className="flex animate-rise items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-bg shadow-lift">
            <Icon name="checkCircle" size={18} />
            {toast.text}
          </div>
        </div>
      )}
    </AnnounceCtx.Provider>
  );
}

function RouteFocus({ announce }: { announce: Announce }) {
  const { pathname } = useLocation();
  const first = useRef(true);
  // A new page starts at the top straight away, before it paints, and without the smooth scroll animation.
  useLayoutEffect(() => {
    if (!first.current) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
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
      announce(document.title.replace(' | Tengo', ''), { toast: false });
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
