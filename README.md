# Tengo

**Money you can plan around.**

A balance tells you what you have. Tengo tells you until when.

Tengo is a money app for people with irregular income: drivers, hairdressers, spaza shop owners and anyone paid in lumps, by the day or by the weekend. It answers one question: is my money enough until the next money? The answer comes date first, for example "Enough until Thu 23 Oct", with a likely range, a "Safe to spend today" figure and a cover state of Enough, Tight or Short.

Built for the FNB App of the Year hackathon, track: Financial inclusion and money confidence.

> This is a demo with fictional data only. There is no bank connection, no real personal information and no open banking. Every person in it is a fictional composite.

## Run it

Requires Node 20 or later.

```bash
npm install
npm run dev          # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run build` | Type checks and builds to `dist/` |
| `npm run test` | Contrast check for both themes, then Vitest unit tests (engine, seeds, CSV, messages, repository, formatting) |
| `npm run lint` | ESLint plus a check that no em or en dash appears anywhere |
| `npm run i18n:check` | Fails if any of the 11 locales is missing a key, has extra keys, or uses an exclamation mark |
| `npm run i18n:sync` | Copies new or changed English strings into the other locale files |
| `npm run i18n:translate` | Machine translates the locale files with the Google Cloud Translation API (needs `GOOGLE_TRANSLATE_API_KEY`) |
| `npm run a11y` | axe-core accessibility checks (WCAG 2.1 A and AA) on every main page, light and dark |
| `npm run contrast` | WCAG contrast check of every text and surface pair the UI uses |
| `npm run screens` | Playwright: screenshots at 390, 768, 1280 and 1600px into `screenshots/`, plus end to end flow tests |
| `npm run icons` | Rebuilds the placeholder favicons and app icons (needs Python with Pillow: `pip install pillow`) |
| `npm run fonts:check` | Checks every locale string against Inter (fails on gaps) and Figtree (warns on gaps) |

**On your phone (same Wi-Fi):** run `npm run dev:phone`, then open the "Network" address it prints (for example `http://192.168.1.20:5173`) in your phone's browser. If macOS asks whether Node may accept incoming connections, choose Allow.

Playwright needs a browser once: `npx playwright install chromium`. Set `SCREENS=home-thabo,landing` or `WIDTHS=390` to capture a subset.

`vercel.json` has an SPA rewrite, so the build deploys to Vercel as is.

## Redesign

A restyle of the existing app: same engine, data, routes, i18n, consent and privacy logic, PWA and tests, with a new visual system.

**Baseline (before the redesign).** Tokens lived in `src/styles/index.css` as CSS variables (`--c-bg`, `--c-surface`, state colours) plus a fixed brand palette in `tailwind.config.js` (white, off-white, mint, sage, deep green, charcoal) used directly in about 60 class names. The old logo PNGs were used through `TengoLogo` in the app shell, landing, picker, consent, inbox and not-found pages. Public Stunt was used for display text through the `font-display` class in 10 files. A few colours were hard-coded (theme-color meta, Inbox chat, landing sparkline, Why drawer chart). The suite was green: build, 66 unit tests, lint, i18n check and 129 Playwright tests, including axe.

**Plan.**
1. Baseline and this plan.
2. New tokens for dark and light, Figtree and Inter, a three-way theme toggle with no flash on load, the old logo and Public Stunt removed, one `Brand` component, contrast checks for both themes.
3. Shared primitives: card, button, badge, state chip, cover gauge, stat tile, section label, icon tile, inputs, toast, drawer, table, empty state, skeleton.
4. Landing and picker.
5. App shell and Home, including the chart.
6. Plan, Money, Import, Inbox, Privacy, Me.
7. Polish, motion, screenshots in both themes, README.

## How the forecast works, in plain words

All of it lives in `src/engine/`: pure TypeScript, no UI imports, unit tested.

