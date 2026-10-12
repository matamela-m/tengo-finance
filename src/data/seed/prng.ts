/** Mulberry32: tiny, fast, deterministic. Same seed, same sequence. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface Rng {
  next: () => number;
  /** Whole number in [min, max]. */
  int: (min: number, max: number) => number;
  /** Rand amount in [min, max], rounded to the nearest R1 or R0.50 for small values. */
  amount: (min: number, max: number) => number;
  chance: (p: number) => boolean;
  pick: <T>(items: readonly T[]) => T;
}

export function createRng(seed: string): Rng {
  const next = mulberry32(hashString(seed));
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    amount: (min, max) => {
      const v = min + next() * (max - min);
      return v < 100 ? Math.round(v * 2) / 2 : Math.round(v);
    },
    chance: (p) => next() < p,
    pick: (items) => items[Math.floor(next() * items.length)]!,
  };
}
