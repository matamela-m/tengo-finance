import { useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CoverBars } from '../components/CoverBars';
import { EmptyState } from '../components/Feedback';
import { DateHero } from '../components/forecast/DateHero';
import { RecentActivity } from '../components/forecast/Cards';
import { HelpCard } from '../components/forecast/HelpCard';
import { RangeBand } from '../components/forecast/RangeBand';
import { TimelineScrubber } from '../components/forecast/TimelineScrubber';
import { WhyDrawer } from '../components/forecast/WhyDrawer';
import { Icon } from '../components/Icon';
import { StateChip } from '../components/StateChip';
import { useReadyPersona } from '../data/PersonaProvider';
import type { Forecast, UpcomingBill } from '../engine/types';
import { homeView, type HomeView } from '../engine/view';
import { formatZAR } from '../lib/format';
import { useCountUp } from '../lib/useCountUp';
import { useDates } from '../lib/useLang';
import { usePageTitle } from '../lib/usePageTitle';

function greetingKey(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

/** A quiet line on phones, a soft banner from tablet up. */
function Greeting({ name, forecast }: { name: string; forecast: Forecast }) {
  const { t } = useTranslation();
  const d = useDates();
  return (
    <section
      aria-label={t('home.greetingLabel')}
      className="sm:rounded-2xl sm:border sm:border-line sm:bg-surface sm:px-7 sm:py-6 sm:[background-image:var(--greet)]"
      style={
        {
          '--greet': `radial-gradient(120% 140% at 0% 0%, rgb(var(--accent) / 0.14), transparent 55%), radial-gradient(90% 140% at 100% 100%, rgb(var(--${forecast.state}) / 0.1), transparent 60%)`,
        } as CSSProperties
      }
    >
      <p className="num text-xs font-medium uppercase tracking-[0.08em] text-subtle">{d.weekdayLong(forecast.today)}</p>
      <p className="mt-1 font-heading text-[20px] font-semibold tracking-[-0.015em] text-ink sm:mt-2 sm:text-h2">
        {t(`home.greeting.${greetingKey(new Date().getHours())}`, { name })}
      </p>
    </section>
  );
}

/** The daily budget leads, ruled by the state; next money and confidence sit beside it as quiet figures. */
function Stats({ view, historyDays }: { view: HomeView; historyDays: number }) {
  const { t } = useTranslation();
  const d = useDates();
  const b = view.budget;
  const reserveLine = (amount: number, bills: UpcomingBill[]) =>
    amount <= 0 || bills.length === 0
      ? t('sts.noReserve')
      : bills.length === 1
        ? t('sts.reserveOne', { amount: formatZAR(amount), name: bills[0]!.description, date: d.dayMonth(bills[0]!.date) })
        : t('sts.reserveMany', { amount: formatZAR(amount), count: bills.length });
  const shown = useCountUp(b.kind === 'amount' ? b.amount : 0);
  const n = view.nextMoney;
  return (
    <section className="card p-5 sm:p-6" aria-labelledby="sts-title">
      <h2 id="sts-title" className="eyebrow">
        {t('sts.title')}
      </h2>
      {b.kind === 'amount' ? (
        <>
          <p className="num mt-2 font-heading text-[40px] font-bold leading-none tracking-[-0.035em] text-ink">
            <span aria-hidden>{formatZAR(shown)}</span>
            <span className="sr-only">{formatZAR(b.amount)}</span>
          </p>
          <p className="num mt-2 text-sm text-muted">{b.bills > 0 ? t('sts.withBills', { bills: formatZAR(b.bills) }) : t('sts.noBills')}</p>
          <p className="num mt-1 text-sm text-muted">{reserveLine(b.reserve, b.reserveBills)}</p>
        </>
      ) : b.kind === 'nothingSpare' ? (
        <>
          <p className="mt-2 font-heading text-[32px] font-bold leading-none tracking-[-0.03em] text-ink">{t('sts.nothingSpare')}</p>
          <p className="num mt-2 text-sm text-muted">{reserveLine(b.reserve, b.reserveBills)}</p>
        </>
      ) : (
        <>
          <p className="mt-2 font-heading text-[32px] font-bold leading-none tracking-[-0.03em] text-ink">{t('sts.notAdvised')}</p>
          <p className="num mt-2 text-sm text-muted">{t('sts.notAdvisedWhy', { usual: formatZAR(b.usual), count: b.gapDays })}</p>
        </>
      )}
      {b.kind !== 'notAdvised' && <p className="num mt-1 text-sm text-muted">{t('sts.usual', { amount: formatZAR(b.usual) })}</p>}
      <p className="mt-3 text-xs text-subtle">{t('sts.disclaimer')}</p>
      <dl className="mt-5 grid grid-cols-2 border-t border-line pt-4">
        <div className="pr-4">
          <dt className="eyebrow">{t('next.title')}</dt>
          <dd className="num mt-1.5 font-heading text-[19px] font-semibold tracking-[-0.01em] text-ink">{n ? d.dayShort(n.date) : t('home.unknownShort')}</dd>
          {n && (
            <dd className="num mt-0.5 text-xs text-subtle">
              {n.amountLow === n.amountHigh ? formatZAR(n.amountTypical) : t('common.rangeAmounts', { low: formatZAR(n.amountLow), high: formatZAR(n.amountHigh) })}
            </dd>
          )}
        </div>
        <div className="border-l border-line pl-4">
          <dt className="eyebrow">{t('why.confidence')}</dt>
          <dd className="mt-1.5 font-heading text-[19px] font-semibold tracking-[-0.01em] text-ink">{t(`confidence.${view.confidence}`)}</dd>
          <dd className="num mt-0.5 text-xs text-subtle">{t('why.historyHint', { count: historyDays })}</dd>
        </div>
      </dl>
    </section>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  const { forecast, record, profile } = useReadyPersona();
  const [whyOpen, setWhyOpen] = useState(false);
  const view = useMemo(() => homeView(forecast), [forecast]);
  usePageTitle(t('nav.home'));

  if (record.transactions.length === 0) {
    return (
      <EmptyState
        icon="upload"
        title={t('home.emptyTitle')}
        body={t('home.emptyBody')}
        action={
          <Link to="/app/money/import" className="btn-primary">
            {t('money.import')}
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <Greeting name={profile.name} forecast={forecast} />

      {/* Two independent columns on desktop; one ordered stack below 1024px via display: contents. */}
      <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-start">
        <div className="contents lg:flex lg:w-[58%] lg:flex-col lg:gap-5">
          <div className="order-1 lg:order-none">
            <section className="card relative overflow-hidden p-6 sm:p-8" aria-label={t('home.heroLabel')}>
              <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl" style={{ background: `rgb(var(--${forecast.state}) / 0.1)` }} />
              <div className="relative">
                <DateHero forecast={forecast} />
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <StateChip state={view.state} size="lg" />
                  <CoverBars state={view.state} size={88} />
                </div>
                <p className="mt-4 max-w-xl text-[15px] text-muted">{t(`stateCard.${view.summaryKey}`, { count: view.gapDays, amount: formatZAR(forecast.reserve) })}</p>
                <div className="mt-6 border-t border-line pt-5">
                  <RangeBand forecast={forecast} />
                </div>
                <button type="button" onClick={() => setWhyOpen(true)} className="btn-ghost -ml-3 mt-3 min-h-[44px] px-3 text-sm text-muted">
                  <Icon name="info" size={16} />
                  {t('why.open')}
                </button>
              </div>
            </section>
          </div>
          <div className="card order-3 p-5 sm:p-7 lg:order-none">
            <TimelineScrubber forecast={forecast} />
          </div>
        </div>
        <div className="contents lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:gap-5">
          <div className="order-2 lg:order-none">
            <Stats view={view} historyDays={forecast.historyDays} />
          </div>
          <div className="order-4 lg:order-none">
            <HelpCard />
          </div>
          <div className="order-5 lg:order-none">
            <RecentActivity transactions={record.transactions} />
          </div>
        </div>
      </div>

      <WhyDrawer forecast={forecast} open={whyOpen} onClose={() => setWhyOpen(false)} />
    </div>
  );
}
