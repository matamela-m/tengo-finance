import type { CoverState } from '../engine/types';

/**
 * Three upright bars that light up with cover: 3 Enough, 2 Tight, 1 Short.
 * A separate UI gauge, deliberately unlike the slanted logo mark.
 * Decorative: it always sits beside a StateChip, which gives the state in words.
 */
const LEVEL: Record<CoverState, 1 | 2 | 3> = { short: 1, tight: 2, enough: 3 };

interface CoverBarsProps {
  state: CoverState;
  size?: number;
  className?: string;
}

export function CoverBars({ state, size = 24, className }: CoverBarsProps) {
  const level = LEVEL[state];
  const fill = `var(--c-${state})`;
  const stroke = `var(--c-${state}-text)`;
  const bars = [0.45, 0.72, 1];
  const w = size;
  const h = size;
  const bw = w / 4.2;
  const gap = (w - bw * 3) / 2;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden
      focusable="false"
      className={className}
    >
      {bars.map((ratio, i) => {
        const bh = h * ratio;
        const lit = i < level;
        return (
          <rect
            key={i}
            x={i * (bw + gap) + 0.75}
            y={h - bh + 0.75}
            width={bw - 1.5}
            height={bh - 1.5}
            rx={Math.min(3, bw / 3)}
            fill={lit ? fill : 'var(--c-line)'}
            stroke={lit ? stroke : 'none'}
            strokeWidth={lit ? 1.5 : 0}
          />
        );
      })}
    </svg>
  );
}

export { LEVEL as COVER_LEVEL };
