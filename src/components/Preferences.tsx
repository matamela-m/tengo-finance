import { useEffect } from 'react';
import i18n from '../i18n';
import { useSession } from '../store/session';

/** Keeps i18next, <html lang> and the theme attribute in sync with the persisted session. */
export function Preferences() {
  const language = useSession((s) => s.language);
  const theme = useSession((s) => s.theme);

  useEffect(() => {
    void i18n.changeLanguage(language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      root.dataset.theme = dark ? 'dark' : 'light';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#161616' : '#EEEBE6');
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  return null;
}

export function useIsDark(): boolean {
  const theme = useSession((s) => s.theme);
  if (theme === 'system') return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return theme === 'dark';
}
