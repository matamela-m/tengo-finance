import type { CoverState } from '../../engine/types';

export type PersonaId = 'thabo' | 'lerato' | 'ayanda';

export interface PersonaProfile {
  id: PersonaId;
  name: string;
  /** i18n keys under personas.<id> hold role, place and situation. */
  place: string;
  startState: CoverState;
  avatar: { bg: string; fg: string };
}

export const PERSONAS: PersonaProfile[] = [
  { id: 'thabo', name: 'Thabo', place: 'Tshwane', startState: 'tight', avatar: { bg: '#125747', fg: '#B6DFB2' } },
  { id: 'lerato', name: 'Lerato', place: 'Mamelodi', startState: 'enough', avatar: { bg: '#B6DFB2', fg: '#1E1E1E' } },
  { id: 'ayanda', name: 'Ayanda', place: 'Tembisa', startState: 'short', avatar: { bg: '#7AAB88', fg: '#1E1E1E' } },
];

export function getPersona(id: string | null | undefined): PersonaProfile | undefined {
  return PERSONAS.find((p) => p.id === id);
}
