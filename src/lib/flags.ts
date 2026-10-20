/**
 * Feature flags, set at build time. All off by default.
 *
 * nameStory: the "mutengo" meaning on About and in the footer.
 * TODO: confirm the meaning with two first-language Tshivenda speakers before turning this on.
 * The review notes it may mean "price" rather than "value" (L10N-12). See docs/HUMAN-ACTIONS.md.
 */
export const FLAGS = {
  nameStory: import.meta.env.VITE_SHOW_NAME_STORY === 'true',
} as const;
