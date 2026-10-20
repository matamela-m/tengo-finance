# Accessibility and inclusive design specialist

## Verdict

Tengo has a stronger accessibility base than most hackathon builds. axe-core 4.14 with the WCAG 2.2 AA tags finds one violation across 15 pages and 4 overlays in both themes at 390 and 1280 px. Nothing scrolls sideways at 320 CSS px, every target is at least 24 px, reduced motion is honoured in CSS and in JavaScript, and the drawer and command menu follow the expected keyboard patterns. The tools miss the problems that matter for this audience. When a user picks Tshivenda, Sepedi or any other language, the page declares that language while every word is still English (WCAG 3.1.1). The chart slider tells a screen reader "Enough" for a person whose headline says "Short", and it hides the bills and income that explain each jump. Keyboard focus goes behind the fixed bottom tab bar on phones (2.4.11). The app shows a blank page offline after a first visit, which is when loadshedding is most likely to catch a new user. Beyond WCAG, the Home screen asks people who may be anxious about numbers to reconcile about 20 figures that sometimes contradict each other. Nothing protects private money data on a shared phone. This is a careful build with a few high-impact gaps, all fixable in days rather than weeks.

## What works

- **Automated scan is nearly clean.** My own axe run (tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa) over 15 routes plus the Why drawer, chart table, command menu and a Tshivenda session, in dark and light at 390 and 1280 px, found 1 violation: the chart table scroll region, A11Y-08. Evidence: `docs/review/tools/accessibility/results/axe-{dark,light}-{390,1280}.json`, script `docs/review/tools/accessibility/axe.a11y.ts`. The "incomplete" contrast items are SVG axis text and labels over translucent bars. The shipped token pairs pass (`docs/review/prep/checks.md`: 116 of 116 pairs).
- **Reflow at 320 CSS px (1.4.10).** On 12 routes at 320 x 640, `scrollWidth` equals the viewport width and no text runs off screen. Evidence: `results/manual.json` key `reflow320`. 320 px is the 400 percent equivalent of a 1280 px window. Nothing blocks zoom: no `maximum-scale` or `user-scalable` in `index.html`, and the manifest sets no orientation lock (1.3.4).
- **Target size (2.5.8).** Every control measured at 320 px is at least 24 x 24, and most are 44 px tall. The smallest are the 28 px privacy switch labels, which also have a 44 px input. Evidence: `results/manual.json` `reflow320.*.small`.
- **Dragging alternative (2.5.7).** The chart is a native `input type=range` laid over the plot (`src/components/forecast/TimelineScrubber.tsx:190`). A single tap sets the day (my tap at 60 percent set value 16, `results/manual.json` `chart.tapSetsValue`). Arrow keys, Home and End work, and "Show numbers" gives a full table. `touch-action: pan-y` (`src/styles/index.css:198`) keeps vertical page scroll working on phones.
- **Overlays behave.** The Why drawer moves focus to Close, keeps Tab inside the dialog, closes on Escape and returns focus to "Why this date" (`results/manual.json` `drawer`, `src/components/Drawer.tsx:24`). The command menu follows the combobox pattern. Typing "plan" then Enter navigates and moves focus to `main`. A theme command is announced in the live region ("Light theme on"). Evidence: `results/command-menu.json`.
- **Screen reader basics are thoughtful.** The date hero reads "Short from Friday 23 October" as an h1, with the short visual date hidden (`src/components/forecast/DateHero.tsx:16`). Amounts read "money in, R204". The count-up figure has a static sr-only copy (`src/pages/Home.tsx:61`). State is shown with colour, word and icon (`src/components/StateChip.tsx:12`, 1.4.1). Route changes move focus to `#main` and announce the page title (`src/components/A11y.tsx:44`). There is a skip link.
- **Reduced motion.** A global CSS override (`src/styles/index.css:123`), and `useCountUp` and `Reveal` both check `prefers-reduced-motion` (`src/lib/useCountUp.ts:8`, `src/components/Reveal.tsx:14`).
- **Language plumbing is ready.** Each language option carries its own `lang` (`src/components/LanguageSelector.tsx:46`, 3.1.2). Inbox messages carry `lang` (`src/pages/Inbox.tsx:117`). Headings switch to Inter for Tshivenda because Figtree lacks ḓ ḽ ṅ ṋ ṱ (`src/styles/index.css:84`).
- **Plain English.** A rough Flesch-Kincaid estimate over all 565 English strings gives about grade 3. Plan and Help sections score under grade 2 and the Why explanation about grade 2. This is a heuristic on short UI strings and tends to underestimate difficulty. Form errors give an example, for instance "Enter an amount above zero, for example 250." (`src/i18n/locales/en.json:532`, 3.3.3).
- **Data cost is small.** A cold Home load transfers 149 KB (`docs/review/prep/perf-home.json`). At ICASA's reported average of about R71 for a 1 GB prepaid bundle, that is roughly R0.01 per cold load.