1. **Sort the history.** Every transaction is income, a recurring bill or everyday spend. A recurring bill is the same description with a similar amount (within 20%) repeating 24 to 36 days apart.
2. **Everyday spend.** Take the last 60 days (fewer if that is all there is) and add up spending over every rolling 7 day stretch. The middle value, divided by 7, is the usual daily spend. The 80th percentile is a heavy week and the 20th a light week.
3. **Next money.** Deposits of at least 10% of typical monthly income count as "next money". If most of them land on one weekday (Lerato's Saturdays, Thabo's Monday payout), the next one is the next such weekday, possibly a day late. Otherwise the gaps between deposits give an earliest, typical and latest date (Ayanda's lumpy cash). Amounts give a low, typical and high figure.
4. **Runway.** Start from today's balance and run it down day by day at the daily spend rate, taking off known bills on their dates. Money not yet received is not counted. The day the normal path reaches zero is **the date**. The heavy and light paths give the range band.
5. **Cover.**
   - **Enough**: even the heavy week lasts until the latest likely next money.
   - **Tight**: a normal week reaches the typical next money, a heavy week does not.
   - **Short**: a normal week runs out first. The headline then reads "Short from" with the gap in days.
6. **Safe to spend today**: balance minus bills due before the latest likely next money, divided by the days until then, floored at zero and rounded down to the nearest R5.
7. **Confidence**: high with 60 or more days of history, medium with 28 to 59, low below 28. Low confidence widens the band by 1.5 times and shows "Low confidence".
8. **Scrubber**: for each of the next 30 days, the light, normal and heavy balance including expected income at its usual timing, and the cover for that day.
9. **What-if and loan check** rerun the same engine with an extra dated item or a lower starting balance.

The "Why this date" drawer on Home shows every input behind the date and doubles as the explanation of this automated result.

## What is simulated

- **People and money.** Thabo (e-hailing driver, Tshwane), Lerato (hairdresser, Mamelodi) and Ayanda (spaza shop owner, Tembisa) are fictional composites. Their 90 days of history come from a seeded generator, so they are the same every time and always end yesterday. They start in Tight, Enough and Short.
- **No bank.** No bank connection and no open banking. The CSV import reads a file in the browser and nothing is uploaded.
- **Messages.** The Inbox previews a daily WhatsApp or SMS message. Nothing is sent.
- **Privacy controls.** Consent, access, export, correction, deletion, retention, audit log, human review, breach notice and Information Officer details all work against local storage. They show good practice and are labelled "Simulated privacy controls. Not a compliance certification." They are not legal advice. The Information Officer contact is a placeholder.
- **Storage.** Everything is in this browser's local storage. All data access goes through the `TengoRepository` interface in `src/data/repository.ts`. Swap `LocalRepository` in `src/data/index.ts` for a hosted one (for example Supabase) without touching UI code.
- **Messages writer.** `MessageWriter` in `src/messages/` has a template implementation. An LLM-backed writer can implement the same interface.

## Brand and type

- **Logo: placeholder.** The founder is replacing the logo. The old PNGs are archived in `assets/archive/old-brand/` (not served, not bundled). Every place the brand appears uses one component, `src/components/Brand.tsx`: a "Tengo" wordmark in Figtree 700, and a `mark` variant (a rounded accent square with a bold T). Swap that one file for the final logo.
- **Icons: placeholders.** Favicons, the SVG favicon and the PWA icons are the T mark in the accent colour, made by `npm run icons` (Python with Pillow). Replace them with the final logo.
- **Fonts.** Figtree for headings, display numbers, buttons and nav. Inter for body text, labels, inputs and tables. Both are self-hosted through `@fontsource-variable`. Money and dates use tabular numbers.
- **Tshivenda.** Figtree has no Tshivenda letters (ḓ ḽ ṅ ṋ ṱ). The heading font is a CSS variable, and when the language is Tshivenda (`html[lang="ve"]`) headings switch to Inter, so a word never mixes two fonts. `npm run fonts:check` scans every locale string against both fonts: it fails if Inter lacks a character and warns about Figtree gaps.
- No third-party requests at runtime and no analytics scripts. A Playwright test checks this.

## Name origin

Tengo comes from "mutengo", Tshivenda for value. This was supplied by the founder.

- [ ] **TODO: confirm the meaning with a Tshivenda speaker before submission.**

## Colour and contrast

State colours are bright fills (Enough #2FB36B, Tight #E8A33D, Short #C8553D). Text and icons on light surfaces use darker variants (#17703F, #8A5300, #A33A25). Every state shows a colour, a word and an icon. The Short fill never carries small text: charcoal on it is 3.83:1, enough only for large text and icons. Run `npm run contrast` for the full check. Final pairs:

| Pair | Foreground | Background | Ratio | Target |
| --- | --- | --- | --- | --- |
| Body text on off-white | #1E1E1E | #EEEBE6 | 14.02:1 | 4.5:1 |
| Body text on white | #1E1E1E | #FFFFFF | 16.67:1 | 4.5:1 |
| Off-white text on charcoal | #EEEBE6 | #1E1E1E | 14.02:1 | 4.5:1 |
| Muted text on off-white | #5A5A55 | #EEEBE6 | 5.83:1 | 4.5:1 |
| Muted text on white | #5A5A55 | #FFFFFF | 6.93:1 | 4.5:1 |
| Muted text on charcoal | #B9B5AE | #1E1E1E | 8.16:1 | 4.5:1 |
| Deep green text on off-white | #125747 | #EEEBE6 | 7.12:1 | 4.5:1 |
| Deep green text on white | #125747 | #FFFFFF | 8.47:1 | 4.5:1 |
| White text on deep green (buttons) | #FFFFFF | #125747 | 8.47:1 | 4.5:1 |
| Mint text on charcoal | #B6DFB2 | #1E1E1E | 11.26:1 | 4.5:1 |
| Charcoal text on mint | #1E1E1E | #B6DFB2 | 11.26:1 | 4.5:1 |
| Charcoal text on sage (large/UI only) | #1E1E1E | #7AAB88 | 6.36:1 | 3:1 |
| Enough text on off-white | #17703F | #EEEBE6 | 5.16:1 | 4.5:1 |
| Enough text on white | #17703F | #FFFFFF | 6.13:1 | 4.5:1 |
| Enough text on soft enough | #17703F | #DDF3E4 | 5.26:1 | 4.5:1 |
| Tight text on off-white | #8A5300 | #EEEBE6 | 5.32:1 | 4.5:1 |
| Tight text on white | #8A5300 | #FFFFFF | 6.33:1 | 4.5:1 |
| Tight text on soft tight | #8A5300 | #FBEBD2 | 5.40:1 | 4.5:1 |
| Short text on off-white | #A33A25 | #EEEBE6 | 5.54:1 | 4.5:1 |
| Short text on white | #A33A25 | #FFFFFF | 6.58:1 | 4.5:1 |
| Short text on soft short | #A33A25 | #F6DDD7 | 5.09:1 | 4.5:1 |
| Charcoal text on Enough fill | #1E1E1E | #2FB36B | 6.18:1 | 4.5:1 |
| Charcoal text on Tight fill | #1E1E1E | #E8A33D | 7.73:1 | 4.5:1 |
| Charcoal large text on Short fill | #1E1E1E | #C8553D | 3.83:1 | 3:1 |
| Enough icon (text variant) on white | #17703F | #FFFFFF | 6.13:1 | 3:1 |
| Tight icon (text variant) on white | #8A5300 | #FFFFFF | 6.33:1 | 3:1 |
| Gauge outline (enough) on off-white | #17703F | #EEEBE6 | 5.16:1 | 3:1 |
| Enough fill as UI icon on charcoal | #2FB36B | #1E1E1E | 6.18:1 | 3:1 |
| Tight fill as UI icon on charcoal | #E8A33D | #1E1E1E | 7.73:1 | 3:1 |
| Short fill as UI icon on off-white | #C8553D | #EEEBE6 | 3.66:1 | 3:1 |
| Short fill as UI icon on white | #C8553D | #FFFFFF | 4.35:1 | 3:1 |
| Short fill as UI icon on charcoal | #C8553D | #1E1E1E | 3.83:1 | 3:1 |
| Enough vs deep green (distinct hue check) | #2FB36B | #125747 | 3.14:1 | 1.5:1 |
| Avatar: mint initials on deep green | #B6DFB2 | #125747 | 5.72:1 | 3:1 |
| Avatar: charcoal initials on sage | #1E1E1E | #7AAB88 | 6.36:1 | 3:1 |
| WhatsApp bubble text on white | #1E1E1E | #FFFFFF | 16.67:1 | 4.5:1 |
| WhatsApp date pill text on chat bg | #5A5A55 | #E7DFD4 | 5.25:1 | 4.5:1 |
| Dark: body text on background | #EEEBE6 | #161616 | 15.22:1 | 4.5:1 |
| Dark: body text on surface | #EEEBE6 | #1E1E1E | 14.02:1 | 4.5:1 |
| Dark: muted text on surface | #B9B5AE | #1E1E1E | 8.16:1 | 4.5:1 |
| Dark: muted text on surface 2 | #B9B5AE | #262624 | 7.42:1 | 4.5:1 |
| Dark: brand text on surface | #B6DFB2 | #1E1E1E | 11.26:1 | 4.5:1 |
| Dark: charcoal on sage (active nav, buttons) | #1E1E1E | #7AAB88 | 6.36:1 | 4.5:1 |
| Dark: Enough text on surface | #6FD59B | #1E1E1E | 9.26:1 | 4.5:1 |
| Dark: Tight text on surface | #F2C27A | #1E1E1E | 10.14:1 | 4.5:1 |
| Dark: Short text on surface | #EF9A87 | #1E1E1E | 7.65:1 | 4.5:1 |
| Dark: Enough text on soft enough | #6FD59B | #1D3A29 | 6.91:1 | 4.5:1 |
| Dark: Tight text on soft tight | #F2C27A | #3D2F18 | 7.89:1 | 4.5:1 |
| Dark: Short text on soft short | #EF9A87 | #43231C | 6.45:1 | 4.5:1 |

## Translations

All 11 official written languages of South Africa: English, Afrikaans, isiNdebele, isiXhosa, isiZulu, Sepedi, Sesotho, Setswana, siSwati, Tshivenda and Xitsonga (`en af nr xh zu nso st tn ss ve ts`). Every file has the same keys. South African Sign Language is also an official language. It cannot be written as text, so it is out of scope for the locale files.

The language picker is a single labelled select showing the native and English name of each language. It says whether a language is still in English, machine translated, or checked by a first-language speaker (`src/i18n/status.json`).

**Machine translation with Google.** `npm run i18n:translate` sends the English strings to the Google Cloud Translation API and writes the results into the locale files. This happens at build time only. The app never calls Google while it runs, so the no-third-party-requests rule still holds.

1. In Google Cloud, create a project, enable the Cloud Translation API, and create an API key restricted to that API. A billing account is required, but the first 500,000 characters each month are free. All 10 languages take about 155,000 characters.
2. Run `GOOGLE_TRANSLATE_API_KEY=your-key npm run i18n:translate` (or name languages, for example `-- zu xh`).
3. Check with `npm run i18n:check` and commit the locale files.

The script protects `{{placeholders}}`, *bold* markers and names such as Tengo and WhatsApp. It keeps the demo chip exactly "Demo | Fictional Data", and replaces any em dash, en dash or exclamation mark the translation brings in. Any string whose placeholders change stays in English. It remembers which English text each translation came from (`src/i18n/translated-from.json`), so only new or changed strings are sent next time. Machine translations still need checking by first-language speakers. Mark a language `reviewed` in `status.json` once that is done.

Dates use `Intl.DateTimeFormat` with a locale map that resolves every language to `en-ZA` for now. Headings switch from Figtree to Inter for Tshivenda (see Brand and type).

## Accessibility

- Every page passes axe-core WCAG 2.1 A and AA checks in light and dark themes (`npm run a11y`).
- A skip link. Route changes move focus to the main content and announce the new page.
- One polite live region announces saves, exports and consent changes, with a matching visual toast.
- Choice rows (filters, money in or out, WhatsApp or SMS) are native radio groups, so arrow keys work.
- The 30 day chart is a native slider with a full spoken value ("Tuesday 20 October, about R1 250, Tight"), plus a "Show numbers" table.
- Dates are read in full and amounts as "money in" or "money out". Decorative gauges and icons are hidden from screen readers. Every state has a word and an icon, not just a colour.
- Drawers trap focus, close on Escape and hide the page behind them. Form errors are shown in text and linked to their fields.
- Visible focus, 44px touch targets, reduced motion respected, contrast checked by script and by axe.

## Premium features

- **What helps most** (Home): for Short or Tight, the smallest extra amount, the daily spending cut, or a bill to move that would lift the cover one level. For Enough, how much could be set aside. Uses the same engine as the date (`src/engine/help.ts`).
- **Where everyday money goes** (Money): last 30 days of spending in plain groups, by simple keyword rules (`src/engine/spending.ts`).
- **Installable and offline**: a small service worker (`public/sw.js`) caches the app after the first visit. It is same-origin only.
- **Motion**: the Safe to spend figure counts up and the date hero animates in. Both respect reduced motion.
- **Phone testing**: `npm run dev:phone` serves the app on your local network.

## Decisions

Choices made where the brief left room:

- **Redesign references.** The redesign brief points at reference screenshots in `assets/reference/`. That folder does not exist, so the style follows the brief's written description only.

- **Asset locations.** The first brief pointed at `docs/BRIEF.md`, `assets/brand/` and `assets/fonts/`. The brief was at the root and the logos came as `tengo-brand-trimmed.zip`. Those logos are now archived (see Brand and type).
- **Spend paths.** The central path uses the median of rolling 7 day spend divided by 7 (not the median single day), so it uses the same basis as the 20th and 80th percentile paths and copes with lumpy spending such as stock runs.
- **What counts as next money.** Deposits of at least 10% of typical monthly income. Smaller daily income (cash fares, card sales) is not "next money". The scrubber still includes it as background income (full rate on the normal and light paths, half on the heavy path).
- **Weekday payouts.** At least 3 qualifying deposits with 60% on one weekday. The latest plausible date is one day after the typical one. Next money is always after today, since anything that landed today is already in the balance.
- **No income pattern found.** Tengo plans 30 days ahead and says so.
- **"Reaches zero".** The first day the end-of-day balance is zero or below. That is the headline date.
- **Headline versus scrubber.** The headline counts only money already in the account. The scrubber assumes income lands as usual, so on a given day it can show Enough while the headline says Short. The scrubber is labelled "If money lands as usual". Its per-day cover is Enough if the heavy path is above zero, Tight if only the normal path is, Short otherwise.
- **Safe to lend.** The largest amount, in R10 steps, that keeps the current cover state. Zero when already Short.
- **Persona balances.** Each persona's balance is picked with the engine so the intended start state holds on any date (tested over 40 consecutive days). Seed data refreshes daily until the user imports or corrects something.
- **Old statements.** A CSV that ends more than 3 days ago has its dates moved forward to end yesterday, with a visible note. Otherwise the 60 day spend window would be empty.
- **Mobile navigation.** The bottom bar has five tabs (Home, Plan, Money, Inbox, Me). Privacy is the shield icon in the top bar and is linked from Me, Inbox and the consent flow. The desktop sidebar has all six.
- **Paused forecast.** With core consent withdrawn, Privacy and Me stay open so people can still see, export or delete their data. Every other page shows "Forecast paused".
- **Picker states.** Persona cards show each persona's designed starting state.
- **Spending groups.** Descriptions are now also used to group everyday spending. The data minimisation panel says so.
- **Premium suggestions.** "What helps most" aims one level up: Short to Tight, Tight to Enough. A bill is only suggested if moving it alone is enough.
- **Message templates.** Template strings live in the locale files under `messages.*`, so the i18n check covers them. `src/messages/templates.ts` composes them.
- **Retention.** The next removal date is the oldest stored transaction plus 12 months.
- **Dark theme.** Built as the stretch goal on the same tokens, selectable in Me.

## Known limitations

- The logo and app icons are placeholders until the founder's new logo is ready.
- Translations stay in English until the translate script is run with a Google API key, and machine translations still need review by first-language speakers.
- The forecast is statistical and simple by design. It does not model seasonality, month-end effects or income that is changing over time.
- Recurring bill detection needs at least two monthly occurrences. A new bill shows as spend until the user recategorises it.
- CSV import handles common South African formats (day first dates, R amounts, debit and credit columns). It does not handle multi-currency files or PDF statements. PDF is shown as "coming next".
- Data lives in one browser's local storage. Clearing site data removes it.
- Icon generation needs Python with Pillow. The generated icons are committed.
- Privacy features are a simulation and have not been reviewed by a lawyer.
