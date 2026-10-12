import { describe, expect, it } from 'vitest';
import { formatDayShort, formatZAR } from './format';

describe('formatZAR', () => {
  it('uses a space thousands separator and no decimals for whole rands', () => {
    expect(formatZAR(1250)).toBe('R1 250');
    expect(formatZAR(1250000)).toBe('R1 250 000');
    expect(formatZAR(95)).toBe('R95');
  });
  it('shows cents only when needed', () => {
    expect(formatZAR(12.5)).toBe('R12.50');
  });
  it('handles signs', () => {
    expect(formatZAR(-300)).toBe('-R300');
    expect(formatZAR(300, { sign: true })).toBe('+R300');
  });
});

describe('formatDayShort', () => {
  it('formats as weekday day month', () => {
    expect(formatDayShort('2026-10-23', 'en')).toBe('Fri 23 Oct');
  });
});