## What to improve

### A11Y-01 Page language says Tshivenda or Sepedi while the text is English
- **Severity:** High
- **Evidence:** `src/components/Preferences.tsx:12` sets `document.documentElement.lang = language` for any choice, but `src/i18n/status.json` marks all 10 non-English languages "pending" and they render English. Measured: with `ve`, `nso` or `zu` selected, `html lang` is `ve`, `nso` or `zu` and the h1 is "Short from Friday 23 October" (`results/manual.json` key `lang`). This fails WCAG 3.1.1 Language of Page because the declared language is wrong. A screen reader with a matching voice installed, or a translate prompt, will treat English as Tshivenda. axe cannot detect this, and the Tshivenda scan passes.
- **Recommendation:** Set `lang` to the language actually rendered. Use `en` while a locale is pending, and when a locale is partly translated, put `lang="en"` on any string that falls back to English. Add a Playwright check that the `html lang` value matches the status.
- **Effort:** S

### A11Y-02 Blank page offline after a first visit (loadshedding)
- **Severity:** High
- **Evidence:** `public/sw.js` precaches only `/`, the manifest and two icons. The hashed JS and CSS are cached only when fetched while the worker is in control, and on a first visit they load before it takes control. Test: one visit, worker "activated", cache holds `/`, manifest, icons and two fonts but no JS or CSS. After going offline and reloading, the page has no h1 and an empty body (`results/offline-single-visit.json`, script `offline.a11y.ts`). The repo's own test passes only because it reloads once while online before going offline (`tests/flows.spec.ts:131`). There is no offline message.
- **Recommendation:** Precache the build output at install (Workbox or vite-plugin-pwa injecting the asset manifest). Add a static offline fallback that says in plain words that the app needs one connection to finish setting up. Change the test to go offline straight after the first visit.
- **Effort:** S

### A11Y-03 The chart slider tells screen reader users something different from the headline and hides what moves the balance
- **Severity:** High
- **Evidence:** For Ayanda, the h1 reads "Short from Friday 23 October", while the slider's first value reads "Tuesday 20 October, about R1 312, Enough" (`results/manual.json` `chart.ayanda`). The "If money lands as usual" caveat sits only in the section description, not in the value text (`src/i18n/locales/en.json:389`). Income and bill notes for the chosen day are `aria-hidden` (`TimelineScrubber.tsx:118`) and absent from `valueText` (`TimelineScrubber.tsx:79`). So Thabo's balance falls to R971 on Sunday and rises to R3 643 on Monday with no spoken reason. Sighted users see "Expected money +R2 860". The likely range is also visual only. Information shown visually is not exposed programmatically (1.3.1). For a blind user the unexplained "Enough" is a false reassurance risk.
- **Recommendation:** Put events and assumptions into `aria-valuetext`, for example "<day>, about <amount>, Enough if money lands as usual. <bill name> due, minus <amount>. Likely <low> to <high>." Give the slider a name that includes "if money lands as usual". Consider showing the day state as "Covered if paid" so the chart and the headline do not use the same word for different rules.
- **Effort:** S

### A11Y-04 Keyboard focus hidden behind the fixed bottom tab bar
- **Severity:** Medium
- **Evidence:** At 390 x 844, tabbing to "Try it in Plan" on Home and to "Edit Paraffin" on Money leaves the focused control under the tab bar. The bar's top edge is at 783 px, the controls sit at 789 to 844 px, and `elementFromPoint` returns the tab bar (`results/focus-obscured-app-390.png`, `results/focus-obscured-app-money-390.png`). Seven transaction edit buttons on Money were fully hidden (`results/manual.json` `obscured-/app/money`). This fails WCAG 2.4.11 Focus Not Obscured (Minimum). The bar is defined in `src/layouts/AppLayout.tsx:166` and the codebase has no `scroll-padding`.
- **Recommendation:** Add `html { scroll-padding-top: 64px; scroll-padding-bottom: calc(76px + env(safe-area-inset-bottom)); }` below the lg breakpoint. Add a Playwright check that the focused element is not covered.
- **Effort:** S

