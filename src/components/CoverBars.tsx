import type { Status } from '../engine/types';

/**
 * Cover gauge: a slim three-segment bar. 3 lit for Enough, 2 for Tight, 1 for Short, none when unclear.
 * Decorative: it always sits beside a StateChip, which gives the state in words.
 */
const LEVEL: Record<Status, 0 | 1 | 2 | 3> = { unclear: 0, short: 1, tight: 2, enough: 3 };
const FILL: Record<Status, string> = { enough: 'bg-enough', tight: 'bg-tight', short: 'bg-short', unclear: 'bg-surface-3' };

export function CoverBars({ state, size = 72, className = '' }: { state: Status; size?: number; className?: string }) {
  const level = LEVEL[state];
  return (
    <span aria-hidden className={`inline-flex shrink-0 gap-1 ${className}`} style={{ width: size }}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={`h-1.5 flex-1 rounded-full ${i < level ? FILL[state] : 'bg-surface-3'}`} />
      ))}
    </span>
  );
}

export { LEVEL as COVER_LEVEL };
