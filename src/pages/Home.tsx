import { useState, type CSSProperties } from 'react';
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
import type { Forecast } from '../engine/types';
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

/** Safe to spend leads; next money and confidence sit beside it as quiet figures. */
function Stats({ forecast }: { forecast: Forecast }) {
  const { t } = useTranslation();
  const d = useDates();
  const sts = useCountUp(forecast.safeToSpendToday);
  const n = forecast.nextMoney;
  const known = n && n.pattern !== 'unknown';
  const until = n?.latest ?? forecast.today;
  return (
    <section className="card p-5 sm:p-6" aria-labelledby="sts-title">
      <h2 id="sts-title" className="eyebrow">
        {t('sts.title')}
      </h2>
      <p className="num mt-2 font-heading text-[40px] font-bold leading-none tracking-[-0.035em] text-ink">
        <span aria-hidden>{formatZAR(sts)}</span>
        <span className="sr-only">{formatZAR(forecast.safeToSpendToday)}</span>
      </p>
      <p className="num mt-2 text-sm text-muted">
        {forecast.billsTotalBeforeNextMoney > 0
          ? t('sts.withBills', { date: d.dayShort(until), bills: formatZAR(forecast.billsTotalBeforeNextMoney) })
          : t('sts.noBills', { date: d.dayShort(until) })}
      </p>
      <dl className="mt-5 grid grid-cols-2 border-t border-line pt-4">
        <div className="pr-4">
          <dt className="eyebrow">{t('next.title')}</dt>
          <dd className="num mt-1.5 font-heading text-[19px] font-semibold tracking-[-0.01em] text-ink">{known ? d.dayShort(n.typical) : t('home.unknownShort')}</dd>
          {known && (
            <dd className="num mt-0.5 text-xs text-subtle">
              {n.amountLow === n.amountHigh ? formatZAR(n.amountTypical) : t('common.rangeAmounts', { low: formatZAR(n.amountLow), high: formatZAR(n.amountHigh) })}
            </dd>
          )}
        </div>
        <div className="border-l border-line pl-4">
          <dt className="eyebrow">{t('why.confidence')}</dt>
          <dd className="mt-1.5 font-heading text-[19px] font-semibold tracking-[-0.01em] text-ink">{t(`confidence.${forecast.confidence}`)}</dd>
          <dd className="num mt-0.5 text-xs text-subtle">{t('why.historyHint', { count: forecast.historyDays })}</dd>
        </div>
      </dl>
    </section>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  const { forecast, record, profile } = useReadyPersona();
  const [whyOpen, setWhyOpen] = useState(false);
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
                  <StateChip state={forecast.state} size="lg" />
                  <CoverBars state={forecast.state} size={88} />
                </div>
                <p className="mt-4 max-w-xl text-[15px] text-muted">{t(`stateCard.${forecast.state}`, { count: forecast.gapDays })}</p>
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
            <Stats forecast={forecast} />
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