### A11Y-05 Too many numbers, some of them contradicting each other, for people anxious about money
- **Severity:** Medium
- **Evidence:** Ayanda's first phone screen shows "Short", "Runs out 2 days before your next money", "Safe to spend today R310" (her usual daily spend is R623), and a chart readout of "R1 312 ... Enough". The chart axis runs from minus R10k to R30k, and the range on the last chart day is "Likely -R1 882 to R21 173" (`docs/review/screens/ayanda-home-light-390.png`, `results/manual.json` `chart.ayanda.main`). Above "What helps most" I count about 20 distinct figures. Not a WCAG failure. For readers with low numeracy, a red "Short" next to a confident "R310 safe" invites them to keep the number they would rather believe.
- **Recommendation:** Lead with one sentence and one action, for example "Your money runs out on Friday, 2 days before Sunday's money. Spend about R250 less a day to close the gap." Move the range, confidence and 30 day chart behind "See the detail". Reconcile safe to spend with Short, or label it "only if you also cut R250 a day". Test with 5 users scoring low on a numeracy screener.
- **Effort:** M

### A11Y-06 No privacy on a shared phone
- **Severity:** Medium
- **Evidence:** Full transaction history, balance, consent and audit log sit in plain localStorage, 16.5 KB for one persona (`results/manual.json` `storage`, `src/data/localRepository.ts:15`). There is no PIN, no "hide amounts" mode and no sign-out, and the session reopens straight to Home. The planned messages contain the date and cover state (`src/i18n/locales/en.json:666`), which would appear on a lock screen. **Assumption:** phone sharing within households is common among lower-income South African users. I did not find a current sourced figure, so the range is wide: 10 to 40 percent of the target segment.
- **Recommendation:** Before any pilot, add an optional 4 digit app lock or device biometric, a one tap "hide amounts" toggle, and a discreet message mode with no amounts or state on the lock screen ("Tengo has an update"). Make sure the lock uses no cognitive test and allows paste and password managers (3.3.8 Accessible Authentication).
- **Effort:** M

### A11Y-07 Form fields and chart shading below 3:1 non-text contrast
- **Severity:** Medium
- **Evidence:** `.field` uses `border-line` on `bg-surface`. The border token gives 1.24:1 against surface in dark and 1.26:1 in light, and the field fill is the same colour as the card (`src/styles/index.css:16,40`, my calculation from the tokens). The border is the only cue that identifies the input, so it needs 3:1 under 1.4.11. The chart's likely-range band is 1.25:1 to 1.27:1 against the card. The band is supplementary because the table and readout carry the range, so it matters less. The repo's contrast check covers text pairs only (`docs/review/prep/checks.md`).
- **Recommendation:** Give inputs a `border-strong` that reaches 3:1, for example around rgb(110 110 118) in dark and rgb(140 136 128) in light, and verify with the contrast script. Add non-text pairs (field border, switch track, focus ring) to `scripts/contrast-check.mjs`.
- **Effort:** S

### A11Y-08 Chart data table cannot be scrolled by keyboard
- **Severity:** Medium
- **Evidence:** axe `scrollable-region-focusable` (serious, WCAG 2.1.1) on the `max-h-[360px] overflow-auto` table container in all four runs (`results/axe-*-*.json`, overlay `chart-table`; `TimelineScrubber.tsx:224`). The table has no focusable content, so keyboard users cannot reach days below the fold. The table is also wider than a 390 px phone (`min-w-[460px]`).
- **Recommendation:** Add `tabIndex={0}`, `role="region"` and an `aria-label` to the container, as the drawer body already does (`Drawer.tsx:79`). On phones, show 2 columns (day, expected) and put the range on a second line.
- **Effort:** S

