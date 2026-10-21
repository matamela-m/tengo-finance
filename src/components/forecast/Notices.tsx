import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePersona, useReadyPersona } from '../../data/PersonaProvider';
import type { Notice as NoticeItem } from '../../engine/view';
import { formatZAR } from '../../lib/format';
import { useDates } from '../../lib/useLang';
import { BalanceUpdate } from '../BalanceUpdate';
import { Notice } from '../Feedback';

/**
 * Plain notices that explain when the usual pattern does not hold: overdrawn, old statement, paused or
 * irregular income, a payment due today, a bill that looks unpaid, one-offs left out. Each says what
 * Tengo assumed and, where the person can fix it, offers the one action that does.
 */
export function HomeNotices({ notices }: { notices: NoticeItem[] }) {
  const { t } = useTranslation();
  const d = useDates();
  const { today, forecast, record } = useReadyPersona();
  const { setBillDecision, addTransactions, updateTransaction } = usePersona();
  const [busy, setBusy] = useState(false);
  if (notices.length === 0) return null;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    await fn();
    setBusy(false);
  };

  const confirmPayment = () =>
    run(async () => {
      // Records that today's payment landed and adds it to the balance, as the bank would.
      const amount = forecast.nextMoney?.amountTypical ?? 0;
      const entry = { id: `confirm-${today}-${Date.now().toString(36)}`, date: today, description: t('notice.pendingToday.entry'), amount, category: 'income' as const };
      await addTransactions([entry], record.balance + amount);
    });

  return (
    <section aria-label={t('notice.label')} className="flex flex-col gap-3">
      {notices.map((n) => {
        switch (n.kind) {
          case 'overdrawn':
            return (
              <Notice key="overdrawn" tone="danger">
                <p className="font-semibold">{t('notice.overdrawn.title', { amount: formatZAR(n.amount) })}</p>
                <p className="mt-0.5">{t('notice.overdrawn.body')}</p>
              </Notice>
            );
          case 'asOf':
            return (
              <Notice key="asOf" tone="warn" icon="clock">
                <p className="font-semibold">{t('notice.asOf.title')}</p>
                <p className="num mt-0.5">{t('notice.asOf.body', { date: d.dayShort(n.statementEnd), count: n.daysAgo })}</p>
                <BalanceUpdate />
              </Notice>
            );
          case 'historyEnds':
            return (
              <Notice key="historyEnds" icon="clock">
                <p className="num font-semibold">{t('notice.historyEnds.title', { date: d.dayShort(n.date) })}</p>
                <p className="mt-0.5">{t('notice.historyEnds.body')}</p>
              </Notice>
            );
          case 'paused':
            return (
              <Notice key="paused" tone="warn" icon="pause">
                <p className="font-semibold">{t('notice.paused.title')}</p>
                <p className="num mt-0.5">{n.lastDate ? t('notice.paused.body', { date: d.dayShort(n.lastDate) }) : t('notice.pausedNoDate')}</p>
              </Notice>
            );
          case 'irregular':
            return (
              <Notice key="irregular" icon="info">
                <p className="font-semibold">{t('notice.irregular.title')}</p>
                <p className="mt-0.5">{t('notice.irregular.body')}</p>
              </Notice>
            );
          case 'pendingToday':
            return (
              <Notice key="pending" icon="clock">
                <p className="font-semibold">{t('notice.pendingToday.title')}</p>
                <p className="mt-0.5">{t('notice.pendingToday.body')}</p>
                <button type="button" className="btn-secondary mt-3 min-h-[44px]" disabled={busy} onClick={() => void confirmPayment()}>
                  {t('notice.pendingToday.action')}
                </button>
              </Notice>
            );
          case 'missedBill':
            return (
              <Notice key={n.bill.id} tone="warn" icon="receipt">
                <p className="num font-semibold">{t('notice.missedBill.title', { name: n.bill.description, amount: formatZAR(n.bill.amount) })}</p>
                <p className="num mt-0.5">{t('notice.missedBill.body', { date: d.dayShort(n.bill.dueDate) })}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="btn-secondary min-h-[44px]" disabled={busy} onClick={() => void run(() => setBillDecision(n.bill.id, 'owed'))}>
                    {t('notice.missedBill.owed')}
                  </button>
                  <button type="button" className="btn-ghost min-h-[44px]" disabled={busy} onClick={() => void run(() => setBillDecision(n.bill.id, 'settled'))}>
                    {t('notice.missedBill.settled')}
                  </button>
                </div>
              </Notice>
            );
          case 'askOneOff':
            return (
              <Notice key={n.id} icon="info">
                <p className="num font-semibold">{t('notice.askOneOff.title', { name: n.description, amount: formatZAR(n.amount), date: d.dayShort(n.date) })}</p>
                <p className="mt-0.5">{t('notice.askOneOff.body')}</p>
                <button
                  type="button"
                  className="btn-secondary mt-3 min-h-[44px]"
                  disabled={busy}
                  onClick={() => void run(() => updateTransaction(n.id, { oneOff: true }, { fields: 'one-off' }))}
                >
                  {t('notice.askOneOff.action')}
                </button>
              </Notice>
            );
          case 'sample':
            return (
              <Notice key="sample" icon="sparkle">
                <p className="font-semibold">{t('notice.sample.title')}</p>
                <p className="mt-0.5">{t('notice.sample.body')}</p>
                <Link to="/app/money/setup" className="btn-secondary mt-3 min-h-[44px]">
                  {t('notice.sample.action')}
                </Link>
              </Notice>
            );
          case 'estimated':
            return (
              <Notice key="estimated" icon="sliders">
                <p className="font-semibold">{t('notice.estimated.title')}</p>
                <p className="mt-0.5">{t('notice.estimated.body')}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link to="/app/money/import" className="btn-secondary min-h-[44px]">
                    {t('money.import')}
                  </Link>
                </div>
              </Notice>
            );
          case 'oneOffs':
            return (
              <Notice key="oneOffs" icon="info">
                <p>{t('notice.oneOffs.body', { count: n.count })}</p>
                <Link to="/app/money" className="mt-1 inline-flex min-h-[44px] items-center font-medium text-accent underline-offset-4 hover:underline">
                  {t('notice.oneOffs.action')}
                </Link>
              </Notice>
            );
        }
      })}
    </section>
  );
}
