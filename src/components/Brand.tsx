/**
 * The only place the Tengo brand is drawn. The final logo replaces this one file.
 * wordmark: "Tengo" in Figtree 700 with slight negative tracking, in the current text colour.
 * mark: a rounded square in the accent colour with a bold "T". A placeholder until the new logo lands.
 */
interface BrandProps {
  variant?: 'wordmark' | 'mark';
  /** Font size of the wordmark, or edge length of the mark, in px. */
  size?: number;
  className?: string;
  /** Set when the brand sits beside visible text that already says Tengo. */
  decorative?: boolean;
}

// Figtree directly, not the heading variable: "Tengo" has no Tshivenda letters, so it can always use it.
const FIGTREE = "'Figtree Variable', 'Inter Variable', system-ui, sans-serif";

export function Brand({ variant = 'wordmark', size = 22, className = '', decorative }: BrandProps) {
  if (variant === 'mark') {
    return (
      <span
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : 'Tengo'}
        aria-hidden={decorative || undefined}
        className={`inline-flex shrink-0 select-none items-center justify-center bg-accent font-bold leading-none text-on-accent ${className}`}
        style={{ width: size, height: size, borderRadius: size * 0.28, fontSize: size * 0.62, fontFamily: FIGTREE, letterSpacing: '-0.02em' }}
      >
        T
      </span>
    );
  }
  return (
    <span
      aria-hidden={decorative || undefined}
      className={`inline-block select-none font-bold leading-none text-ink ${className}`}
      style={{ fontSize: size, fontFamily: FIGTREE, letterSpacing: '-0.035em' }}
    >
      Tengo
    </span>
  );
}
