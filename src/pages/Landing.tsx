import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Brand } from '../components/Brand';
import { CoverBars } from '../components/CoverBars';
import { DemoChip } from '../components/DemoChip';
import { DateHero } from '../components/forecast/DateHero';
import { RangeBand } from '../components/forecast/RangeBand';
import { Icon, type IconName } from '../components/Icon';
import { Reveal } from '../components/Reveal';
import { StateChip } from '../components/StateChip';
import { ThemeToggle } from '../components/ThemeToggle';
import { Badge, IconTile, SectionLabel } from '../components/ui';
import { seedRecord } from '../data/localRepository';
import { localToday } from '../engine/dates';
import { forecast as runForecast } from '../engine/forecast';
import type { Forecast } from '../engine/types';
import { LANGUAGES } from '../i18n/languages';
import { formatZAR } from '../lib/format';
import { useDates } from '../lib/useLang';
import { usePageTitle } from '../lib/usePageTitle';

function MiniChart({ forecast }: { forecast: Forecast }) {
  const pts = forecast.timeline;
  const W = 600;
  const H = 120;
  const hi = Math.max(...pts.map((p) => p.optimistic));
  const lo = Math.min(0, ...pts.map((p) => p.pessimistic));
  const x = (i: number) => (i / (pts.length - 1)) * W;
  const y = (v: number) => 6 + (1 - (v - lo) / (hi - lo || 1)) * (H - 12);
  const line = (k: 'optimistic' | 'central' | 'pessimistic') => pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join(' ');
  const band = `${line('optimistic')} ${[...pts].reverse().map((p, i) => `L${x(pts.length - 1 - i).toFixed(1)},${y(p.pessimistic).toFixed(1)}`).join(' ')} Z`;
  const area = `${line('central')} L${W},${H} L0,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-[96px] w-full sm:h-[120px]">
      <defs>
        <linearGradient id="landing-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={band} fill="var(--color-band)" />
      <path d={area} fill="url(#landing-area)" />
      <line x1="0" x2={W} y1={y(0)} y2={y(0)} stroke="var(--color-short)" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" opacity="0.7" />
      <path d={line('central')} fill="none" stroke="var(--color-accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** A framed, non-interactive render of the real Home pieces with Thabo's seeded data. */
function ProductPreview() {
  const { t } = useTranslation();
  const d = useDates();
  const f = useMemo(() => {
    const today = localToday();
    const r = seedRecord('thabo', today);
    return runForecast({ transactions: r.transactions, balance: r.balance, today });
  }, []);
  const summary = t('landing.previewCaption', {
    date: d.weekdayLong(f.headlineDate),
    state: t(`state.${f.state}`),
    amount: formatZAR(f.safeToSpendToday),
  });
  return (
    <figure className="relative">
      {/* Glow stays inside the frame's own box so it can never widen the page. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-[8%] -top-6 bottom-6 rounded-[40px] bg-[radial-gradient(ellipse_at_center,rgb(var(--accent)/0.35),transparent_70%)] blur-2xl" />
      <div aria-hidden className="relative overflow-hidden rounded-3xl border border-line bg-surface">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-surface-3" />
          <span className="h-2.5 w-2.5 rounded-full bg-surface-3" />
          <span className="h-2.5 w-2.5 rounded-full bg-surface-3" />
          <span className="ml-3 text-xs text-subtle">{t('landing.previewWho')}</span>
        </div>
        <div className="grid gap-4 p-5 sm:p-7 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <DateHero forecast={f} as="p" size="md" />
            <div className="mt-3 flex items-center gap-3">
              <StateChip state={f.state} />
              <CoverBars state={f.state} size={64} />
            </div>
            <div className="mt-5 border-t border-line pt-4">
              <RangeBand forecast={f} />
            </div>
          </div>
          <div className="grid min-w-0 grid-cols-2 content-start gap-3 md:grid-cols-1">
            <div className="rounded-2xl border border-line bg-surface-2 p-4">
              <p className="num font-heading text-[30px] font-bold leading-none tracking-[-0.03em]">{formatZAR(f.safeToSpendToday)}</p>
              <p className="mt-2 text-xs text-muted">{t('sts.title')}</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface-2 p-4">
              <p className="num font-heading text-[22px] font-bold leading-none tracking-[-0.02em]">{f.nextMoney ? d.dayShort(f.nextMoney.typical) : '-'}</p>
              <p className="mt-2 text-xs text-muted">{t('next.title')}</p>
            </div>
          </div>
          <div className="min-w-0 rounded-2xl border border-line bg-surface-2 px-3 pt-3 md:col-span-2">
            <MiniChart forecast={f} />
          </div>
        </div>
      </div>
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  );
}

const FEATURES: { key: string; icon: IconName }[] = [
  { key: 'date', icon: 'calendar' },
  { key: 'range', icon: 'sliders' },
  { key: 'private', icon: 'lock' },
];

const STEPS: { key: string; icon: IconName }[] = [
  { key: 'history', icon: 'upload' },
  { key: 'last', icon: 'calendar' },
  { key: 'plan', icon: 'plan' },
];

const FOOTER = [
  { group: 'product', links: [['features', '#features'], ['how', '#how'], ['explore', '/start']] },
  { group: 'privacy', links: [['privacyCentre', '/start'], ['fictional', '#privacy']] },
  { group: 'about', links: [['name', '/start'], ['hackathon', '#features']] },
] as const;

export default function Landing() {
  const { t } = useTranslation();
  usePageTitle(t('landing.title'));

  const stats = [
    { value: '90', label: t('landing.stats.history') },
    { value: '3', label: t('landing.stats.states') },
    { value: String(LANGUAGES.length), label: t('landing.stats.languages') },
    { value: '0', label: t('landing.stats.logins') },
  ];

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/75 backdrop-blur-xl">
        <nav aria-label={t('landing.navLabel')} className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-8">
          <Link to="/" className="rounded-md" aria-label={`Tengo, ${t('landing.home')}`}>
            <Brand size={22} />
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {(['features', 'how', 'privacy'] as const).map((k) => (
              <a key={k} href={`#${k}`} className="inline-flex min-h-[44px] items-center rounded-full px-3 text-sm text-muted transition-colors hover:text-ink">
                {t(`landing.nav.${k}`)}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="hidden sm:block" />
            <Link to="/start" className="btn-primary px-4 text-sm">
              {t('landing.cta')}
            </Link>
          </div>
        </nav>
      </header>

      <main id="main">
        <section className="relative mx-auto w-full max-w-[1280px] px-5 pb-16 pt-14 sm:px-8 md:pt-20 lg:pb-24">
          <div className="mx-auto max-w-4xl text-center">
            <Badge dot tone="accent">
              {t('landing.badge')}
            </Badge>
            <h1 className="mt-6 font-heading text-display text-ink">
              {t('landing.headlineLead')} <span className="text-muted sm:block">{t('landing.headlineDim')}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted sm:text-xl">{t('landing.pitch')}</p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/start" className="btn-primary min-h-[48px] w-full px-6 text-base sm:w-auto">
                {t('landing.cta')}
                <Icon name="arrowRight" size={18} />
              </Link>
              <a href="#how" className="btn-secondary min-h-[48px] w-full px-6 text-base sm:w-auto">
                {t('landing.ctaSecondary')}
              </a>
            </div>
            <p className="mt-4 text-sm text-subtle">{t('landing.ctaNote')}</p>
          </div>
          <Reveal className="mx-auto mt-14 max-w-5xl md:mt-20" delay={80}>
            <ProductPreview />
          </Reveal>
        </section>

        <section id="features" aria-labelledby="features-title" className="mx-auto w-full max-w-[1280px] scroll-mt-20 px-5 py-16 sm:px-8 lg:py-24">
          <Reveal>
            <SectionLabel as="p">{t('landing.nav.features')}</SectionLabel>
            <h2 id="features-title" className="mt-3 max-w-2xl font-heading text-h1 text-ink">
              {t('landing.featuresTitle')}
            </h2>
          </Reveal>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <li key={f.key}>
                <Reveal delay={i * 60} className="h-full">
                  <div className="card-interactive h-full p-6">
                    <IconTile name={f.icon} tone="accent" />
                    <h3 className="mt-5 font-heading text-h3 text-ink">{t(`landing.features.${f.key}.title`)}</h3>
                    <p className="mt-2 text-[15px] text-muted">{t(`landing.features.${f.key}.body`)}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
          <Reveal>
            <ul className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {stats.map((s) => (
                <li key={s.label} className="card p-6">
                  <p className="num font-heading text-[44px] font-bold leading-none tracking-[-0.03em] text-ink sm:text-[52px]">{s.value}</p>
                  <p className="mt-3 text-sm text-muted">{s.label}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        <section id="how" aria-labelledby="how-title" className="scroll-mt-16 border-y border-line bg-surface/50">
          <div className="mx-auto w-full max-w-[1280px] px-5 py-16 sm:px-8 lg:py-24">
            <Reveal>
              <SectionLabel as="p">{t('landing.nav.how')}</SectionLabel>
              <h2 id="how-title" className="mt-3 font-heading text-h1 text-ink">
                {t('landing.howTitle')}
              </h2>
            </Reveal>
            <ol className="mt-10 grid gap-4 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.key}>
                  <Reveal delay={i * 60} className="h-full">
                    <div className="card h-full p-6">
                      <div className="flex items-center justify-between">
                        <IconTile name={s.icon} />
                        <span aria-hidden className="num font-heading text-sm font-semibold text-subtle">
                          0{i + 1}
                        </span>
                      </div>
                      <h3 className="mt-5 font-heading text-h3 text-ink">{t(`landing.steps.${s.key}.title`)}</h3>
                      <p className="mt-2 text-[15px] text-muted">{t(`landing.steps.${s.key}.body`)}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="privacy" aria-labelledby="privacy-title" className="mx-auto w-full max-w-[1280px] scroll-mt-20 px-5 py-16 sm:px-8 lg:py-24">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-line bg-surface px-6 py-14 text-center sm:px-12">
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(var(--accent)/0.18),transparent_60%)]" />
              <div className="relative">
                <h2 id="privacy-title" className="mx-auto max-w-2xl font-heading text-h1 text-ink">
                  {t('landing.closingTitle')}
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-muted">{t('landing.closingBody')}</p>
                <Link to="/start" className="btn-primary mt-8 min-h-[48px] px-6 text-base">
                  {t('landing.cta')}
                  <Icon name="arrowRight" size={18} />
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Brand size={22} />
            <p className="mt-3 max-w-xs text-sm text-muted">{t('landing.tagline')}</p>
            <DemoChip className="mt-5" />
            <ThemeToggle className="mt-5" />
          </div>
          {FOOTER.map(({ group, links }) => (
            <nav key={group} aria-label={t(`landing.footer.${group}`)}>
              <p className="eyebrow">{t(`landing.footer.${group}`)}</p>
              <ul className="mt-3">
                {links.map(([key, href]) => (
                  <li key={key}>
                    {href.startsWith('/') ? (
                      <Link to={href} className="inline-flex min-h-[44px] items-center text-sm text-muted transition-colors hover:text-ink">
                        {t(`landing.footer.links.${key}`)}
                      </Link>
                    ) : (
                      <a href={href} className="inline-flex min-h-[44px] items-center text-sm text-muted transition-colors hover:text-ink">
                        {t(`landing.footer.links.${key}`)}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="border-t border-line">
          <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-2 px-5 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p className="flex items-center gap-2">
              <span aria-hidden className="h-2 w-2 rounded-full bg-enough" />
              {t('landing.status')}
            </p>
            <p>{t('landing.fictional')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
