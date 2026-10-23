import { lazy, Suspense, useEffect, useState } from 'react';

const CommandPalette = lazy(() => import('./CommandPalette'));

/**
 * Always loaded and tiny: listens for Ctrl or Cmd plus K and for the sidebar's search button, and loads the
 * palette the first time it is opened.
 */
export function CommandPaletteHost() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Leave the shortcut alone while someone is typing in a field that has text.
      const el = e.target as HTMLInputElement | HTMLTextAreaElement | null;
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.value !== '' && !el.closest('[role="dialog"]');
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && !typing) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('tengo:palette', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('tengo:palette', onOpen);
    };
  }, []);

  if (!open) return null;
  return (
    <Suspense fallback={null}>
      <CommandPalette onClose={() => setOpen(false)} />
    </Suspense>
  );
}
