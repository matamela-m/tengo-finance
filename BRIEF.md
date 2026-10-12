# Tengo build brief

You are building Tengo, a working, polished, modern web app for the FNB App of the Year hackathon (track: Financial inclusion and money confidence). Work in the current folder, which is already open in VS Code. Read this whole brief before writing code. Start with a short plan, then build phase by phase and commit after each phase.

## 1. Product

Tengo is a money app for people with irregular income. It answers one question: is my money enough until the next money?

- Pitch line: "A balance tells you what you have. Tengo tells you until when."
- Tagline: "Money you can plan around."
- Name: from "mutengo", Tshivenda for value (supplied by the founder, to be confirmed by a Venda speaker before submission). Add a TODO in the README.
- Headline answer is date-first: "Enough until Thu 23 Oct". Beside it: a range band when data is thin, a "Safe to spend today" figure, and a state of Enough, Tight or Short.
- This is a demo with fictional data only. No bank connection, no real personal information, no claim of open banking.

## 2. Hard rules

- Never use em dashes or en dashes anywhere: UI copy, code comments, README, commit messages. After each phase run a grep for the characters U+2014 and U+2013 and fix any hits.
- No exclamation marks in UI copy.
- Copy is short, direct and plain. No filler, no marketing fluff.
- Currency is ZAR, formatted like "R1 250" (space thousands separator, no decimals unless needed).
- The demo chip must read exactly: "Demo | Fictional Data". Show it persistently (header on desktop, top of screen on mobile) once inside the app, and on the landing page footer.
- No third-party network requests at runtime. Self-host fonts. No analytics scripts.
- Colour is never the only signal. Every state shows a colour, a word and an icon.

## 3. Stack

React 18, Vite, TypeScript (strict), Tailwind CSS, React Router, i18next with react-i18next, Zustand with localStorage persistence, PapaParse for CSV, Vitest for unit tests, Playwright for screenshot checks. Custom SVG for charts (no heavy chart library). A light animation approach is fine (CSS or a small motion library). No backend in this phase. Put all data access behind a small repository interface in `src/data/` so a Supabase implementation can replace the local one later without touching UI code.

Scaffold in the current folder, not a subfolder. If files already exist, inspect them first and do not overwrite anything without reason.

## 4. Assets already in the folder

- `assets/brand/` holds the final, transparent, padding-trimmed logo PNGs supplied by the founder: `tengo-mark-on-light.png`, `tengo-mark-on-dark.png`, `tengo-stacked-on-light.png`, `tengo-stacked-on-dark.png`, `tengo-horizontal-on-light.png`, `tengo-horizontal-on-dark.png`, and `palette-reference.png` (a reference slide, not for use in the UI). "On light" files have dark lettering for light backgrounds, "on dark" files have off-white lettering for the charcoal background. `assets/fonts/` holds the Public Stunt font file (any extension; find it).

Do not redraw, trace, recreate or modify the logo in any way. Use the supplied files exactly as they are. Look at the folder, identify which file is which (mark only, horizontal, stacked, light and dark variants), and copy what the app needs into `public/brand/` unchanged. Build a thin `<TengoLogo />` component that only chooses between the supplied files (variant: mark, horizontal, stacked; background: light or dark) and renders them as `<img>`. Make the favicon and app icons by resizing `tengo-mark-on-light.png` only (scale and pad, no redrawing). An SVG of the logo is not available, so use the PNGs at their native size or smaller and never scale them up; add `srcset` or 2x usage where sharpness matters. If a file you need is missing, say so and carry on with a clearly marked placeholder.

The cover gauge in section 5 is a separate UI element and must not reuse or imitate the logo file. Build it as its own small `<CoverBars level={1|2|3} />` component.

Copy the font into `public/fonts/` and declare it with `@font-face` and `font-display: swap`. If the file is not web-ready, convert to woff2 with a local tool and say so.

## 5. Design system

