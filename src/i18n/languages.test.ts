import { describe, expect, it } from 'vitest';
import { contentLanguage, LANGUAGES, liveLanguageCount, MACHINE_UNSUPPORTED, translationStatus } from './languages';

describe('language status', () => {
  it('keeps the page language English while a translation is not done', () => {
    for (const l of LANGUAGES) {
      const s = translationStatus(l.code);
      expect(contentLanguage(l.code), l.code).toBe(s === 'machine' || s === 'reviewed' || s === 'source' ? l.code : 'en');
    }
  });

  it('never treats Tshivenda as machine translated', () => {
    expect(MACHINE_UNSUPPORTED).toContain('ve');
    expect(translationStatus('ve')).not.toBe('machine');
  });

  it('counts English as live', () => {
    expect(liveLanguageCount()).toBeGreaterThanOrEqual(1);
  });
});
