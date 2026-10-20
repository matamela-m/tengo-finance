import i18n from '../i18n';
import { homeView } from '../engine/view';
import { formatDayShort, formatZAR } from '../lib/format';
import type { DailyMessage, MessageContext, MessageWriter } from './MessageWriter';

/**
 * Fills fixed templates from the locale files (keys under "messages").
 * WhatsApp gets a few short lines. SMS gets one line that fits 160 characters.
 */
export class TemplateMessageWriter implements MessageWriter {
  async write({ name, forecast: f, language, channel }: MessageContext): Promise<DailyMessage> {
    const t = i18n.getFixedT(language);
    // Messages follow the same Home rule as the screen: one next-money date, no budget figure when Short.
    const v = homeView(f);
    const date = formatDayShort(v.headline.date, language);
    const next = v.nextMoney ? formatDayShort(v.nextMoney.date, language) : null;
    const vars = {
      name,
      date,
      state: t(`state.${v.state}`),
      sts: v.budget.kind === 'amount' ? formatZAR(v.budget.amount) : '',
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
      v.budget.kind === 'amount' ? t('messages.whatsapp.sts', vars) : t('messages.whatsapp.stsNotAdvised', vars),
      next ? t('messages.whatsapp.next', vars) : t('messages.whatsapp.noNext'),
      t(`messages.whatsapp.tip.${f.state}`, vars),
    ];
    return { channel, language, text: lines.join('\n') };
  }
}

export const messageWriter: MessageWriter = new TemplateMessageWriter();