Palette tokens (CSS variables plus Tailwind theme):
- white #FFFFFF, off-white #EEEBE6 (app background), mint #B6DFB2, sage #7AAB88, deep green #125747 (brand), charcoal #1E1E1E (text and dark surfaces).
- Add state colours. Starting values: Enough bright green #2FB36B, Tight amber #E8A33D, Short terracotta #C8553D. The Enough green must look clearly different from brand deep green. Write a small script that checks WCAG contrast of every text and surface pair you use, on off-white, white and charcoal. Body text needs 4.5:1, large text and UI icons 3:1. Where a state colour fails as text, use a darker text variant and keep the bright one for fills with charcoal text. Report the final pairs in the README.
- Provide a light theme. Dark theme is a stretch goal, build it only after everything else is done.

Type:
- Inter (variable, self-hosted via `@fontsource-variable/inter`) for all UI text. Turn on `font-variant-numeric: tabular-nums` for every money figure and date.
- Public Stunt for display moments only: the wordmark, the landing headline, the date hero on Home, the large "Safe to spend today" figure, page titles, and persona names on the picker. Always declare the stack as Public Stunt, then Inter, so any glyph Public Stunt lacks falls back to Inter. Do not use Public Stunt for body text, labels, buttons, tables or long strings. Tshivenda letters (ḓ ḽ ṅ ṋ ṱ) are not in Public Stunt, so never rely on it for translated headings.
- Add a README note that the free Public Stunt version is personal use only and a commercial licence is required before public launch.

Look and feel: modern, calm, confident. Generous whitespace, large type for the one number that matters, soft rounded surfaces, subtle depth, no clutter. A small three-bar `<CoverBars />` gauge echoes the brand rhythm without copying the logo: 3 bars lit means Enough, 2 means Tight, 1 means Short. Animate the date hero (rolling digits or fade) when it changes, and respect `prefers-reduced-motion`.

## 6. Responsive layout (important)

Design desktop as a real desktop experience. Do not render a phone-width column centred on a wide screen.

- Mobile (below 768px): single column, bottom tab bar.
- Tablet (768 to 1023px): single column with wider cards, bottom or side nav.
- Desktop (1024px and up): persistent left sidebar nav, content area uses the full width up to about 1360px, multi-column layouts. Home on desktop is two columns: left column holds the date hero, range band and timeline scrubber; right column holds Safe to spend today, state card, next money and recent activity. Plan, Money and Privacy pages also use multi-column desktop layouts.
- The landing page and the picker are full-width, fluid layouts.

Verify at 390, 768, 1280 and 1600px wide with Playwright screenshots. Review each screenshot yourself and fix problems before moving on.

## 7. Flow and pages

1. **Landing** (`/`): hero with the headline "Money you can plan around.", the pitch line, an "Explore Tengo" button, and a live product preview built from a seeded persona. Below: three short steps (Add your money history, See how long it lasts, Plan around the date), and a footer with the demo chip and a line that all data is fictional.
2. **Persona and language picker** (`/start`): three persona cards and a language selector on the same page. Languages in order: English, Afrikaans, Tshivenda, Xitsonga, isiZulu, Sesotho (native names, locale codes en, af, ve, ts, zu, st). Choosing a persona routes into the app as that persona. The language choice persists and sets `<html lang>`. Picking a persona shows its starting state on the card (for example "Tight") so the demo has variety at a glance.
3. **Consent screen** (`/consent`): shown the first time a persona is entered (see section 9).
4. **Home** (`/app`): date hero, range band, state chip, Safe to spend today, 30-day timeline scrubber, next money, recent activity.
5. **Why this date** drawer, opened from Home: the inputs behind the date (opening balance, typical daily spend, bills due, expected income, history window used, confidence) with a small plain-language explanation and a mini chart.
6. **Plan** (`/app/plan`): What-if and Loan check. What-if: add or remove a one-off income or expense with an amount and date and see the new date and the change in days instantly. Loan check: enter an amount to lend, see days taken off cover, the new state, and a "Safe to lend up to" figure.
7. **Money** (`/app/money`): full transaction history with filters (income, spend, bills), detected recurring bills, and the Import statement entry point.
8. **Import statement** (`/app/money/import`): see section 8.
9. **Inbox** (`/app/inbox`): daily message preview, shown as a WhatsApp-style bubble with an SMS toggle, and a language switch. Banner: "Simulated. No message is sent." Messages are generated from templates in `src/messages/` behind a `MessageWriter` interface so an LLM implementation can replace it later. Respects the messaging consent toggle.
10. **Privacy centre** (`/app/privacy`) and its sub-pages: see section 9.
11. **Me** (`/app/me`): persona switcher, language, theme, About Tengo (name origin, how the forecast works in plain words, what is simulated), reset demo data.

