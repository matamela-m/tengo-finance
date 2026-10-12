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
| `npm run test` | Vitest unit tests (engine, seeds, CSV, messages, repository, formatting) |
| `npm run lint` | ESLint plus a check that no em or en dash appears anywhere |
| `npm run i18n:check` | Fails if any locale is missing a key, has extra keys, or uses an exclamation mark |
| `npm run contrast` | WCAG contrast check of every text and surface pair the UI uses |
| `npm run screens` | Playwright: screenshots at 390, 768, 1280 and 1600px into `screenshots/`, plus end to end flow tests |
| `npm run icons` | Rebuilds favicons from the supplied mark (macOS, uses `sips`) |

Playwright needs a browser once: `npx playwright install chromium`. Set `SCREENS=home-thabo,landing` or `WIDTHS=390` to capture a subset.

`vercel.json` has an SPA rewrite, so the build deploys to Vercel as is.

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

## Brand, type and licences

- Logos in `public/brand/` are the founder supplied PNGs, copied unchanged from `assets/brand/`. `<TengoLogo />` only chooses a file. Favicons and app icons are the light mark, scaled and padded. The `<CoverBars />` gauge is a separate UI element, upright bars unlike the slanted logo mark.
- Inter Variable is self-hosted through `@fontsource-variable/inter`.
- **Public Stunt licence.** The free Public Stunt version is for personal use only. A commercial licence is required before public launch.
- **Public Stunt file is missing.** No font file was supplied (there was no `assets/fonts/` folder). `@font-face` points to `public/fonts/public-stunt.woff2` (and `.woff`). Until the file is added there, display text falls back to Inter. If the supplied file is OTF or TTF, convert it with `woff2_compress` (from Google's woff2 tools) first.
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

Six locale files with identical keys: English, Afrikaans, Tshivenda, Xitsonga, isiZulu and Sesotho (`en af ve ts zu st`). Every non-English file currently holds the English strings, waiting for a human translator. `node scripts/i18n-sync.mjs` copies new English keys into the other files without touching existing translations. Dates use `Intl.DateTimeFormat` with a locale map that resolves every language to `en-ZA` for now. Public Stunt is never relied on for translated headings, since it lacks Tshivenda letters such as ḓ ḽ ṅ ṋ ṱ. The font stack falls back to Inter.

## Decisions

Choices made where the brief left room:

- **Asset locations.** The brief pointed at `docs/BRIEF.md`, `assets/brand/` and `assets/fonts/`. The brief was at the root and the logos came as `tengo-brand-trimmed.zip`, extracted to `assets/brand/`. No font file was supplied (see above).
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
- **Message templates.** Template strings live in the locale files under `messages.*`, so the i18n check covers them. `src/messages/templates.ts` composes them.
- **Retention.** The next removal date is the oldest stored transaction plus 12 months.
- **Dark theme.** Built as the stretch goal on the same tokens, selectable in Me.

## Known limitations

- The Public Stunt font file is not included, so display text renders in Inter until it is added.
- Translations are placeholders in English.
- The forecast is statistical and simple by design. It does not model seasonality, month-end effects or income that is changing over time.
- Recurring bill detection needs at least two monthly occurrences. A new bill shows as spend until the user recategorises it.
- CSV import handles common South African formats (day first dates, R amounts, debit and credit columns). It does not handle multi-currency files or PDF statements. PDF is shown as "coming next".
- Data lives in one browser's local storage. Clearing site data removes it.
- Favicon generation uses macOS `sips`. The generated icons are committed.
- Privacy features are a simulation and have not been reviewed by a lawyer.
