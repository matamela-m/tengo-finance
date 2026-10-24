/**
 * Loads the main app pages in the background once the browser is idle, so moving between them never shows
 * a loading state. The same import paths as the lazy routes in App.tsx, so each chunk is fetched only once.
 */
let started = false;

export function prefetchAppPages(): void {
  if (started) return;
  started = true;
  const run = () => {
    void import('../pages/Home');
    void import('../pages/Plan');
    void import('../pages/Money');
    void import('../pages/Inbox');
    void import('../pages/Me');
    void import('../pages/Privacy');
  };
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 3000 });
  else setTimeout(run, 1500);
}
