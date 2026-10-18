import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

/** Tiny uppercase card header. Optional corner brackets are decorative only. */
export function SectionLabel({ children, id, as: Tag = 'h2', className = '' }: { children: ReactNode; id?: string; as?: 'h2' | 'h3' | 'p'; className?: string }) {
  return (
    <Tag id={id} className={`eyebrow ${className}`}>
      {children}
    </Tag>
  );
}

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Adds faint corner brackets, for data cards only. */
  brackets?: boolean;
  as?: 'section' | 'div' | 'article';
  labelledBy?: string;
  label?: string;
}

export function Card({ children, className = '', brackets, as: Tag = 'section', labelledBy, label }: CardProps) {
  return (
    <Tag className={`card relative ${className}`} aria-labelledby={labelledBy} aria-label={label}>
      {brackets && (
        <span aria-hidden className="pointer-events-none absolute inset-2.5">
          <span className="absolute left-0 top-0 h-2.5 w-2.5 rounded-tl-[3px] border-l border-t border-line-strong" />
          <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-tr-[3px] border-r border-t border-line-strong" />
          <span className="absolute bottom-0 left-0 h-2.5 w-2.5 rounded-bl-[3px] border-b border-l border-line-strong" />
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-br-[3px] border-b border-r border-line-strong" />
        </span>
      )}
      {children}
    </Tag>
  );
}

/** 36px rounded square with a hairline border, holding one icon. */
export function IconTile({ name, tone = 'neutral', size = 36 }: { name: IconName; tone?: 'neutral' | 'accent' | 'enough' | 'tight' | 'short'; size?: number }) {
  const tones = {
    neutral: 'border-line bg-surface-2 text-ink',
    accent: 'border-accent/25 bg-accent-soft text-accent',
    enough: 'border-enough/25 bg-enough-soft text-enough',
    tight: 'border-tight/25 bg-tight-soft text-tight',
    short: 'border-short/25 bg-short-soft text-short',
  }[tone];
  return (
    <span aria-hidden className={`inline-flex shrink-0 items-center justify-center rounded-[10px] border ${tones}`} style={{ width: size, height: size }}>
      <Icon name={name} size={Math.round(size * 0.5)} />
    </span>
  );
}

/** Small pill with an optional status dot. */
export function Badge({ children, dot, tone = 'neutral', className = '' }: { children: ReactNode; dot?: boolean; tone?: 'neutral' | 'accent' | 'enough' | 'tight' | 'short'; className?: string }) {
  const dotTone = { neutral: 'bg-subtle', accent: 'bg-accent', enough: 'bg-enough', tight: 'bg-tight', short: 'bg-short' }[tone];
  return (
    <span className={`inline-flex min-h-[26px] items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-surface px-2.5 text-xs font-medium text-muted ${className}`}>
      {dot && <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${dotTone}`} />}
      {children}
    </span>
  );
}

interface StatTileProps {
  label: string;
  value: ReactNode;
  /** Small line under the label, such as a delta or a date. */
  hint?: ReactNode;
  icon?: IconName;
  className?: string;
  size?: 'md' | 'lg';
}

/** Large number with a small label under it. Tabular numerals. */
export function StatTile({ label, value, hint, icon, className = '', size = 'md' }: StatTileProps) {
  return (
    <div className={`card relative flex flex-col p-5 ${className}`}>
      {icon && (
        <span className="mb-4">
          <IconTile name={icon} />
        </span>
      )}
      <p className={`num font-heading font-bold leading-none tracking-[-0.03em] text-ink ${size === 'lg' ? 'text-[44px] sm:text-[52px]' : 'text-[30px]'}`}>{value}</p>
      <p className="mt-2 text-sm text-muted">{label}</p>
      {hint && <p className="num mt-1 text-xs text-subtle">{hint}</p>}
    </div>
  );
}
