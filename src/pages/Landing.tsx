import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CoverBars } from '../components/CoverBars';
import { DemoChip } from '../components/DemoChip';
import { DateHero } from '../components/forecast/DateHero';
import { Icon, type IconName } from '../components/Icon';
import { StateChip } from '../components/StateChip';
import { Brand } from '../components/Brand';
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
      <path d={band} fill="var(--color-band)" />
      <line x1="0" x2={W} y1={y(0)} y2={y(0)} stroke="var(--color-short)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
      <path d={line} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
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
      <div className="absolute -inset-2 rounded-[40px] bg-gradient-to-br sm:-inset-6 sm:rounded-[44px] from-accent/30 via-accent/10 to-transparent blur-2xl" aria-hidden />
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
          <div className="rounded-2xl bg-accent-soft p-4">
            <p className="text-xs font-semibold text-muted">{t('sts.title')}</p>
            <p className="num mt-1 font-heading text-3xl font-extrabold text-ink">{formatZAR(f.safeToSpendToday)}</p>
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
  return (
    <div className="min-h-dvh overflow-x-hidden">
      <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
        <Brand size={26} />
        <Link to="/start" className="btn-secondary min-h-[44px] px-4 text-sm">
          {t('landing.cta')}
        </Link>
      </header>

      <main id="main">
        <section className="mx-auto grid w-full max-w-[1440px] items-center gap-12 px-5 pb-16 pt-6 sm:px-8 md:pt-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16 lg:px-12 lg:pb-24 lg:pt-16">
          <div className="animate-rise">
            <p className="eyebrow">{t('landing.eyebrow')}</p>
            <h1 className="mt-4 font-heading text-[38px] font-extrabold leading-[1.02] sm:text-[54px] xl:text-[68px]">{t('landing.headline')}</h1>
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
            <h2 id="how-title" className="font-heading text-[28px] font-extrabold sm:text-[34px]">
              {t('landing.howTitle')}
            </h2>
            <ol className="mt-10 grid gap-5 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.key} className="card flex flex-col gap-4 p-6 sm:p-7">
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-ink">
                      <Icon name={s.icon} size={22} />
                    </span>
                    <span aria-hidden className="num font-heading text-3xl font-extrabold text-muted">0{i + 1}</span>
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
          <Brand variant="mark" size={28} decorative />
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
