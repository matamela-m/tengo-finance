import { NavLink, Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DemoChip } from '../components/DemoChip';
import { Icon } from '../components/Icon';
import { TengoLogo } from '../components/TengoLogo';
import { useIsDark } from '../components/Preferences';
import { NAV } from './nav';
import type { ReactNode } from 'react';

export function AppLayout({ personaSlot, children }: { personaSlot?: ReactNode; children?: ReactNode }) {
  const { t } = useTranslation();
  const dark = useIsDark();
  const bg = dark ? 'dark' : 'light';

  return (
    <div className="min-h-dvh lg:flex">

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col border-r border-line bg-surface/70 px-5 py-6 backdrop-blur lg:flex">
        <Link to="/app" className="mb-8 inline-flex w-fit rounded-lg px-1" aria-label={t('nav.home')}>
          <TengoLogo variant="horizontal" background={bg} height={28} />
        </Link>
        <nav aria-label={t('nav.label')} className="flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex min-h-[44px] items-center gap-3 rounded-2xl px-3.5 text-[15px] font-medium transition-colors ${
                  isActive ? 'bg-brand text-on-brand shadow-card' : 'text-ink hover:bg-surface-2'
                }`
              }
            >
              <Icon name={item.icon} />
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto">{personaSlot}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile and tablet top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line/70 bg-bg/85 px-4 py-2.5 backdrop-blur-md sm:px-6 lg:hidden">
          <Link to="/app" className="rounded-lg" aria-label={t('nav.home')}>
            <TengoLogo variant="horizontal" background={bg} height={22} />
          </Link>
          <div className="flex items-center gap-1">
            <DemoChip />
            <NavLink
              to="/app/privacy"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-surface"
              aria-label={t('nav.privacy')}
            >
              <Icon name="shield" />
            </NavLink>
          </div>
        </header>

        {/* Desktop header */}
        <header className="hidden items-center justify-end gap-3 px-10 pt-6 lg:flex">
          <DemoChip />
        </header>

        <main id="main" className="mx-auto w-full max-w-app flex-1 px-4 pb-28 pt-5 sm:px-6 md:px-8 lg:px-10 lg:pb-16 lg:pt-4">
          {children ?? <Outlet />}
        </main>

        {/* Mobile and tablet bottom tab bar */}
        <nav
          aria-label={t('nav.label')}
          className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
        >
          <ul className="mx-auto grid max-w-2xl grid-cols-5">
            {NAV.filter((n) => n.mobile).map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex min-h-[60px] flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold ${
                      isActive ? 'text-brand-ink' : 'text-muted'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${isActive ? 'bg-mint/70 dark:bg-mint text-charcoal' : ''}`}>
                        <Icon name={item.icon} size={20} />
                      </span>
                      <span className="max-w-full truncate">{t(`nav.${item.key}`)}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
