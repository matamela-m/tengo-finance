# Tengo UI component pass

Bring in a small set of third-party components to raise the polish of Tengo without changing how the product works. Sources, in this order of preference: components the founder hands you from 21st.dev (https://21st.dev) and React Bits (https://reactbits.dev) as a copied prompt, CLI command or pasted source; components you find yourself on those two sites; and shadcn/ui (MIT) where it already covers the need and nothing visual is gained by looking elsewhere. Both 21st.dev and React Bits install as source into the repo, so everything you add becomes our code and our responsibility. This is a styling and interaction pass, not a feature change. The forecast engine, the Home rule, the data layer, routes, i18n, privacy and all tests stay as they are.

## Hard rules

- **No em dashes or en dashes anywhere.** No exclamation marks in UI copy. Grep after every phase.
- **Read every file you paste in.** These components are community-submitted third-party code. Reject or rewrite anything that: loads a font, image, script or style from an outside domain; injects raw HTML (`dangerouslySetInnerHTML`); calls the network; reads or writes storage outside our repository layer; or ships its own colour values instead of using tokens.
- **Licence check.** Neither 21st.dev nor React Bits states a single licence covering every component on its landing page, and 21st.dev components are community-submitted. For each component you take, record its source site, author, page URL, stated licence (check the component page and the project's GitHub LICENSE file) and the date, in `docs/ui-components.md`. If a component has no licence and no clear permission to use it, rebuild the pattern yourself instead of copying the file, and say so. Never copy anything marked paid, pro or restricted.
- **Our tokens, our fonts.** Every component is restyled to the current colour tokens and to Figtree for headings and Inter for body. No hard-coded colours, no new font families, no new icon set.
- **Our translation function.** Every visible string goes through `t()` and into all 11 locale files with identical keys.
- **No third-party requests at runtime.** Anything the component needs is installed as a dependency and bundled.
- **Animation dependencies.** Many React Bits components pull in an animation or 3D library (for example GSAP, Framer Motion, three.js or OGL). Check each one before adding it: name the dependency, its size and its licence, and do not add a 3D or shader library at all. If an effect needs more than a small motion library, rebuild it in CSS or drop it. Every animated component must be lazy-loaded and must stop animating under `prefers-reduced-motion`.
- **Accessibility is a gate, not a nice-to-have.** Zero axe violations in both themes. Keyboard operable, visible focus, correct roles and labels, 44px touch targets, inputs at 16px on phones, `prefers-reduced-motion` respected on every animation, no motion that cannot be turned off.
- **Budget.** Keep the compressed JavaScript at or below the current budget (about 142 KB) or improve it. Lazy-load anything heavy and route-specific. If a component pulls in a large dependency, say so and propose a lighter alternative before adding it.
- **Checks after every phase:** build, unit tests, lint, i18n check, fonts check, contrast check (both themes), the full Playwright suite and axe. Never weaken a test to make it pass. Commit locally after each phase with a short message, no push.
- **Taste.** Restraint is the look. Quiet surfaces, hairline borders, generous whitespace, one loud element per screen. If a component looks like a template showpiece, simplify it until it looks like ours.

## Phase 0: survey and plan

List the current shared primitives and which pages use them. Check our Tailwind and React versions and our TypeScript and Tailwind setup against what each candidate component expects (both sites offer a JavaScript or TypeScript and a CSS or Tailwind variant: always take TypeScript plus Tailwind). Write `docs/ui-components.md` with the plan: each component you intend to take, its source site and URL, where it is used, licence notes, new dependencies with sizes, and whether it is animated. Stop and report before taking anything, so the founder can swap in components they have chosen by eye. Flag immediately if any component needs a Tailwind or React upgrade, or a 3D or shader library.

## Phase 1: in-app primitives (do these first, they carry the most value)

1. **Stat card.** Used for the daily budget, next money and confidence on Home. Large tabular-numeral figure, small label, optional delta, optional state tint. Replace the current stat tiles.
2. **One-time code input.** Six separate boxes with paste support, auto-advance, auto-submit and a screen-reader label, for passwordless sign-in. Must work with a password manager and on mobile keyboards.
3. **Date picker and calendar.** For known payments, expected money and statement date ranges. Keyboard navigable, localised month and day names through our i18n setup, no outside locale data fetched at runtime.
4. **Stepper.** For the onboarding wizard. Shows the current step and allows Back. Focus moves to the new step heading on each change.
5. **Command palette.** Ctrl or Cmd plus K to jump between pages, switch persona, change language and toggle theme. Lazy-loaded so it costs nothing until opened.
6. **Data table.** For the Money page: sorting, filtering, search and empty state. Must stay readable at 390px, falling back to a card list on phones rather than a horizontally scrolling table.
7. **Skeleton loaders and empty states** for every page that can load or be empty.

## Phase 2: app shell and feedback

1. **Collapsible sidebar** for desktop, keeping the current nav structure and the mobile bottom bar as they are.
2. **Toast, drawer, dialog, dropdown, segmented control, switch and tabs:** restyle to the chosen components while keeping every current accessibility behaviour (focus trapping, inert background, escape to close, focus return).
3. **Cover gauge and progress:** refine the three-segment gauge using the chosen progress primitive, keeping the state colour, word and icon together.

## Phase 3: landing page (do last)

1. **Hero section:** large tightly tracked headline with a dimmed second half, a pill badge with a status dot, primary and secondary pill buttons.
2. **Soft background gradient or glow.** A React Bits background is allowed here only if it is CSS or small-canvas based, under about 15 KB compressed, pauses under reduced motion and does not need a 3D or shader library. Otherwise build it in CSS. No horizontal overflow at any width, and it must not sit behind text that then fails contrast.
3. **Device or window frame** holding the real Home preview with seeded data.
4. **Feature cards** in a three-column grid with icon tiles, and **stat tiles** with number counters that respect reduced motion. A React Bits text or number animation is a good fit for the hero headline and the counters, used once each and not on every heading on the page.
5. **FAQ accordion** answering: is this a bank, is my data safe, what does it cost, what if the date is wrong.
6. **Footer** in columns with the demo note and status dot.
7. **Scroll reveal** animations, subtle, 150 to 200ms, disabled under reduced motion.

## Phase 4: QA

Playwright screenshots of every page at 390, 768, 1280 and 1600 in both themes. Look at each one and fix clipping, overflow, low contrast, misalignment and any flash on theme change. Re-run the full suite, axe in both themes, Lighthouse mobile on landing, picker, Home and onboarding, the bundle budget check and `npm audit`. Update `docs/ui-components.md` with the final list, source sites, licences, sizes and any animated components, and note anything you rebuilt instead of copying. Confirm the page is still usable and readable with motion turned off.

After each phase give three lines: what changed, what is next, test status. If a component cannot meet the accessibility or budget rules, drop it, build the simpler version yourself, and say so.