Keep the language selector reachable from Me as well. Every page needs a sensible empty state, loading state and keyboard focus styles. Touch targets at least 44px. The scrubber is a proper slider with keyboard arrows and an ARIA label.

## 8. Statement upload (CSV, local only)

Build a CSV import that works fully in the browser and uploads nothing.
- Accept a CSV with a date, a description and an amount (negative for money out), or separate debit and credit columns. Detect common header names and let the user confirm the column mapping in a preview table.
- Provide a downloadable `sample-statement.csv` and a one-click "Use sample statement" button.
- Validate: skip bad rows with a visible count, require at least 14 days of data, warn below 28 days that the range will be wide.
- Classify each row as income, spend or recurring bill using simple transparent rules (recurring bill: same description and similar amount repeating at roughly monthly intervals).
- On confirm, replace the active persona's history in the local store, recompute the forecast, and route to Home. Add an audit log entry.
- Show a disabled "PDF statement (coming next)" option. Do not build PDF or OCR parsing. Add a line: "Processed on your device. Nothing leaves your browser."

## 9. POPIA simulation

Everything here is a simulation of good practice for a demo. It is not legal advice or a compliance certification. Show this label in the Privacy centre and on the consent screen: "Simulated privacy controls. Not a compliance certification."

Build these features, all working against the local store and persisted per persona:
- **Notice and purpose**: the consent screen states what is collected, why, who can see it, where it is processed, and how long it is kept, in plain language.
- **Granular consent**: separate toggles for core forecast (required to use the app), daily messages, and optional product analytics (off by default, and no analytics actually runs). Each is withdrawable at any time and withdrawing changes app behaviour: messages off hides the Inbox preview behind a notice, withdrawing core forecast pauses the app on a "Forecast paused" screen with a way to resume or delete.
- **Data minimisation**: a panel listing exactly which fields the forecast uses (date, amount, description) and which it never uses.
- **Access and portability**: "See my data" view and an export button that downloads the persona's data as JSON and CSV.
- **Correction**: edit or recategorise a transaction, with an audit entry.
- **Deletion**: "Delete my data" with a confirm step, wipes the persona's records, writes a deletion receipt, and returns to the picker.
- **Retention**: a visible rule such as "Kept for 12 months, then removed", with the next removal date shown.
- **Automated decision transparency**: the Why this date drawer doubles as the explanation, plus a "Question this result" link that opens a short simulated human-review request form.
- **Security safeguards**: a plain summary (encryption in transit and at rest in a real deployment, access limited, test data only) and a simulated audit log of access and changes with timestamps.
- **Breach notification**: a template page showing what a notice to users would say, marked as a sample.
- **Cross-border processing**: a disclosure card stating where data is processed in this demo (on the device only).
- **Information Officer and complaints**: placeholder contact details clearly marked as placeholders, and a line pointing to the Information Regulator for complaints.

Do not quote section numbers of the Act in the UI.

## 10. Forecast engine

Pure TypeScript in `src/engine/`, no UI imports, fully unit tested with Vitest. Transparent and statistical, no black box.

Inputs: transaction history, current balance, today's date.