### A11Y-09 The multilingual, low-literacy audience gets English only
- **Severity:** Medium
- **Evidence:** 10 of 11 locales are English copies (`src/i18n/status.json`). PIRLS 2021 found 81 percent of South African Grade 4 learners could not read for meaning in any language (Daily Maverick, source below), so reading load matters for adults in the target segment too. Most strings are short, but some privacy and Me strings estimate at grade 9 to 11 (`me.sim.translations`, `privacy.breach.contact.body`, `privacy.complaints`). Nothing is available as audio or voice.
- **Recommendation:** Before claiming multilingual reach, ship 2 or 3 languages that match the personas' areas (for example isiZulu, Sepedi, Setswana), each reviewed by a first-language speaker. Add a "read this to me" button on the date hero using the device's speech synthesis where a voice exists. Rewrite the privacy strings to grade 5 or lower.
- **Effort:** L

### A11Y-10 Import errors are not explained or announced
- **Severity:** Low
- **Evidence:** "This file could not be read as a CSV." (`en.json:582`) gives no next step (3.3.3), and the `Notice` that shows it has no live role (`src/components/Feedback.tsx:54`, `src/pages/Import.tsx:131`), so screen reader users are not told (4.1.3). An invalid balance sets `aria-invalid` with no error text and only disables the Save button (`src/pages/Import.tsx:248`, 3.3.1).
- **Recommendation:** Say what to do ("Save the statement from your banking app as CSV, or try the sample"). Render errors with `role="alert"`. Add a visible error under the balance field and keep the button enabled, so pressing it explains the problem.
- **Effort:** S

### A11Y-11 Negative amounts may be read without "minus"
- **Severity:** Low
- **Evidence:** Spoken text uses a hyphen-minus, for example "Friday 23 October, about -R384, Short" (`results/manual.json` `chart.ayanda.slider`, `src/lib/format.ts:13`). **Assumption:** at default punctuation levels some screen readers and TalkBack voices skip or misread a leading hyphen. I did not test with a real screen reader, so this needs checking on NVDA and TalkBack.
- **Recommendation:** In `aria-valuetext` and sr-only copies, use words: "R384 below zero" or "minus R384".
- **Effort:** S

### A11Y-12 Truncated text loses meaning at small widths and high zoom
- **Severity:** Low
- **Evidence:** Transaction names and persona roles are cut with an ellipsis: "Cash deposit, shop takin…" at 390 px, "E-hailing …" and "Spaza s…" at 320 px (`docs/review/screens/ayanda-home-light-390.png`, `results/home-320.png` from the Me page). Screen readers get the full text, so this is not a WCAG failure, but sighted low-literacy users lose the words they would recognise.
- **Recommendation:** Allow 2 lines (`line-clamp-2`) instead of `truncate` for descriptions and roles.
- **Effort:** S

### A11Y-13 Command menu is keyboard-only and its groups are not announced
- **Severity:** Low
- **Evidence:** Below the lg breakpoint there is no visible control to open it (`results/manual.json` `commandMenu.mobileOpenButtonVisible: 0`, opener only in the sidebar, `AppLayout.tsx:89`). Group headings are `<p role="presentation">` inside `role="presentation"` items (`CommandPalette.tsx:197`), so "Pages", "People" and "Language" are not announced. Ctrl+K also opens it from inside a text field (`results/command-menu.json` `opensFromTextField: 1`), which overrides a common editing shortcut in some browsers.
- **Recommendation:** Use `role="group"` with `aria-labelledby` for each section. Ignore the shortcut when focus is in an editable field, unless the field is empty. On phones this is optional, because everything is reachable in Me.
- **Effort:** S

### A11Y-14 Low-end Android parses translations that are not there yet
- **Severity:** Low
- **Evidence:** One 696 KB JS file (142 KB gzip), of which 337 KB is locale JSON for 11 languages, 10 of them English copies (`docs/review/prep/audit.md`). Cold hero at 4x CPU slowdown is 1.5 s (`perf-home.json`), which is acceptable. **Assumption:** entry-level Android phones with 1 to 2 GB RAM and older CPUs are 2 to 4 times slower than the 4x throttle, which would put the cold hero at 2 to 4 s.
- **Recommendation:** Load only the active locale on demand, and cache it in the service worker. Test once on a real entry-level Android Go device.
- **Effort:** S

