import { useEffect } from 'react';
import i18n, { loadLanguage } from '../i18n';
import { contentLanguage } from '../i18n/languages';
import { setMasked } from '../lib/format';
import { useReveal } from '../store/reveal';
import { useSession } from '../store/session';

/** True while discreet mode hides amounts. Components that show amounts re-render when it changes. */
export function useMasked(): boolean {
  const discreet = useSession((s) => s.discreet);
  const until = useReveal((s) => s.until);
  const masked = discreet && until <= Date.now();
  setMasked(masked);
  return masked;
}

/** Keeps i18next, <html lang> (the language of the shown text) and the theme attribute in sync with the persisted session. */
export function Preferences() {
  const language = useSession((s) => s.language);
  const theme = useSession((s) => s.theme);

  useEffect(() => {
    void loadLanguage(language).then(() => i18n.changeLanguage(language));
    // The page language is the language of the text actually shown: English while a translation is pending.
    document.documentElement.lang = contentLanguage(language);
    document.documentElement.dataset.uiLanguage = language;
  }, [language]);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      const next = dark ? 'dark' : 'light';
      if (root.dataset.theme !== next) {
        // Switch every colour at once: without this, cards, buttons and fields fade over at their own
        // speeds and the page shows both themes for a moment.
        root.classList.add('theme-switching');
        requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')));
        root.dataset.theme = next;
      }
      // Browser chrome follows the page background token.
      const bg = getComputedStyle(root).getPropertyValue('--color-bg').trim();
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', bg));
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  return null;
}
