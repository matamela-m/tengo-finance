import { useTranslation } from 'react-i18next';
import type { CoverState } from '../engine/types';
import { Icon, type IconName } from './Icon';

export const STATE_ICON: Record<CoverState, IconName> = { enough: 'checkCircle', tight: 'alert', short: 'shortCircle' };

const STYLES: Record<CoverState, string> = {
  enough: 'bg-enough-soft text-enough border-enough/25',
  tight: 'bg-tight-soft text-tight border-tight/25',
  short: 'bg-short-soft text-short border-short/25',
};

/** Colour, word and icon together, so colour is never the only signal. */
export function StateChip({ state, size = 'md', className = '' }: { state: CoverState; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const { t } = useTranslation();
  const sizing = size === 'lg' ? 'min-h-[36px] px-3.5 text-[15px] gap-1.5' : size === 'sm' ? 'min-h-[24px] px-2 text-xs gap-1' : 'min-h-[30px] px-3 text-sm gap-1.5';
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border font-semibold ${STYLES[state]} ${sizing} ${className}`}>
      <Icon name={STATE_ICON[state]} size={size === 'lg' ? 17 : size === 'sm' ? 13 : 15} strokeWidth={2.2} />
      {t(`state.${state}`)}
    </span>
  );
}

const TEXT: Record<CoverState, string> = { enough: 'text-enough', tight: 'text-tight', short: 'text-short' };

/** Quiet inline state: icon and word in the state colour, no pill. For secondary mentions. */
export function StateText({ state, className = '' }: { state: CoverState; className?: string }) {
  const { t } = useTranslation();
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${TEXT[state]} ${className}`}>
      <Icon name={STATE_ICON[state]} size={15} strokeWidth={2.2} />
      {t(`state.${state}`)}
    </span>
  );
}