Method:
1. Split history into income, recurring bills (dated, known) and everyday spend.
2. Everyday spend: estimate the daily spend distribution from the last 60 days (fewer if thin). Use the median for the central path and the 80th and 20th percentile of rolling 7-day spend, scaled to daily, for the pessimistic and optimistic paths.
3. Income: estimate arrival cadence and typical amount from history (weekday pattern for daily earners, gaps between large deposits for lumpy earners). Produce an expected next-money date range (earliest, typical, latest plausible) and an amount range.
4. Runway: project the balance day by day with no new income beyond what is already in the account, subtracting known bills on their dates. The headline date is the day the central path reaches zero. The range band spans the pessimistic and optimistic zero dates.
5. State:
   - Enough: the pessimistic runway date is on or after the latest plausible next-money date.
   - Tight: the central runway covers the typical next-money date but the pessimistic one does not.
   - Short: the central runway ends before the typical next-money date. Headline reads "Short from Thu 16 Oct" with the gap in days.
6. Safe to spend today: (balance minus bills due before the latest plausible next-money date) divided by the days until that date, floored at 0, rounded down to the nearest R5.
7. Confidence: high at 60 or more days of history, medium at 28 to 59, low below 28. Low confidence widens the band (multiply spread by 1.5) and shows "Low confidence" on the range band.
8. Scrubber: for any day in the next 30 days, project the balance band (optimistic, central, pessimistic) including expected income at its typical timing, and show the cover state for that day.
9. What-if and loan check reuse the same engine with an adjusted starting balance or an extra dated transaction.

Write tests for: each state, thin data, a bill landing inside the window, safe-to-spend flooring and rounding, and the loan check delta.

## 11. Seed data

Deterministic generator with a seeded PRNG, so the same 90 days are produced every time, ending yesterday relative to the current date. Three fictional personas, labelled as fictional composites, with different earning patterns so all three states appear in the demo:
- **Thabo**, e-hailing driver, Tshwane. Daily and weekly payouts, fuel and car instalment, a monthly phone and insurance bill. Starts in Tight.
- **Lerato**, hairdresser, Mamelodi. Weekend-heavy income, product restocks, rent on the 1st. Starts in Enough.
- **Ayanda**, spaza shop owner, Tembisa. Lumpy cash takings, large stock purchases, electricity prepaid top-ups. Starts in Short.

Each persona has a name, role, a one-line situation, avatar built from initials and brand colours (no stock photos, no real faces).

## 12. Internationalisation

Set up i18next with six locale files (en, af, ve, ts, zu, st) with identical keys. For now every non-English file contains the English strings. Add a script `npm run i18n:check` that fails if any locale is missing a key or has extra keys. All UI strings go through `t()`. Format dates with `Intl.DateTimeFormat` using a locale map that currently resolves every language to en-ZA. Keep layouts tolerant of longer strings. A human will fill in translations later.

## 13. Quality bar

- TypeScript strict, no `any` without a comment.
- `npm run build`, `npm run test`, `npm run lint` and `npm run i18n:check` all pass before you call a phase done.
- Add `vercel.json` with an SPA rewrite so the app can be deployed to Vercel later.
- Lighthouse-style basics: semantic HTML, labelled inputs, visible focus, sensible page titles.
- README covering: what Tengo is, how to run it, the forecast method in plain words, what is simulated, the licence note for Public Stunt, the name-origin TODO, and known limitations.

## 14. Phases

1. Scaffold, tokens, fonts, logo component using the supplied files, routing shell, responsive layouts (sidebar and bottom bar).
2. Forecast engine, seed data, unit tests.
3. Landing, picker, Home with scrubber and Why this date.
4. Plan (what-if, loan check), Money, Import statement.
5. Consent and the full Privacy centre.
6. Inbox, Me, i18n plumbing, empty and error states.
7. Polish pass: motion, contrast script, Playwright screenshots at four widths, fix everything you find, README.

After each phase, summarise in three lines what exists and what is next. If you hit a real ambiguity, choose the most reasonable option, note it in the README under "Decisions", and keep going.
