import { useTranslation } from 'react-i18next';
import { useSession, type ThemePref } from '../store/session';
import { Icon, type IconName } from './Icon';
import { Segmented } from './Segmented';

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
