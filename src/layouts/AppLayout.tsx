import { useEffect, useRef, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../components/Avatar';
import { Brand } from '../components/Brand';
import { ModeChip } from '../components/DemoChip';
import { Icon } from '../components/Icon';
import { ThemeButton } from '../components/ThemeToggle';
import { usePersona } from '../data/PersonaProvider';
import { useSession } from '../store/session';
import { StorageBanner } from '../components/StorageBanner';
import { SafetyControls } from '../components/SafetyControls';
import { useMasked } from '../components/Preferences';
import { NAV, type NavItem } from './nav';
import { prefetchAppPages } from '../lib/prefetch';

function SideLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const { t } = useTranslation();
  const label = t(`nav.${item.key}`);
  return (
    <NavLink
      to={item.to}
      end={item.end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `group flex min-h-[44px] items-center gap-3 rounded-lg px-2.5 text-[15px] transition-colors duration-150 ${
          isActive ? 'bg-accent-soft font-medium text-ink' : 'text-muted hover:bg-surface-2 hover:text-ink'
        } ${collapsed ? 'justify-center' : ''}`
      }
    >
      {({ isActive }) => (
        <>
          <Icon name={item.icon} size={18} className={`shrink-0 ${isActive ? 'text-ink' : 'text-subtle group-hover:text-ink'}`} />
          <span className={collapsed ? 'sr-only' : 'truncate'}>{label}</span>
        </>
      )}
    </NavLink>
  );
}

function PersonaRow({ collapsed }: { collapsed: boolean }) {
  const { t } = useTranslation();
  const { profile } = usePersona();
  if (!profile) return null;
  return (
    <Link
      to="/start"
      title={collapsed ? t('me.switchPersona') : undefined}
      className={`flex min-h-[48px] items-center gap-2.5 rounded-xl border border-line px-2 py-1.5 transition-colors hover:border-line-strong hover:bg-surface-2 ${collapsed ? 'justify-center' : ''}`}
    >
      <Avatar persona={profile} size={30} />
      <span className={collapsed ? 'sr-only' : 'min-w-0 flex-1'}>
        <span className="block truncate text-sm font-semibold text-ink">{profile.name}</span>
        <span className="block truncate text-xs text-subtle">{t('me.switchPersona')}</span>
      </span>
      {!collapsed && <Icon name="switch" size={15} className="shrink-0 text-subtle" />}
    </Link>
  );
}

export function AppLayout({ children }: { children?: ReactNode }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  // The page the app opened on appears at once; later pages fade in.
  const firstPath = useRef(pathname);
  useEffect(prefetchAppPages, []);
  const collapsed = useSession((s) => s.sidebarCollapsed);
  const setCollapsed = useSession((s) => s.setSidebarCollapsed);
  const main = NAV.filter((n) => !n.secondary);
  const masked = useMasked();
  const secondary = NAV.filter((n) => n.secondary);

  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop sidebar */}
      <aside
        className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-surface/60 px-3 py-4 backdrop-blur-xl transition-[width] duration-200 lg:flex ${
          collapsed ? 'w-[76px]' : 'w-[260px]'
        }`}
      >
        <div className={`flex items-center px-1.5 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <Link to="/app" className="inline-flex min-h-[44px] items-center rounded-md" aria-label={`Tengo, ${t('nav.home')}`}>
            {collapsed ? <Brand variant="mark" size={22} decorative /> : <Brand size={22} decorative />}
          </Link>
          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-subtle transition-colors hover:bg-surface-2 hover:text-ink"
              aria-label={t('nav.collapse')}
              aria-expanded
            >
              <Icon name="sidebar" size={18} />
            </button>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <PersonaRow collapsed={collapsed} />
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('tengo:palette'))}
            title={collapsed ? t('palette.open') : undefined}
            className={`flex min-h-[44px] items-center gap-2.5 rounded-xl px-2.5 text-sm text-subtle transition-colors hover:bg-surface-2 hover:text-ink ${collapsed ? 'justify-center' : ''}`}
          >
            <Icon name="search" size={16} />
            <span className={collapsed ? 'sr-only' : 'flex-1 text-left'}>{t('palette.open')}</span>
            {!collapsed && (
              <kbd aria-hidden className="rounded-md border border-line px-1.5 py-0.5 font-sans text-xs text-subtle">
                {t('palette.shortcut')}
              </kbd>
            )}
          </button>
        </div>
        <nav aria-label={t('nav.label')} className="mt-5 flex flex-1 flex-col">
          <ul className="flex flex-col gap-0.5">
            {main.map((item) => (
              <li key={item.to}>
                <SideLink item={item} collapsed={collapsed} />
              </li>
            ))}
          </ul>
          <ul className="mt-auto flex flex-col gap-0.5 border-t border-line pt-3">
            {secondary.map((item) => (
              <li key={item.to}>
                <SideLink item={item} collapsed={collapsed} />
              </li>
            ))}
          </ul>
        </nav>
        <div className={`mt-3 flex flex-col gap-3 border-t border-line pt-3 ${collapsed ? 'items-center' : ''}`}>
          {collapsed ? (
            <>
              <ThemeButton />
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-subtle transition-colors hover:bg-surface-2 hover:text-ink"
                aria-label={t('nav.expand')}
                aria-expanded={false}
              >
                <Icon name="sidebar" size={18} />
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <ModeChip />
              <ThemeButton />
            </div>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile and tablet top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-xl sm:px-6 lg:hidden">
          <Link to="/app" className="inline-flex min-h-[44px] items-center rounded-md" aria-label={`Tengo, ${t('nav.home')}`}>
            <Brand size={20} decorative />
          </Link>
          <div className="flex items-center gap-1">
            <ModeChip />
            <SafetyControls compact />
            <NavLink
              to="/app/privacy"
              className={({ isActive }) =>
                `inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-surface-2 ${isActive ? 'text-link' : 'text-muted'}`
              }
              aria-label={t('nav.privacy')}
            >
              <Icon name="shield" />
            </NavLink>
          </div>
        </header>

        {/* Desktop: the demo chip sits in the sidebar, so the page starts straight away. */}
        <main id="main" className="mx-auto w-full max-w-app flex-1 px-4 pb-28 pt-5 sm:px-6 md:px-8 lg:px-10 lg:pb-16 lg:pt-8">
          <div className="-mt-2 mb-3 hidden justify-end lg:flex">
            <SafetyControls />
          </div>
          <StorageBanner />
          {/* Re-rendered when discreet masking changes, so every amount follows it. */}
          <div key={masked ? 'masked' : 'shown'} className="contents">
            {/* Each page fades in as it opens (off under reduced motion). */}
            <div key={pathname} className={pathname === firstPath.current ? undefined : 'page-enter'}>
              {children ?? <Outlet />}
            </div>
          </div>
        </main>

        {/* Mobile and tablet bottom tab bar */}
        <nav aria-label={t('nav.label')} className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
          <ul className="mx-auto grid max-w-2xl grid-cols-5">
            {NAV.filter((n) => n.mobile).map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `relative flex min-h-[60px] flex-col items-center justify-center gap-1 px-1 text-[12px] font-medium transition-colors ${isActive ? 'text-ink' : 'text-subtle hover:text-ink'}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span aria-hidden className={`absolute top-0 h-0.5 w-8 rounded-full transition-colors ${isActive ? 'bg-accent' : 'bg-transparent'}`} />
                      <Icon name={item.icon} size={20} className={isActive ? 'text-link' : ''} />
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
