import i18n from '../i18n';
import { formatDayShort, formatZAR } from '../lib/format';
import type { DailyMessage, MessageContext, MessageWriter } from './MessageWriter';

/**
 * Fills fixed templates from the locale files (keys under "messages").
 * WhatsApp gets a few short lines. SMS gets one line that fits 160 characters.
 */
export class TemplateMessageWriter implements MessageWriter {
  async write({ name, forecast: f, language, channel }: MessageContext): Promise<DailyMessage> {
    const t = i18n.getFixedT(language);
    const date = formatDayShort(f.headlineDate, language);
    const next = f.nextMoney && f.nextMoney.pattern !== 'unknown' ? formatDayShort(f.nextMoney.typical, language) : null;
    const vars = {
      name,
      date,
      state: t(`state.${f.state}`),
      sts: formatZAR(f.safeToSpendToday),
      next: next ?? '',
      count: f.gapDays,
    };

    if (channel === 'sms') {
      const parts = [t(`messages.sms.${f.state}`, vars), next ? t('messages.sms.next', vars) : ''];
      return { channel, language, text: parts.filter(Boolean).join(' ') };
    }

    const lines = [
      t('messages.whatsapp.greeting', vars),
      t(`messages.whatsapp.${f.state}`, vars),
      t('messages.whatsapp.sts', vars),
      next ? t('messages.whatsapp.next', vars) : t('messages.whatsapp.noNext'),
      t(`messages.whatsapp.tip.${f.state}`, vars),
    ];
    return { channel, language, text: lines.join('\n') };
  }
}

export const messageWriter: MessageWriter = new TemplateMessageWriter();
