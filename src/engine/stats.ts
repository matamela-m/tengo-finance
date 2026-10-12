/** Linear interpolated percentile, p in [0, 1]. Returns 0 for an empty list. */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const a = sorted[lo] ?? 0;
  const b = sorted[hi] ?? 0;
  return a + (b - a) * (idx - lo);
}

export function median(values: number[]): number {
  return percentile(values, 0.5);
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
