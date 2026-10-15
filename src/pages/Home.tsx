import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CoverBars } from '../components/CoverBars';
import { DateHero } from '../components/forecast/DateHero';
import { NextMoneyCard, RecentActivity, SafeToSpendCard, StateCard } from '../components/forecast/Cards';
import { RangeBand } from '../components/forecast/RangeBand';
import { TimelineScrubber } from '../components/forecast/TimelineScrubber';
import { WhyDrawer } from '../components/forecast/WhyDrawer';
import { HelpCard } from '../components/forecast/HelpCard';
import { Icon } from '../components/Icon';
import { StateChip } from '../components/StateChip';
import { useReadyPersona } from '../data/PersonaProvider';
import { usePageTitle } from '../lib/usePageTitle';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/Feedback';
import { Link } from 'react-router-dom';

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
    <>
      <div className="mb-5 flex items-center gap-3 lg:mb-6">
        <Avatar persona={profile} size={40} />
        <div className="min-w-0">
          <p className="text-sm text-muted">{t('home.greeting', { name: profile.name })}</p>
          <p className="truncate text-sm font-medium">{t(`personas.${profile.id}.role`)}</p>
        </div>
      </div>

      {/* Columns become one ordered stack below 1024px via display: contents. */}
      <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-start lg:gap-6">
        <div className="contents lg:flex lg:w-[58%] lg:flex-col lg:gap-6">
          <section className="card relative order-1 overflow-hidden p-6 sm:p-8 lg:order-none" aria-label={t('home.heroLabel')}>
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-mint/40 blur-2xl" aria-hidden />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <DateHero forecast={forecast} />
              <div className="flex items-center gap-3">
                <StateChip state={forecast.state} size="lg" />
                <CoverBars state={forecast.state} size={36} />
              </div>
            </div>
            {forecast.state === 'short' && (
              <p className="relative mt-3 text-[15px] font-semibold text-short-text">{t('hero.gap', { count: forecast.gapDays })}</p>
            )}
            <div className="relative mt-6 border-t border-line pt-5">
              <RangeBand forecast={forecast} />
            </div>
            <button type="button" onClick={() => setWhyOpen(true)} className="btn-ghost relative -ml-3 mt-3">
              <Icon name="info" size={18} />
              {t('why.open')}
            </button>
          </section>

          <div className="card order-5 p-6 sm:p-8 lg:order-none">
            <TimelineScrubber forecast={forecast} />
          </div>
        </div>

        <div className="contents lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:gap-6">
          <div className="order-2 lg:order-none">
            <SafeToSpendCard forecast={forecast} />
          </div>
          <div className="order-3 lg:order-none">
            <StateCard forecast={forecast} onWhy={() => setWhyOpen(true)} />
          </div>
          <div className="order-4 lg:order-none">
            <HelpCard />
          </div>
          <div className="order-6 lg:order-none">
            <NextMoneyCard forecast={forecast} />
          </div>
          <div className="order-7 lg:order-none">
            <RecentActivity transactions={record.transactions} />
          </div>
        </div>
      </div>

      <WhyDrawer forecast={forecast} open={whyOpen} onClose={() => setWhyOpen(false)} />
    </>
  );
}
