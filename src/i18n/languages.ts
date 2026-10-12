export const LANGUAGES = [
  { code: 'en', native: 'English' },
  { code: 'af', native: 'Afrikaans' },
  { code: 've', native: 'Tshivenda' },
  { code: 'ts', native: 'Xitsonga' },
  { code: 'zu', native: 'isiZulu' },
  { code: 'st', native: 'Sesotho' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

export function isLanguageCode(value: string): value is LanguageCode {
  return LANGUAGES.some((l) => l.code === value);
}

// Every language resolves to en-ZA for dates and numbers until translators confirm local formats.
export const INTL_LOCALE: Record<LanguageCode, string> = {
  en: 'en-ZA',
  af: 'en-ZA',
  ve: 'en-ZA',
  ts: 'en-ZA',
  zu: 'en-ZA',
  st: 'en-ZA',
};
