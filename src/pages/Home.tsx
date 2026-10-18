import { useState } from 'react';
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
import { IconTile } from '../components/ui';
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

function Greeting({ name, forecast }: { name: string; forecast: Forecast }) {
  const { t } = useTranslation();
  const d = useDates();
  return (
    <section
      aria-label={t('home.greetingLabel')}
      className="relative overflow-hidden rounded-2xl border border-line bg-surface px-5 py-6 sm:px-7"
      style={{
        backgroundImage: `radial-gradient(120% 140% at 0% 0%, rgb(var(--accent) / 0.16), transparent 55%), radial-gradient(90% 140% at 100% 100%, rgb(var(--${forecast.state}) / 0.12), transparent 60%)`,
      }}
    >
      <p className="num text-xs font-semibold uppercase tracking-[0.08em] text-muted">{d.weekdayLong(forecast.today)}</p>
      <p className="mt-2 font-heading text-h2 text-ink">{t(`home.greeting.${greetingKey(new Date().getHours())}`, { name })}</p>
    </section>
  );
}

function StatTiles({ forecast }: { forecast: Forecast }) {
  const { t } = useTranslation();
  const d = useDates();
  const sts = useCountUp(forecast.safeToSpendToday);
  const n = forecast.nextMoney;
  const known = n && n.pattern !== 'unknown';
  const until = n?.latest ?? forecast.today;
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="card col-span-2 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="eyebrow">{t('sts.title')}</h2>
          <IconTile name="money" tone="accent" />
        </div>
        <p className="num mt-2 font-heading text-[48px] font-bold leading-none tracking-[-0.035em] text-ink sm:text-[56px]">
          <span aria-hidden>{formatZAR(sts)}</span>
          <span className="sr-only">{formatZAR(forecast.safeToSpendToday)}</span>
        </p>
        <p className="mt-3 text-sm text-muted">
          {forecast.billsTotalBeforeNextMoney > 0
            ? t('sts.withBills', { date: d.dayShort(until), bills: formatZAR(forecast.billsTotalBeforeNextMoney) })
            : t('sts.noBills', { date: d.dayShort(until) })}
        </p>
      </div>
      <div className="card p-5">
        <h2 className="eyebrow">{t('next.title')}</h2>
        <p className="num mt-3 font-heading text-[24px] font-bold leading-tight tracking-[-0.02em] text-ink">{known ? d.dayShort(n.typical) : t('home.unknownShort')}</p>
        <p className="num mt-1.5 text-sm text-muted">
          {known ? (n.amountLow === n.amountHigh ? formatZAR(n.amountTypical) : t('common.rangeAmounts', { low: formatZAR(n.amountLow), high: formatZAR(n.amountHigh) })) : t('next.unknown')}
        </p>
      </div>
      <div className="card p-5">
        <h2 className="eyebrow">{t('why.confidence')}</h2>
        <p className="mt-3 font-heading text-[24px] font-bold leading-tight tracking-[-0.02em] text-ink">{t(`confidence.${forecast.confidence}`)}</p>
        <p className="num mt-1.5 text-sm text-muted">{t('why.historyHint', { count: forecast.historyDays })}</p>
      </div>
    </div>
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

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-12 lg:items-start">
        <section className="card relative overflow-hidden p-6 sm:p-8 lg:col-span-7" aria-label={t('home.heroLabel')}>
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl" style={{ background: `rgb(var(--${forecast.state}) / 0.12)` }} />
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
            <button type="button" onClick={() => setWhyOpen(true)} className="btn-secondary mt-5 min-h-[40px] px-4 text-sm">
              <Icon name="info" size={16} />
              {t('why.open')}
            </button>
          </div>
        </section>

        <div className="lg:col-span-5">
          <StatTiles forecast={forecast} />
        </div>

        <div className="card p-5 sm:p-7 lg:col-span-7">
          <TimelineScrubber forecast={forecast} />
        </div>

        <div className="flex flex-col gap-4 sm:gap-5 lg:col-span-5">
          <HelpCard />
          <RecentActivity transactions={record.transactions} />
        </div>
      </div>

      <WhyDrawer forecast={forecast} open={whyOpen} onClose={() => setWhyOpen(false)} />
    </div>
  );
}
