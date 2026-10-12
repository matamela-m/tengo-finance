/**
 * Chooses between the founder supplied logo files. It never redraws or alters the logo.
 * Files live in public/brand and are used at native size or smaller, so they stay sharp on 2x screens.
 */
type Variant = 'mark' | 'horizontal' | 'stacked';
type Background = 'light' | 'dark';

const NATIVE: Record<Variant, { w: number; h: number }> = {
  mark: { w: 810, h: 668 },
  horizontal: { w: 1660, h: 327 },
  stacked: { w: 1235, h: 1005 },
};

interface TengoLogoProps {
  variant?: Variant;
  background?: Background;
  /** Rendered height in CSS pixels. Capped at native size so the file is never scaled up. */
  height?: number;
  className?: string;
  /** Pass false when the logo sits next to visible text that already says Tengo. */
  decorative?: boolean;
}

export function TengoLogo({ variant = 'horizontal', background = 'light', height = 32, className, decorative }: TengoLogoProps) {
  const native = NATIVE[variant];
  const h = Math.min(height, native.h);
  const w = Math.round((native.w / native.h) * h);
  return (
    <img
      src={`/brand/tengo-${variant}-on-${background}.png`}
      width={w}
      height={h}
      alt={decorative ? '' : 'Tengo'}
      className={className}
      style={{ height: h, width: w }}
      decoding="async"
      draggable={false}
    />
  );
}
