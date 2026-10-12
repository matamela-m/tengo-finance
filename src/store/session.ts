import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { LanguageCode } from '../i18n/languages';

export type ThemePref = 'light' | 'dark' | 'system';

interface SessionState {
  language: LanguageCode;
  theme: ThemePref;
  activePersonaId: string | null;
  setLanguage: (language: LanguageCode) => void;
  setTheme: (theme: ThemePref) => void;
  setActivePersona: (id: string | null) => void;
}

/** UI preferences only. Persona records go through the repository in src/data. */
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      language: 'en',
      theme: 'light',
      activePersonaId: null,
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setActivePersona: (activePersonaId) => set({ activePersonaId }),
    }),
    { name: 'tengo.session.v1', storage: createJSONStorage(() => localStorage) },
  ),
);