### A11Y-15 Before a pilot: authentication, help and accessibility testing with people
- **Severity:** Low
- **Evidence:** There is no login yet, so 3.3.8 Accessible Authentication does not apply today. The privacy pages have a "Question this result" help route, but nothing appears in the same place on every page (3.2.6 Consistent Help applies once a real help channel exists). No test with screen reader users or low-literacy users is recorded (`docs/review/prep/walkthrough.md` is a developer walkthrough).
- **Recommendation:** Design the bank-grade login to allow biometrics, paste and password managers, with no puzzles. Put one "Help" link in the same place on every page. Run a session with 3 TalkBack users and 5 low-literacy users before a pilot.
- **Effort:** M

## Top three risks

1. **Misleading reassurance for screen reader users.** The slider says "Enough" while the headline says "Short", and the bills that explain the drops are hidden from assistive tech (A11Y-03). A blind user could act on the wrong signal.
2. **The app fails exactly when power and network drop.** After one visit it shows a blank page offline (A11Y-02), and the first visit is the moment a new user is most likely to lose signal during loadshedding.
3. **Multilingual claim versus reality.** Picking a language changes `lang` but not the words (A11Y-01, A11Y-09). A judge or user who picks isiZulu sees English, and assistive tech gets the wrong language, which undercuts the inclusion pitch.

## Score

6/10: a carefully built accessible base with near-clean automated results, held back by a language-of-page failure, offline failure on first visit, contradictory screen reader output on the chart, focus hidden under the tab bar, and a Home screen too dense in numbers for its audience.

## Sources

- W3C, Web Content Accessibility Guidelines (WCAG) 2.2, https://www.w3.org/TR/WCAG22/ (accessed 2026-10-20)
- W3C, Understanding SC 3.1.1 Language of Page, https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html (accessed 2026-10-20)
- W3C, Understanding SC 3.1.2 Language of Parts, https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html (accessed 2026-10-20)
- W3C, Understanding SC 1.3.1 Info and Relationships, https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html (accessed 2026-10-20)
- W3C, Understanding SC 1.4.10 Reflow, https://www.w3.org/WAI/WCAG22/Understanding/reflow.html (accessed 2026-10-20)
- W3C, Understanding SC 1.4.11 Non-text Contrast, https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html (accessed 2026-10-20)
- W3C, Understanding SC 2.1.1 Keyboard, https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html (accessed 2026-10-20)
- W3C, Understanding SC 2.4.11 Focus Not Obscured (Minimum), https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html (accessed 2026-10-20)
- W3C, Understanding SC 2.5.7 Dragging Movements, https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html (accessed 2026-10-20)
- W3C, Understanding SC 2.5.8 Target Size (Minimum), https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html (accessed 2026-10-20)
- W3C, Understanding SC 3.2.6 Consistent Help, https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html (accessed 2026-10-20)
- W3C, Understanding SC 3.3.1 Error Identification, https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html (accessed 2026-10-20)
- W3C, Understanding SC 3.3.3 Error Suggestion, https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html (accessed 2026-10-20)
- W3C, Understanding SC 3.3.8 Accessible Authentication (Minimum), https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html (accessed 2026-10-20)
- W3C, Understanding SC 4.1.3 Status Messages, https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html (accessed 2026-10-20)
- Daily Maverick, "International study shows 81% of Grade 4s in South Africa cannot read for meaning" (PIRLS 2021), https://www.dailymaverick.co.za/article/2023-05-16-international-study-shows-81-of-grade-4s-in-south-africa-cannot-read-for-meaning/ (accessed 2026-10-20)
- ICASA, Bi-annual Tariff Analysis Report 2025/26 Q2 (abridged), average price of about R71 for 1 GB to 1.2 GB, https://www.icasa.org.za/uploads/files/2025-26FY-Q2-Bi-annual-Tariff-Analysis-Report-Abridged-Report-For-Publication.pdf (accessed 2026-10-20)

Tools and raw outputs: `docs/review/tools/accessibility/` (`axe.a11y.ts`, `manual.a11y.ts`, `cmd.a11y.ts`, `obscured.a11y.ts`, `offline.a11y.ts`, `a11y.config.ts`) and `docs/review/tools/accessibility/results/`. Run with `npx playwright test -c docs/review/tools/accessibility/a11y.config.ts`. The first command menu reading in `manual.json` was a timing artefact. `command-menu.json` is the corrected run.

## Findings table

