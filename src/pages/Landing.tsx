import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Brand } from '../components/Brand';
import { DemoChip } from '../components/DemoChip';
import { Icon, type IconName } from '../components/Icon';
import { Reveal } from '../components/Reveal';
import { ThemeButton } from '../components/ThemeToggle';
import { Badge, IconTile, SectionLabel } from '../components/ui';
import { FLAGS } from '../lib/flags';
import { LANGUAGES } from '../i18n/languages';
import { usePageTitle } from '../lib/usePageTitle';
import { useCountUp } from '../lib/useCountUp';
import shot800 from '../assets/landing/home-lerato-800.webp';
import shot1280 from '../assets/landing/home-lerato-1280.webp';
import shot1920 from '../assets/landing/home-lerato-1920.webp';

/** The product shot under the hero: the founder's image of Home with Lerato's fictional data. */
function ProductShot() {
  const { t } = useTranslation();
  return (
    <figure className="relative">
      {/* Glow stays inside the frame's own box so it can never widen the page. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-[8%] -top-6 bottom-6 rounded-[40px] bg-[radial-gradient(ellipse_at_center,rgb(var(--accent)/0.35),transparent_70%)] blur-2xl" />
      <img
        src={shot1280}
        srcSet={`${shot800} 800w, ${shot1280} 1280w, ${shot1920} 1920w`}
        sizes="(min-width: 1280px) 1216px, calc(100vw - 40px)"
        width={1920}
        height={1080}
        alt={t('landing.previewAlt')}
        decoding="async"
        fetchPriority="high"
        className="relative block h-auto w-full rounded-2xl border border-line shadow-lift sm:rounded-3xl"
      />
    </figure>
  );
}

/**
 * A stat that counts up once when it scrolls into view. The final number is read by screen readers from the
 * start, and it shows at once under reduced motion or when it is already on screen.
 */
function CountWhenSeen({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [target, setTarget] = useState(value);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    setTarget(0);
    const io = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setTarget(value);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [value]);
  const shown = useCountUp(target, 700);
  return (
    <span ref={ref}>
      <span aria-hidden>{shown}</span>
      <span className="sr-only">{value}</span>
    </span>
  );
}

const STEPS: { key: string; icon: IconName }[] = [
  { key: 'history', icon: 'upload' },
  { key: 'last', icon: 'calendar' },
  { key: 'plan', icon: 'plan' },
];

const FOOTER = [
  { group: 'product', links: [['how', '#how'], ['explore', '/start']] },
  { group: 'privacy', links: [['privacyCentre', '/start'], ['fictional', '#privacy'], ['safety', '/safety']] },
  { group: 'about', links: FLAGS.nameStory ? [['name', '/app/me'], ['hackathon', '#how']] : [['hackathon', '#how']] },
] as const;

export default function Landing() {
  const { t } = useTranslation();
  usePageTitle(t('landing.title'));

  const stats = [
    { value: '90', label: t('landing.stats.history') },
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
            {(['how', 'faq', 'privacy'] as const).map((k) => (
              <a key={k} href={`#${k}`} className="inline-flex min-h-[44px] items-center rounded-full px-3 text-sm text-muted transition-colors hover:text-ink">
                {t(`landing.nav.${k}`)}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <ThemeButton />
            <Link to="/start" className="btn-primary px-4 text-sm">
              {t('landing.cta')}
            </Link>
          </div>
        </nav>
      </header>

      <main id="main">
        <section className="relative mx-auto w-full max-w-[1280px] px-5 pb-16 pt-14 sm:px-8 md:pt-20 lg:pb-24">
          {/* Soft glow behind the hero, CSS only and clipped to its own box so the page never widens. Text over it
              keeps its contrast (checked in scripts/contrast-check.mjs). */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] overflow-hidden">
            <div className="absolute left-1/2 top-[-160px] h-[520px] w-[min(1100px,140%)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(var(--accent)/0.12),transparent)]" />
          </div>
          <div className="mx-auto max-w-4xl text-center">
            <Badge dot tone="accent">
              {t('landing.badge')}
            </Badge>
            {/* The one text effect on the page: each half fades up once on load. Off under reduced motion. */}
            <h1 className="mt-6 font-heading text-display text-ink">
              <span className="hero-line inline-block">{t('landing.headlineLead')}</span> <span className="hero-line hero-line-2 inline-block text-muted sm:block">{t('landing.headlineDim')}</span>
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
          <Reveal className="mx-auto mt-14 max-w-[1216px] md:mt-20 md:[perspective:2200px]" delay={80}>
            <div className="origin-top transition-transform duration-700 ease-out md:[transform:rotateX(8deg)] md:hover:[transform:none]">
              <ProductShot />
            </div>
          </Reveal>
        </section>

        <section id="how" aria-labelledby="how-title" className="scroll-mt-16 border-y border-line">
          <div className="mx-auto w-full max-w-[1280px] px-5 py-16 sm:px-8 lg:py-24">
            <Reveal>
              <SectionLabel as="p">{t('landing.nav.how')}</SectionLabel>
              <h2 id="how-title" className="mt-3 font-heading text-h1 text-ink">
                {t('landing.howTitle')}
              </h2>
            </Reveal>
            <ol className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
              {STEPS.map((s, i) => (
                <li key={s.key}>
                  <Reveal delay={i * 60} className="h-full">
                    <div className="card h-full p-6">
                      <div className="flex items-center justify-between">
                        <IconTile name={s.icon} tone="accent" />
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
            <Reveal>
              {/* Three stats on the same three columns as the step cards above. */}
              <ul className="mt-4 divide-y divide-line rounded-2xl border border-line md:mt-5 md:grid md:grid-cols-3 md:gap-5 md:divide-y-0 md:rounded-none md:border-0">
                {stats.map((st) => (
                  <li key={st.label} className="px-6 py-5 md:rounded-2xl md:border md:border-line">
                    <p className="num font-heading text-[40px] font-bold leading-none tracking-[-0.03em] text-ink">
                      <CountWhenSeen value={Number(st.value)} />
                    </p>
                    <p className="mt-2 text-sm text-muted">{st.label}</p>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        <section id="faq" aria-labelledby="faq-title" className="mx-auto w-full max-w-[1280px] scroll-mt-16 px-5 pt-16 sm:px-8 lg:pt-24">
          <Reveal>
            <SectionLabel as="p">{t('landing.faq.label')}</SectionLabel>
            <h2 id="faq-title" className="mt-3 font-heading text-h1 text-ink">
              {t('landing.faq.title')}
            </h2>
          </Reveal>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {(['bank', 'data', 'cost', 'wrong'] as const).map((k) => (
              <details key={k} className="faq group">
                <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-4 font-heading text-[17px] font-semibold text-ink">
                  {t(`landing.faq.${k}.q`)}
                  <Icon name="plus" size={18} className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-45" />
                </summary>
                <p className="max-w-3xl pb-5 text-[15px] text-muted">{t(`landing.faq.${k}.a`)}</p>
              </details>
            ))}
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
