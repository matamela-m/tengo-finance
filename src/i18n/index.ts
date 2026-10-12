import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import af from './locales/af.json';
import ve from './locales/ve.json';
import ts from './locales/ts.json';
import zu from './locales/zu.json';
import st from './locales/st.json';

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    af: { translation: af },
    ve: { translation: ve },
    ts: { translation: ts },
    zu: { translation: zu },
    st: { translation: st },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
