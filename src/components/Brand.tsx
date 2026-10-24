/**
 * The only place the Tengo brand is drawn, from the founder's logo files (tengo-brand/, scaled into
 * public/brand by scripts/make-icons.py).
 * wordmark: the horizontal lockup. mark: the three bars only. tile: the mark on a square, for avatars.
 * Each comes in an on-light and an on-dark version; the theme shows the right one.
 */
interface BrandProps {
  variant?: 'wordmark' | 'mark' | 'tile';
  /** Height of the wordmark or mark, or edge length of the tile, in px. */
  size?: number;
  className?: string;
  /** Set when the brand sits beside visible text that already says Tengo. */
  decorative?: boolean;
}

// Width over height of the supplied artwork.
const RATIO = { wordmark: 1583 / 303, mark: 1076 / 675, tile: 1 };
const FILE = { wordmark: 'tengo-horizontal-on-', mark: 'tengo-mark-on-', tile: 'tengo-tile-' };
// The brand rules ask for the lockup to be at least 120 px wide on screen.
const MIN_WORDMARK_HEIGHT = Math.ceil(120 / RATIO.wordmark);

export function Brand({ variant = 'wordmark', size = 22, className = '', decorative }: BrandProps) {
  const height = variant === 'wordmark' ? Math.max(size, MIN_WORDMARK_HEIGHT) : size;
  const width = Math.round(height * RATIO[variant]);
  const img = (theme: 'light' | 'dark', show: string) => (
    <img
      src={`/brand/${FILE[variant]}${theme}.png`}
      alt=""
      width={width}
      height={height}
      draggable={false}
      className={`${show} max-w-none`}
      style={{ width, height }}
    />
  );
  return (
    <span
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'Tengo'}
      aria-hidden={decorative || undefined}
      className={`inline-flex shrink-0 select-none ${variant === 'tile' ? 'overflow-hidden rounded-[28%]' : ''} ${className}`}
    >
      {img('light', 'block dark:hidden')}
      {img('dark', 'hidden dark:block')}
    </span>
  );
}
