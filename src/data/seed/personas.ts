import type { CoverState } from '../../engine/types';

export type PersonaId = 'thabo' | 'lerato' | 'ayanda';

export interface PersonaProfile {
  id: PersonaId;
  name: string;
  /** i18n keys under personas.<id> hold role, place and situation. */
  place: string;
  startState: CoverState;
  /** Avatar tone, drawn from the theme tokens. */
  avatar: 'accent' | 'neutral' | 'inverse';
}

export const PERSONAS: PersonaProfile[] = [
  { id: 'thabo', name: 'Thabo', place: 'Tshwane', startState: 'tight', avatar: 'accent' },
  { id: 'lerato', name: 'Lerato', place: 'Mamelodi', startState: 'enough', avatar: 'neutral' },
  { id: 'ayanda', name: 'Ayanda', place: 'Tembisa', startState: 'short', avatar: 'inverse' },
];

export function getPersona(id: string | null | undefined): PersonaProfile | undefined {
  return PERSONAS.find((p) => p.id === id);
}
