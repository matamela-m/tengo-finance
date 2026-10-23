# UI component pass: plan and record

Prepared 2026-10-24 for the brief in `docs/UI-COMPONENTS.md`. This file is the plan and the per-component record the brief asks for. It is not named `docs/ui-components.md` because this Mac's file system ignores letter case, so that name is the brief itself and writing it would overwrite the brief.

Phase 0 only. Nothing has been taken or installed in the repo.

## What we have

| Item | Version | Notes |
| --- | --- | --- |
| React | 18.3 | shadcn/ui still supports React 18 projects; components added stay in React 18 style |
| Tailwind | 3.4 | shadcn/ui still supports Tailwind 3 projects. `tailwind-merge` 3.x targets Tailwind 4, so a Tailwind 3 project needs `tailwind-merge` 2.x |
| TypeScript | 6.0, strict | Take the TypeScript plus Tailwind variant of everything |
| Icons | lucide-react 1.60 | shadcn/ui uses lucide too, so no new icon set |
| Initial JavaScript | 134.3 KB gzipped of a 142 KB budget | About 7.7 KB of headroom on first load. Anything bigger must sit in a lazy route chunk |

Lazy routes already: every page except Landing is split by route (`App.tsx`), so components used only on Home, Account, Money, Plan or Welcome do not touch the first-load budget. Landing and the command palette are in the first-load bundle today, so anything added to them counts against the 7.7 KB.

## Shared primitives today and where they are used

| Primitive | File | Used in |
| --- | --- | --- |
| Drawer (focus trap, inert background, Escape, focus return) | `components/Drawer.tsx` | Cash quick add, transaction editor, Why this date, obligations |
| Segmented control (native radios) | `components/Segmented.tsx` | Cash, manual setup, theme, obligations, Inbox, Money, Plan |
| Switch | `components/Toggle.tsx` | Shared phone, transaction editor, consent, Inbox, onboarding, privacy |
| Notice | `components/Feedback.tsx` | 18 places: errors, storage, notices on Home, Account, Import, Inbox, Me |
| Skeleton (`LoadingBlock`, `PageLoading`) | `components/Feedback.tsx` | App, app gate, consent, onboarding, Inbox |
| Empty state | `components/Feedback.tsx` | App gate, Home, Money, audit log |
| State chip and cover gauge | `StateChip.tsx`, `CoverBars.tsx` | Home, Plan, Picker, Landing, Me, Welcome, Import, Why drawer |
| Stat tile | `ui.tsx` (`StatTile`, currently unused) | Home builds its own daily budget, next money and confidence block inline |
| Badge, icon tile, card, section label | `ui.tsx` | Picker, Landing, consent, Help card, Plan, onboarding |
| Page header | `components/PageHeader.tsx` | 9 pages |
| Command palette | `components/CommandPalette.tsx` | App (eager) |
| Toast (visual, paired with the screen reader announcer) | `components/A11y.tsx` | Actions across the app |
| Scroll reveal | `components/Reveal.tsx` | Landing |
| Date inputs | native `<input type="date">` | Plan what-if, obligations |
| One-time code | one native input, `autocomplete="one-time-code"` | Account sign-in |

## Licences of the sources

- **shadcn/ui:** MIT. Components are copied into the repo and depend on MIT packages (Radix, and others listed below).
- **React Bits:** "MIT + Commons Clause License Condition v1.0" (github.com/DavidHDev/react-bits, LICENSE.md). Use in an app or product is allowed, including commercially; selling or redistributing the components themselves is not. The Commons Clause means it is not an OSI open source licence. Founder's call whether that is acceptable for a bank-facing product.
- **21st.dev:** I could not find an official licence or terms page. Component pages can show the licence as "unknown", and third-party directories disagree on whether the platform is MIT or proprietary. Per the brief, any 21st.dev component without a stated licence is rebuilt, not copied. I also cannot fetch 21st.dev or ui.shadcn.com from here, so components from those sites need to come from you as pasted source or a command.

## Measured sizes of candidate packages

Bundled with esbuild, minified, gzipped, React excluded. Measured 2026-10-24.

