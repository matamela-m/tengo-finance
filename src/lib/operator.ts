/**
 * Who is responsible for Tengo, from build-time environment variables. The founder must set these
 * before launch (docs/SETUP-SUPABASE.md, docs/HUMAN-ACTIONS.md). Until then the app shows placeholders
 * and a warning, and the build prints a warning too (vite.config.ts).
 */
const PLACEHOLDER = 'To be named before launch';

export const OPERATOR = {
  responsibleParty: import.meta.env.VITE_RESPONSIBLE_PARTY?.trim() || PLACEHOLDER,
  address: import.meta.env.VITE_RESPONSIBLE_PARTY_ADDRESS?.trim() || PLACEHOLDER,
  informationOfficer: import.meta.env.VITE_INFORMATION_OFFICER?.trim() || PLACEHOLDER,
  contactEmail: import.meta.env.VITE_PRIVACY_EMAIL?.trim() || PLACEHOLDER,
};

export const OPERATOR_IS_PLACEHOLDER = Object.values(OPERATOR).some((v) => v === PLACEHOLDER);
