import type { Forecast } from '../engine/types';
import type { LanguageCode } from '../i18n/languages';

export type Channel = 'whatsapp' | 'sms';

export interface MessageContext {
  name: string;
  forecast: Forecast;
  language: LanguageCode;
  channel: Channel;
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