| Package | Licence | Size gz | Notes |
| --- | --- | --- | --- |
| input-otp 1.5 | MIT | 4.0 KB | shadcn Input OTP |
| react-day-picker 10.0 | MIT | 20.4 KB | shadcn Calendar; plus date-fns functions |
| cmdk 1.1 | MIT | 17.5 KB | shadcn Command |
| sonner 2.0 | MIT | 9.5 KB | shadcn toast; mounts at the app root |
| vaul 1.1 | MIT | 21.9 KB | shadcn Drawer |
| @radix-ui/react-dialog 1.3 | MIT | 13.8 KB | |
| @radix-ui/react-dropdown-menu 2.2 | MIT | 31.5 KB | |
| @radix-ui/react-tabs 1.2 | MIT | 9.4 KB | |
| @radix-ui/react-switch 1.4 | MIT | 5.0 KB | |
| @radix-ui/react-accordion 1.3 | MIT | 9.0 KB | |
| @radix-ui/react-progress 1.2 | MIT | 2.9 KB | |
| tailwind-merge 3.7 | MIT | 8.8 KB | Needs 2.x for Tailwind 3 |
| class-variance-authority 0.7 | Apache-2.0 | 0.5 KB | |
| clsx 2.1 | MIT | 0.2 KB | |
| motion 14.6 (`motion/react`) | MIT | 73.5 KB | Used by many React Bits components. Over budget on its own |

## Plan, item by item

"Take" means copy the component and its dependency; "build" means write the pattern ourselves with no new dependency. Everything is restyled to our tokens, fonts, `t()` strings and the 44px and 16px rules.

### Phase 1

| # | Item | Proposal | Source and URL | New dependency and size | Animated | Lands in |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Stat card | Build, from the existing unused `StatTile`, with optional delta and state tint | Pattern only (shadcn Card, MIT, ui.shadcn.com/docs/components/card) | None | No | Home |
| 2 | One-time code input | Take shadcn Input OTP | ui.shadcn.com/docs/components/input-otp, package github.com/guilhermerodz/input-otp (MIT) | input-otp 4.0 KB, Account chunk only | Caret only, off under reduced motion | Account |
| 3 | Date picker and calendar | Take shadcn Calendar for desktop, keep the native date input on phones | ui.shadcn.com/docs/components/calendar, package react-day-picker (MIT) | react-day-picker 20.4 KB plus date-fns, Plan and Money chunks only | No | Plan, obligations |
| 4 | Stepper | Build: steps, Back on every step, focus to the new step heading (fixes A11Y-A1) | Pattern only | None | No | Onboarding |
| 5 | Command palette | Keep ours, restyle it, and lazy-load it so it costs nothing until opened (frees first-load budget). cmdk adds 17.5 KB for features we already have | Ours; cmdk (MIT) only if you prefer it | None, or cmdk 17.5 KB lazy | Open and close only | App |
| 6 | Data table | Build: sortable, filterable, searchable table at 768px and up, card list on phones. Data sizes are small, so no table library | Pattern only (shadcn Data Table uses TanStack Table, MIT) | None | No | Money |
| 7 | Skeletons and empty states | Build on the existing `LoadingBlock` and `EmptyState`, add them to every page that can load or be empty | Pattern only (shadcn Skeleton, MIT) | None | Pulse, off under reduced motion | All pages |

### Phase 2

| # | Item | Proposal | New dependency |
| --- | --- | --- | --- |
| 1 | Collapsible sidebar | Restyle ours; it already collapses. shadcn Sidebar pulls in several Radix packages for no new behaviour | None |
| 2 | Toast | Restyle the toast we already have (`components/A11y.tsx`, tied to the screen reader announcer). sonner is 9.5 KB and mounts at the root, which would exceed the 7.7 KB first-load headroom | None |
| 2 | Drawer, dialog | Keep ours (focus trap, inert, Escape and focus return already tested) and restyle. vaul 21.9 KB, Radix dialog 13.8 KB add nothing we lack | None |
| 2 | Dropdown | Build if needed; Radix dropdown is 31.5 KB | None |
| 2 | Segmented, switch, tabs | Restyle ours; they are native radios and checkboxes with tested behaviour | None |
| 3 | Cover gauge and progress | Restyle `CoverBars`, keeping state word and icon beside it. Radix progress (2.9 KB) is not needed for three segments | None |

### Phase 3 (landing, last)

