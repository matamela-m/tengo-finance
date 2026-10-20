import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';

// English is bundled. Every other language is its own small file, loaded the first time it is chosen
// and then cached by the service worker, so switching works offline after the first visit.
const loaders = import.meta.glob<{ default: Record<string, unknown> }>(['./locales/*.json', '!./locales/en.json']);

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

/** Loads a language's strings if they are not loaded yet. Unknown codes fall back to English. */
export async function loadLanguage(code: string): Promise<void> {
  if (i18n.hasResourceBundle(code, 'translation')) return;
  const load = loaders[`./locales/${code}.json`];
  if (!load) return;
  const mod = await load();
  i18n.addResourceBundle(code, 'translation', mod.default, true, true);
}

export default i18n;
