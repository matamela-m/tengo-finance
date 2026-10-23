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
    accent: 'border-accent/25 bg-accent-soft text-ink',
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

type StatTone = 'enough' | 'tight' | 'short';
const STAT_TINT: Record<StatTone, string> = { enough: 'bg-enough-soft', tight: 'bg-tight-soft', short: 'bg-short-soft' };
const STAT_SIZE = {
  // The hero figure of a card, such as the daily budget.
  lg: 'mt-2 text-[40px] font-bold leading-none tracking-[-0.035em]',
  // A figure that is words rather than a number, such as "Not advised".
  words: 'mt-2 text-[30px] font-bold leading-[1.05] tracking-[-0.03em]',
  // A quiet figure beside others, such as next money or confidence.
  md: 'mt-1.5 text-[19px] font-semibold tracking-[-0.01em]',
};

interface StatProps {
  label: ReactNode;
  value: ReactNode;
  /** Small lines under the figure, such as a range, a source or a date. */
  hint?: ReactNode;
  /** A change against something, always in words: never shown by colour alone. */
  delta?: { text: ReactNode; direction: 'up' | 'down' | 'flat' };
  /** A soft state tint behind the stat. The state word must still appear elsewhere. */
  tone?: StatTone;
  size?: keyof typeof STAT_SIZE;
  /** Render as a dt and dd pair, for use inside a dl. */
  inList?: boolean;
  /** Use a heading for the label, for a stat that heads its card. */
  labelAs?: 'h2' | 'h3';
  labelId?: string;
  className?: string;
}

/**
 * One figure with its label: tabular numerals, the label above in the eyebrow style, optional delta, hint and
 * state tint. Inside a dl it renders dt and dd, so screen readers pair each label with its value.
 */
export function Stat({ label, value, hint, delta, tone, size = 'md', inList, labelAs, labelId, className = '' }: StatProps) {
  const Label = inList ? 'dt' : (labelAs ?? 'p');
  const Value = inList ? 'dd' : 'p';
  const deltaIcon: IconName = delta?.direction === 'up' ? 'arrowUp' : delta?.direction === 'down' ? 'arrowDown' : 'minus';
  return (
    <div className={`${tone ? `rounded-xl p-3 ${STAT_TINT[tone]}` : ''} ${className}`}>
      <Label id={labelId} className="eyebrow">
        {label}
      </Label>
      <Value className={`num font-heading text-ink ${STAT_SIZE[size]}`}>{value}</Value>
      {delta && (
        <Value className="num mt-1 inline-flex items-center gap-1 text-xs font-medium text-muted">
          <Icon name={deltaIcon} size={14} />
          {delta.text}
        </Value>
      )}
      {hint}
    </div>
  );
}

/** A hint line under a Stat; pass several for several lines. */
export function StatHint({ children, inList, className = '' }: { children: ReactNode; inList?: boolean; className?: string }) {
  const Tag = inList ? 'dd' : 'p';
  return <Tag className={`num mt-1 text-xs text-subtle ${className}`}>{children}</Tag>;
}
