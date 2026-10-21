import { describe, expect, it } from 'vitest';
import { contentLanguage, LANGUAGES, liveLanguageCount, MACHINE_UNSUPPORTED, translationStatus } from './languages';

describe('language status', () => {
  it('keeps the page language English while a translation is not done', () => {
    for (const l of LANGUAGES) {
      const s = translationStatus(l.code);
      expect(contentLanguage(l.code), l.code).toBe(s === 'machine' || s === 'reviewed' || s === 'source' ? l.code : 'en');
    }
  });

  // Changed when the AI drafts arrived: Tshivenda may now be an AI draft, but Google, which does not support
  // it, is never used for it. Whether "reviewed" is earned string by string is checked by npm run i18n:check.
  it('never sends Tshivenda to Google, and every status is a known one', () => {
    expect(MACHINE_UNSUPPORTED).toContain('ve');
    for (const l of LANGUAGES) expect(['source', 'machine', 'reviewed', 'pending', 'needsTranslator'], l.code).toContain(translationStatus(l.code));
  });

  it('counts English as live', () => {
    expect(liveLanguageCount()).toBeGreaterThanOrEqual(1);
  });
});
