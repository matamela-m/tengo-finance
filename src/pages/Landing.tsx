import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CoverBars } from '../components/CoverBars';
import { DemoChip } from '../components/DemoChip';
import { DateHero } from '../components/forecast/DateHero';
import { Icon, type IconName } from '../components/Icon';
import { useIsDark } from '../components/Preferences';
import { StateChip } from '../components/StateChip';
import { TengoLogo } from '../components/TengoLogo';
import { seedRecord } from '../data/localRepository';
import { localToday } from '../engine/dates';
import { forecast as runForecast } from '../engine/forecast';
import type { Forecast } from '../engine/types';
import { formatZAR } from '../lib/format';
import { useDates } from '../lib/useLang';
import { usePageTitle } from '../lib/usePageTitle';

function Sparkline({ forecast }: { forecast: Forecast }) {
  const pts = forecast.timeline;
  const W = 300;
  const H = 72;
  const hi = Math.max(...pts.map((p) => p.optimistic));
  const lo = Math.min(0, ...pts.map((p) => p.pessimistic));
  const x = (i: number) => (i / (pts.length - 1)) * W;
  const y = (v: number) => 4 + (1 - (v - lo) / (hi - lo || 1)) * (H - 8);
  const band =
    pts.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.optimistic)}`).join(' ') +
    ' ' +
    [...pts].reverse().map((p, i) => `L${x(pts.length - 1 - i)},${y(p.pessimistic)}`).join(' ') +
    ' Z';
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.central)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-[72px] w-full" aria-hidden>
      <path d={band} fill="#B6DFB2" opacity="0.55" />
      <line x1="0" x2={W} y1={y(0)} y2={y(0)} stroke="var(--c-short-text)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
      <path d={line} fill="none" stroke="var(--c-brand)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Preview() {
  const { t } = useTranslation();
  const d = useDates();
  const f = useMemo(() => {
    const today = localToday();
    const r = seedRecord('thabo', today);
    return runForecast({ transactions: r.transactions, balance: r.balance, today });
  }, []);
  return (
    <figure className="relative" aria-label={t('landing.previewLabel')}>
      <div className="absolute -inset-6 rounded-[44px] bg-gradient-to-br from-mint/70 via-sage/30 to-transparent blur-2xl" aria-hidden />
      <div className="relative rounded-[32px] border border-line bg-surface p-6 shadow-lift sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-muted">{t('landing.previewWho')}</p>
          <StateChip state={f.state} />
        </div>
        <div className="mt-5 flex items-end justify-between gap-4">
          <DateHero forecast={f} as="p" size="md" />
          <CoverBars state={f.state} size={40} />
        </div>
        <p className="num mt-3 text-sm text-muted">{t('band.between', { from: d.dayShort(f.band.from), to: d.dayShort(f.band.to) })}</p>
        <div className="mt-5 rounded-2xl bg-surface-2 px-3 pb-2 pt-3">
          <Sparkline forecast={f} />
          <div className="flex justify-between px-1 text-[11px] font-medium text-muted">
            <span>{t('common.today')}</span>
            <span className="num">{d.dayShort(f.timeline[f.timeline.length - 1]!.date)}</span>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-mint/50 p-4 dark:bg-mint">
            <p className="text-xs font-semibold text-charcoal/80">{t('sts.title')}</p>
            <p className="num mt-1 font-display text-3xl font-extrabold text-charcoal">{formatZAR(f.safeToSpendToday)}</p>
          </div>
          <div className="rounded-2xl bg-surface-2 p-4">
            <p className="text-xs font-semibold text-muted">{t('next.title')}</p>
            <p className="num mt-1 text-lg font-bold">{f.nextMoney ? d.dayShort(f.nextMoney.typical) : '-'}</p>
          </div>
        </div>
      </div>
      <figcaption className="sr-only">{t('landing.previewCaption')}</figcaption>
    </figure>
  );
}

const STEPS: { key: string; icon: IconName }[] = [
  { key: 'history', icon: 'upload' },
  { key: 'last', icon: 'calendar' },
  { key: 'plan', icon: 'plan' },
];

export default function Landing() {
  const { t } = useTranslation();
  usePageTitle(t('landing.title'));
  const bg = useIsDark() ? 'dark' : 'light';
  return (
    <div className="min-h-dvh overflow-x-hidden">
      <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
        <TengoLogo variant="horizontal" background={bg} height={28} />
        <Link to="/start" className="btn-secondary min-h-[44px] px-4 text-sm">
          {t('landing.cta')}
        </Link>
      </header>

      <main id="main">
        <section className="mx-auto grid w-full max-w-[1440px] items-center gap-12 px-5 pb-16 pt-6 sm:px-8 md:pt-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16 lg:px-12 lg:pb-24 lg:pt-16">
          <div className="animate-rise">
            <p className="eyebrow">{t('landing.eyebrow')}</p>
            <h1 className="mt-4 font-display text-[44px] font-extrabold leading-[0.98] tracking-tight sm:text-[64px] xl:text-[88px]">{t('landing.headline')}</h1>
            <p className="mt-6 max-w-xl text-lg text-muted sm:text-xl">{t('landing.pitch')}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/start" className="btn-primary min-h-[52px] px-7 text-base">
                {t('landing.cta')}
                <Icon name="arrowRight" size={18} />
              </Link>
              <p className="text-sm text-muted">{t('landing.ctaNote')}</p>
            </div>
          </div>
          <div className="mx-auto w-full max-w-[520px] lg:max-w-none">
            <Preview />
          </div>
        </section>

        <section className="border-y border-line bg-surface/60" aria-labelledby="how-title">
          <div className="mx-auto w-full max-w-[1440px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
            <h2 id="how-title" className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              {t('landing.howTitle')}
            </h2>
            <ol className="mt-10 grid gap-5 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.key} className="card flex flex-col gap-4 p-6 sm:p-7">
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint/60 dark:bg-mint text-charcoal">
                      <Icon name={s.icon} size={22} />
                    </span>
                    <span className="num font-display text-3xl font-extrabold text-line">0{i + 1}</span>
                  </div>
                  <h3 className="text-xl font-semibold">{t(`landing.steps.${s.key}.title`)}</h3>
                  <p className="text-[15px] text-muted">{t(`landing.steps.${s.key}.body`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
        <div className="flex items-center gap-4">
          <TengoLogo variant="mark" background={bg} height={28} decorative />
          <p className="text-sm text-muted">{t('landing.tagline')}</p>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <DemoChip className="w-fit" />
          <p className="text-sm text-muted">{t('landing.fictional')}</p>
        </div>
      </footer>
    </div>
  );
}
