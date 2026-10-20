import i18n from '../i18n';
import { homeView } from '../engine/view';
import { formatDayShort, formatZAR } from '../lib/format';
import type { DailyMessage, MessageContext, MessageWriter } from './MessageWriter';

/**
 * Fills fixed templates from the locale files (keys under "messages").
 * WhatsApp gets a few short lines. SMS gets one line that fits 160 characters.
 */
export class TemplateMessageWriter implements MessageWriter {
  async write({ name, forecast: f, language, channel, discreet = false }: MessageContext): Promise<DailyMessage> {
    const t = i18n.getFixedT(language);
    // Every message names the sender and says how to stop (POPIA s69, WASPA). Discreet ones carry no figures.
    if (discreet) {
      const text = channel === 'sms' ? t('messages.sms.discreet') : [t('messages.whatsapp.discreet'), t('messages.whatsapp.stop')].join('\n');
      return { channel, language, text };
    }
    // Messages follow the same Home rule as the screen: one next-money date, no budget figure when Short.
    const v = homeView(f);
    const date = v.headline.date ? formatDayShort(v.headline.date, language) : '';
    const next = v.nextMoney ? formatDayShort(v.nextMoney.date, language) : null;
    const vars = {
      name,
      date,
      state: t(`state.${v.status}`),
      sts: v.budget.kind === 'amount' ? formatZAR(v.budget.amount) : '',
      next: next ?? '',
      count: v.gapDays,
    };

    if (v.status === 'unclear') {
      const text =
        channel === 'sms' ? `${t('messages.sms.unclear', vars)} ${t('messages.sms.stop')}` : [t('messages.whatsapp.greeting', vars), t('messages.whatsapp.unclear', vars), t('messages.whatsapp.stop')].join('\n');
      return { channel, language, text };
    }

    const budgetLine =
      v.budget.kind === 'amount' ? t('messages.whatsapp.sts', vars) : v.budget.kind === 'pending' ? t('messages.whatsapp.stsPending', vars) : t('messages.whatsapp.stsNotAdvised', vars);
    if (channel === 'sms') {
      const parts = [t(`messages.sms.${v.status}`, vars), next ? t('messages.sms.next', vars) : '', t('messages.sms.stop')];
      return { channel, language, text: parts.filter(Boolean).join(' ') };
    }

    const lines = [
      t('messages.whatsapp.greeting', vars),
      t(`messages.whatsapp.${v.status}`, vars),
      budgetLine,
      next ? t('messages.whatsapp.next', vars) : t('messages.whatsapp.noNext'),
      t(`messages.whatsapp.tip.${v.status}`, vars),
      t('messages.whatsapp.stop'),
    ];
    return { channel, language, text: lines.join('\n') };
  }
}

export const messageWriter: MessageWriter = new TemplateMessageWriter();
