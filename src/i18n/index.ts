import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Every locale file is bundled, so switching language never makes a network request.
const files = import.meta.glob<{ default: Record<string, unknown> }>('./locales/*.json', { eager: true });
const resources = Object.fromEntries(
  Object.entries(files).map(([path, mod]) => [path.replace(/^.*\/(.+)\.json$/, '$1'), { translation: mod.default }]),
);

void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
