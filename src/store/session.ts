import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { LanguageCode } from '../i18n/languages';

export type ThemePref = 'light' | 'dark' | 'system';

interface SessionState {
  language: LanguageCode;
  theme: ThemePref;
  activePersonaId: string | null;
  sidebarCollapsed: boolean;
  /** Discreet mode: generic message previews now; amounts hidden on screen until tapped (Phase 6). */
  discreet: boolean;
  setLanguage: (language: LanguageCode) => void;
  setTheme: (theme: ThemePref) => void;
  setActivePersona: (id: string | null) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setDiscreet: (discreet: boolean) => void;
}

/** UI preferences only. Persona records go through the repository in src/data. */
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      language: 'en',
      theme: 'dark',
      activePersonaId: null,
      sidebarCollapsed: false,
      discreet: false,
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setActivePersona: (activePersonaId) => set({ activePersonaId }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setDiscreet: (discreet) => set({ discreet }),
    }),
    { name: 'tengo.session.v1', storage: createJSONStorage(() => localStorage) },
  ),
);
