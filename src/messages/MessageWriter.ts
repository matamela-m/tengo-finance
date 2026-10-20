import type { Forecast } from '../engine/types';
import type { LanguageCode } from '../i18n/languages';

export type Channel = 'whatsapp' | 'sms';

export interface MessageContext {
  name: string;
  forecast: Forecast;
  language: LanguageCode;
  channel: Channel;
  /** Discreet: no amounts, dates or state words, for shared phones and lock-screen previews. */
  discreet?: boolean;
}

export interface DailyMessage {
  channel: Channel;
  language: LanguageCode;
  /** Plain text. WhatsApp text may use *bold* markers. */
  text: string;
}

/**
 * Writes the daily message. The template writer is the only one today.
 * An LLM-backed writer can implement the same interface later without UI changes.
 */
export interface MessageWriter {
  write(ctx: MessageContext): Promise<DailyMessage>;
}

export const SMS_LIMIT = 160;

// GSM 03.38 basic set plus the extension table. Anything else forces UCS-2 (70 characters a part).
const GSM = new Set(
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'.split(''),
);
const GSM_EXT = new Set('^{}\\[~]|€'.split(''));

/** SMS length by encoding: GSM-7 (160 a part, 153 when split) or UCS-2 (70, 67), so every language is counted right. */
export function smsSegments(text: string): { encoding: 'GSM-7' | 'UCS-2'; units: number; perPart: number; parts: number } {
  const chars = [...text];
  const gsm = chars.every((c) => GSM.has(c) || GSM_EXT.has(c));
  const units = gsm ? chars.reduce((n, c) => n + (GSM_EXT.has(c) ? 2 : 1), 0) : chars.length;
  const single = gsm ? 160 : 70;
  const multi = gsm ? 153 : 67;
  const parts = units <= single ? 1 : Math.ceil(units / multi);
  return { encoding: gsm ? 'GSM-7' : 'UCS-2', units, perPart: parts === 1 ? single : multi, parts };
}
