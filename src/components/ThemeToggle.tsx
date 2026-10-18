import { useTranslation } from 'react-i18next';
import { useSession, type ThemePref } from '../store/session';
import { Icon, type IconName } from './Icon';
import { Segmented } from './Segmented';
import { useAnnounce } from './A11y';

const OPTIONS: { value: ThemePref; icon: IconName }[] = [
  { value: 'light', icon: 'sun' },
  { value: 'dark', icon: 'moon' },
  { value: 'system', icon: 'monitor' },
];

/** Light, Dark or System. Compact shows icons only, with the words still read out. */
export function ThemeToggle({ compact = true, className = '' }: { compact?: boolean; className?: string }) {
  const { t } = useTranslation();
  const theme = useSession((s) => s.theme);
  const setTheme = useSession((s) => s.setTheme);
  return (
    <Segmented
      className={className}
      label={t('me.theme')}
      value={theme}
      onChange={setTheme}
      size={compact ? 'sm' : 'md'}
      options={OPTIONS.map((o) => ({
        value: o.value,
        label: (
          <>
            <Icon name={o.icon} size={16} />
            <span className={compact ? 'sr-only' : ''}>{t(`me.themes.${o.value}`)}</span>
          </>
        ),
      }))}
    />
  );
}

const ORDER: ThemePref[] = ['dark', 'light', 'system'];

/** One icon button that cycles Dark, Light and System. Its name says the current theme. */
export function ThemeButton({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  const announce = useAnnounce();
  const theme = useSession((s) => s.theme);
  const setTheme = useSession((s) => s.setTheme);
  const icon = OPTIONS.find((o) => o.value === theme)?.icon ?? 'moon';
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]!;
  return (
    <button
      type="button"
      onClick={() => {
        setTheme(next);
        announce(t('palette.themeSet', { name: t(`me.themes.${next}`) }), { toast: false });
      }}
      aria-label={t('theme.button', { current: t(`me.themes.${theme}`), next: t(`me.themes.${next}`) })}
      title={t('theme.button', { current: t(`me.themes.${theme}`), next: t(`me.themes.${next}`) })}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl text-subtle transition-colors hover:bg-surface-2 hover:text-ink ${className}`}
    >
      <Icon name={icon} size={18} />
    </button>
  );
}
