import type { CoverState } from '../../engine/types';

/** The three fictional people. */
export type PersonaId = 'thabo' | 'lerato' | 'ayanda';

/** The person's own profile, kept apart from the fictional people. */
export const OWN_ID = 'own';
export type ProfileId = PersonaId | typeof OWN_ID;

export interface PersonaProfile {
  id: ProfileId;
  name: string;
  /** i18n keys under personas.<id> hold role, place and situation. Empty for the own profile. */
  place: string;
  startState: CoverState;
  /** Avatar tone, drawn from the theme tokens. */
  avatar: 'accent' | 'neutral' | 'inverse';
  /** True for the person's own profile: never shown as fictional. */
  own?: boolean;
  /** Portrait image URL. The fictional people have illustrations; the own profile can add a photo. */
  photo?: string;
}

export const PERSONAS: (PersonaProfile & { id: PersonaId })[] = [
  { id: 'thabo', name: 'Thabo', place: 'Tshwane', startState: 'tight', avatar: 'accent', photo: '/avatars/thabo.webp' },
  { id: 'lerato', name: 'Lerato', place: 'Mamelodi', startState: 'enough', avatar: 'neutral', photo: '/avatars/lerato.webp' },
  { id: 'ayanda', name: 'Ayanda', place: 'Tembisa', startState: 'short', avatar: 'inverse', photo: '/avatars/ayanda.webp' },
];

export function getPersona(id: string | null | undefined): (PersonaProfile & { id: PersonaId }) | undefined {
  return PERSONAS.find((p) => p.id === id);
}

export function isProfileId(id: string | null | undefined): id is ProfileId {
  return id === OWN_ID || Boolean(getPersona(id));
}

/** The own profile as a PersonaProfile, named by the nickname when there is one. */
export function ownProfile(nickname: string | undefined, fallbackName: string, photo?: string): PersonaProfile {
  return { id: OWN_ID, name: nickname?.trim() || fallbackName, place: '', startState: 'tight', avatar: 'accent', own: true, photo };
}
