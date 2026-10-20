import { create } from 'zustand';

/** How long amounts stay visible after "Show amounts" in discreet mode. */
export const REVEAL_MS = 30_000;

interface RevealState {
  /** Amounts are visible until this time. Not saved: a reload hides them again. */
  until: number;
  reveal: () => void;
  hide: () => void;
}

export const useReveal = create<RevealState>()((set) => ({
  until: 0,
  reveal: () => set({ until: Date.now() + REVEAL_MS }),
  hide: () => set({ until: 0 }),
}));
