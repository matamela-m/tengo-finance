import status from './status.json';

/** South Africa's 11 official written languages. Codes match the locale files and Google Translate. */
export const LANGUAGES = [
  { code: 'en', native: 'English', english: 'English' },
  { code: 'af', native: 'Afrikaans', english: 'Afrikaans' },
  { code: 'nr', native: 'isiNdebele', english: 'South Ndebele' },
  { code: 'xh', native: 'isiXhosa', english: 'Xhosa' },
  { code: 'zu', native: 'isiZulu', english: 'Zulu' },
  { code: 'nso', native: 'Sepedi', english: 'Northern Sotho' },
  { code: 'st', native: 'Sesotho', english: 'Southern Sotho' },
  { code: 'tn', native: 'Setswana', english: 'Tswana' },
  { code: 'ss', native: 'siSwati', english: 'Swati' },
  { code: 've', native: 'Tshivenda', english: 'Venda' },
  { code: 'ts', native: 'Xitsonga', english: 'Tsonga' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

/** Google Cloud Translation does not support Tshivenda, so it can only be translated by a person. */
export const MACHINE_UNSUPPORTED: LanguageCode[] = ['ve'];

export function isLanguageCode(value: string): value is LanguageCode {
  return LANGUAGES.some((l) => l.code === value);
}

export function languageName(code: LanguageCode): string {
  return LANGUAGES.find((l) => l.code === code)?.native ?? code;
}

/**
 * source: English. machine: filled by Google Translate, not yet checked. reviewed: every string checked by
 * a first-language speaker. pending: shows English for now. needsTranslator: shows English and cannot be
 * machine translated (Tshivenda).
 */
export type TranslationStatus = 'source' | 'machine' | 'reviewed' | 'pending' | 'needsTranslator';

export function translationStatus(code: LanguageCode): TranslationStatus {
  if (code === 'en') return 'source';
  return ((status as Record<string, string>)[code] as TranslationStatus | undefined) ?? 'pending';
}

/** The language the visible text is actually in, for <html lang>. English while a language is not translated. */
export function contentLanguage(code: LanguageCode): LanguageCode {
  const s = translationStatus(code);
  return s === 'machine' || s === 'reviewed' ? code : 'en';
}

/** How many languages show their own text today, counting English. */
export function liveLanguageCount(): number {
  return LANGUAGES.filter((l) => contentLanguage(l.code) === l.code).length;
}

// Every language resolves to en-ZA for dates and numbers until translators confirm local formats.
export const INTL_LOCALE: Record<LanguageCode, string> = Object.fromEntries(LANGUAGES.map((l) => [l.code, 'en-ZA'])) as Record<LanguageCode, string>;
