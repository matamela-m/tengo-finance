import { useTranslation } from 'react-i18next';
import type { CoverState } from '../engine/types';
import { Icon, type IconName } from './Icon';

export const STATE_ICON: Record<CoverState, IconName> = { enough: 'checkCircle', tight: 'alert', short: 'shortCircle' };

const STYLES: Record<CoverState, string> = {
  enough: 'bg-enough-soft text-enough',
  tight: 'bg-tight-soft text-tight',
  short: 'bg-short-soft text-short',
};

/** Colour, word and icon together, so colour is never the only signal. */
export function StateChip({ state, size = 'md', className = '' }: { state: CoverState; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const { t } = useTranslation();
  const sizing =
    size === 'lg' ? 'min-h-[40px] px-4 text-base gap-2' : size === 'sm' ? 'min-h-[26px] px-2.5 text-xs gap-1' : 'min-h-[32px] px-3 text-sm gap-1.5';
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full font-semibold ${STYLES[state]} ${sizing} ${className}`}>
      <Icon name={STATE_ICON[state]} size={size === 'lg' ? 20 : size === 'sm' ? 14 : 16} strokeWidth={2.2} />
      {t(`state.${state}`)}
    </span>
  );
}
