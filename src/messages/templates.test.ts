import { describe, expect, it } from 'vitest';
import '../i18n';
import { forecast } from '../engine/forecast';
import { steadyHistory } from '../engine/testUtils';
import { SMS_LIMIT, smsSegments } from './MessageWriter';
import { TemplateMessageWriter } from './templates';

const today = '2026-10-12';
const history = steadyHistory(today, 90);
const writer = new TemplateMessageWriter();

describe('TemplateMessageWriter', () => {
  for (const [state, balance] of [['enough', 700], ['tight', 500], ['short', 300]] as const) {
    it(`writes a ${state} message for both channels`, async () => {
      const f = forecast({ transactions: history, balance, today });
      expect(f.state).toBe(state);
      const wa = await writer.write({ name: 'Lerato', forecast: f, language: 'en', channel: 'whatsapp' });
      expect(wa.text).toContain('Lerato');
      expect(wa.text.split('\n').length).toBeGreaterThanOrEqual(4);
      const sms = await writer.write({ name: 'Lerato', forecast: f, language: 'en', channel: 'sms' });
      expect(sms.text.length).toBeLessThanOrEqual(SMS_LIMIT);
      expect(sms.text).not.toMatch(/[!\u2013\u2014]/);
      expect(wa.text).not.toMatch(/[!\u2013\u2014]/);
    });
  }

  it('never gives a budget figure when Short, on either channel', async () => {
    const f = forecast({ transactions: history, balance: 300, today });
    const wa = await writer.write({ name: 'Ayanda', forecast: f, language: 'en', channel: 'whatsapp' });
    const sms = await writer.write({ name: 'Ayanda', forecast: f, language: 'en', channel: 'sms' });
    expect(wa.text).toContain('Daily budget: not advised');
    expect(sms.text).toContain('Budget not advised');
    expect(wa.text).not.toMatch(/safe/i);
    expect(sms.text).not.toMatch(/safe/i);
  });

  it('uses the typical next-money date, the same one Home shows', async () => {
    const f = forecast({ transactions: history, balance: 700, today });
    const wa = await writer.write({ name: 'Lerato', forecast: f, language: 'en', channel: 'whatsapp' });
    // Pay lands on Fridays: typical Fri 16 Oct, latest Sat 17 Oct.
    expect(wa.text).toContain('Fri 16 Oct');
    expect(wa.text).not.toContain('17 Oct');
  });

  it('names the sender and says how to stop in every message, and SMS fits one GSM part in English', async () => {
    for (const balance of [700, 500, 300]) {
      const f = forecast({ transactions: history, balance, today });
      for (const channel of ['whatsapp', 'sms'] as const) {
        const m = await writer.write({ name: 'Lerato', forecast: f, language: 'en', channel });
        expect(m.text, channel).toMatch(/Reply STOP/);
        expect(m.text, channel).toMatch(/Tengo/);
        if (channel === 'sms') expect(smsSegments(m.text)).toMatchObject({ encoding: 'GSM-7', parts: 1 });
      }
    }
  });

  it('discreet messages carry no amounts, dates or cover words', async () => {
    const f = forecast({ transactions: history, balance: 300, today });
    for (const channel of ['whatsapp', 'sms'] as const) {
      const m = await writer.write({ name: 'Ayanda', forecast: f, language: 'en', channel, discreet: true });
      expect(m.text).not.toMatch(/R\s?\d|Oct|Short|Tight|Enough|Ayanda/);
      expect(m.text).toMatch(/Reply STOP/);
    }
  });

  it('counts SMS parts by encoding', () => {
    expect(smsSegments('a'.repeat(160))).toMatchObject({ encoding: 'GSM-7', parts: 1 });
    expect(smsSegments('a'.repeat(161))).toMatchObject({ encoding: 'GSM-7', parts: 2 });
    expect(smsSegments('ḓ'.repeat(70))).toMatchObject({ encoding: 'UCS-2', parts: 1 });
    expect(smsSegments('ḓ'.repeat(71))).toMatchObject({ encoding: 'UCS-2', parts: 2 });
    expect(smsSegments('€'.repeat(80))).toMatchObject({ encoding: 'GSM-7', units: 160, parts: 1 });
  });
});