| id | severity | title | evidence | recommendation | effort |
| --- | --- | --- | --- | --- | --- |
| A11Y-01 | High | Page language says Tshivenda or Sepedi while text is English (3.1.1) | src/components/Preferences.tsx:12; src/i18n/status.json all pending; results/manual.json lang shows html lang ve/nso/zu with English h1 | Set html lang to the language actually rendered (en while pending); mark fallback strings lang=en; add a test | S |
| A11Y-02 | High | Blank page offline after a first visit | public/sw.js precaches only / and icons; results/offline-single-visit.json shows no JS or CSS cached and empty body offline; tests/flows.spec.ts:131 reloads online first | Precache build assets at install, add a plain offline fallback, test offline straight after first visit | S |
| A11Y-03 | High | Chart slider says Enough while headline says Short and hides bills and income | results/manual.json chart.ayanda; TimelineScrubber.tsx:79 valueText; TimelineScrubber.tsx:118 aria-hidden notes | Add the assumption, bills, income and range to aria-valuetext; rename or relabel the per-day state | S |
| A11Y-04 | Medium | Keyboard focus hidden behind fixed bottom tab bar (2.4.11) | results/focus-obscured-app-390.png; results/focus-obscured-app-money-390.png; AppLayout.tsx:166; no scroll-padding in src | Add scroll-padding-top and scroll-padding-bottom below lg; add a Playwright check | S |
| A11Y-05 | Medium | Home too dense in numbers with contradictory signals | docs/review/screens/ayanda-home-light-390.png: Short, R310 safe, chart Enough, range -R1 882 to R21 173 | One sentence plus one action first; move detail behind a link; reconcile safe to spend with Short; test with low-numeracy users | M |
| A11Y-06 | Medium | No privacy protection on a shared phone | results/manual.json storage 16.5 KB plaintext; no lock or hide mode; en.json:666 messages include date and state | Optional app lock or biometrics, hide-amounts toggle, discreet lock-screen messages; keep 3.3.8 in mind | M |
| A11Y-07 | Medium | Form field borders and chart band below 3:1 (1.4.11) | border token 1.24:1 dark and 1.26:1 light on surface; band 1.25:1; src/styles/index.css:16,40 | Raise input border to 3:1; add non-text pairs to contrast-check script | S |
| A11Y-08 | Medium | Chart data table not keyboard scrollable (2.1.1) | axe scrollable-region-focusable in results/axe-*-*.json chart-table; TimelineScrubber.tsx:224 | Add tabIndex 0, role region and label; simplify the table on phones | S |
| A11Y-09 | Medium | Multilingual, low-literacy audience gets English only | src/i18n/status.json; PIRLS 2021 81 percent cannot read for meaning; privacy strings estimate grade 9 to 11 | Ship 2 or 3 reviewed languages first; add read-aloud on the date; rewrite privacy copy to grade 5 | L |
| A11Y-10 | Low | Import errors not explained or announced (3.3.1, 3.3.3, 4.1.3) | en.json:582 readError; Feedback.tsx:54 Notice not live; Import.tsx:248 aria-invalid without message | Add next step to errors, role alert, visible balance error, keep button enabled | S |
| A11Y-11 | Low | Negative amounts may be read without minus (Assumption) | results/manual.json chart.ayanda.slider "-R384"; src/lib/format.ts:13 | Use "minus R384" or "R384 below zero" in spoken text; verify on NVDA and TalkBack | S |
| A11Y-12 | Low | Truncated descriptions and roles lose meaning | ayanda-home-light-390.png "Cash deposit, shop takin…"; results/home-320.png "Spaza s…" | Use two-line clamp instead of truncate | S |
| A11Y-13 | Low | Command menu keyboard-only with unannounced groups | results/manual.json commandMenu.mobileOpenButtonVisible 0; CommandPalette.tsx:197; results/command-menu.json opensFromTextField 1 | Use role group with labels; ignore shortcut in non-empty text fields | S |
| A11Y-14 | Low | Low-end Android parses 337 KB of untranslated locale JSON | docs/review/prep/audit.md; perf-home.json cold hero 1516 ms at 4x CPU | Lazy-load the active locale; test on a real entry-level Android Go phone | S |
| A11Y-15 | Low | No plan yet for accessible login, consistent help or testing with disabled users | no auth in app; walkthrough.md is developer-only; 3.2.6 and 3.3.8 apply once real | Design biometric or paste-friendly login, one Help link in the same place on every page, test with TalkBack and low-literacy users | M |