| # | Item | Proposal | Notes |
| --- | --- | --- | --- |
| 1 | Hero | Build: already has the dimmed second half; add the pill badge and pill buttons | None |
| 2 | Background glow | Build in CSS (radial gradients). React Bits backgrounds such as Aurora, Silk, Iridescence and Threads use OGL or three.js and are banned; others use GSAP or motion | None |
| 3 | Device frame | Build in CSS around the real Home preview | None |
| 4 | Feature cards, stat counters, headline text effect | Build counters with requestAnimationFrame (under 1 KB). React Bits Count Up and Blur Text need `motion` (73.5 KB) and Split Text needs GSAP, so rebuild their effect in CSS, once each | None |
| 5 | FAQ accordion | Native `<details>`, styled. Landing is in the first-load bundle, so Radix accordion (9.0 KB) would break the budget unless Landing is split out first | None |
| 6 | Footer | Restyle ours | None |
| 7 | Scroll reveal | Keep `Reveal` (IntersectionObserver), 150 to 200 ms, off under reduced motion | None |

## Flags

- **No Tailwind or React upgrade is needed** for anything above, provided shadcn components are taken in their Tailwind 3 form and `tailwind-merge` is pinned to 2.x if we adopt `cn()`.
- **No 3D or shader library** is proposed. Several React Bits backgrounds would need one and are excluded.
- **Budget is the binding constraint:** 7.7 KB of first-load headroom. Only lazy-route components can take a dependency. The command palette going lazy would free a few KB.
- **Calendar localisation:** our day and month names come from the browser only for Afrikaans and isiZulu. A calendar in the other eight drafted languages would need month and day names as translation keys (19 new strings per language, as AI drafts until reviewed), or English dates as today.
- **One-time code length:** the brief says six boxes; Supabase's code length is set per project (6 by default). The input will follow the configured length.
- **21st.dev:** licence unclear site-wide; components without a stated licence will be rebuilt.

## Record of components taken

| Phase | Component | Source and author | URL | Licence | Date | Size gz | Animated | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Code boxes (`components/CodeInput.tsx`) | Pattern after shadcn/ui Input OTP; package input-otp by Guilherme Rodz | ui.shadcn.com/docs/components/input-otp, github.com/guilhermerodz/input-otp | MIT (package LICENSE checked) | 2026-10-24 | 4.0 KB, Account chunk only | Caret blink only, stopped under reduced motion | Source read: no network, storage or raw HTML; it adds one style element through the CSS object model, which our CSP allows |
| 1 | Calendar (`components/date/CalendarPopover.tsx`) | Pattern after shadcn/ui Calendar; package react-day-picker by Giampaolo Bellavite and contributors (date-fns, MIT) | ui.shadcn.com/docs/components/calendar, daypicker.dev | MIT (package.json checked) | 2026-10-24 | 20.4 KB, loaded on first open | No | Source read: URLs only in doc strings. Our tokens via classNames; the library stylesheet is not loaded. Month and day names from our Intl formatter |

Built ourselves in Phase 1, with no new dependency: stat (`Stat` and `StatHint` in `components/ui.tsx`), stepper (`components/Stepper.tsx`), transaction table (`components/money/TransactionTable.tsx`), compact empty state (`components/Feedback.tsx`), and the command palette host (`components/CommandPaletteHost.tsx`), which now loads the existing palette on first open.

Phase 2, restyled in place with no new dependency and every existing behaviour kept (focus trap, inert background, Escape to close and focus return are unchanged and still tested):

- Sidebar: the active item uses the accent fill with main-text colour; nav structure and the phone bottom bar are unchanged.
- Drawer: a floating rounded panel with a shadow on wide screens; a decorative grab handle on the phone bottom sheet; the title is one size smaller.
- Switch: the off track now has the form-field border (at least 3:1), so its edge is visible on every surface.
- Segmented control: selected option uses the accent fill with a blue outline (done in the colour pass).
- Cover gauge: segments are slightly taller, and when the state is unclear they are dashed outlines, so an unknown cover never looks like an empty one. It stays decorative beside the state word and icon.
- Toast: kept as is (inverted pill, paired with the screen reader announcer).
- Dialog, dropdown and tabs: Tengo has none outside the drawer, command palette and segmented control, so nothing was added.
