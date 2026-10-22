# Tengo

**Money you can plan around.** A balance tells you what you have. Tengo tells you until when.

Tengo is a money app for people paid irregularly: drivers, hairdressers, spaza shop owners, domestic workers and anyone paid by the trip, the client or the till. It answers one question, date first: is my money enough until the next money? For example "Tight until Tue 27 Oct", with a likely range, a daily budget and one state: Enough, Tight, Short, or Not enough to tell.

Built for the FNB App of the Year hackathon (financial inclusion and money confidence). Tengo is a pilot, not a bank, and gives estimates, not financial advice. It has no partnership with any bank.

## Three ways to use it

| Mode | What it is | Where the data lives |
| --- | --- | --- |
| Fictional people | Thabo, Lerato and Ayanda, made-up composites with seeded money histories. Always labelled "Demo, Fictional Data". | This browser |
| Your own money, as a guest | "Use your own money" on the picker: import a CSV statement, answer a few questions, or try labelled sample numbers. No sign-up. Labelled "Your profile, This device only". | This device only (`tengo.profile.v1`) |
| Your own money, saved to an account | Optional, offered after a guest has seen value. Passwordless one-time code, 18 or older checkbox. Labelled "Your profile, Saved to your account". | Supabase, with row-level security. The forecast still runs on the phone. |

## Run and test

Requires Node 20 or later. Accounts are optional: with no environment variables the app runs fully as a guest.

```bash
npm install
npm run dev            # http://localhost:5173
npm run dev:phone      # same, on your local network for a phone
```

| Command | What it does |
| --- | --- |
| `npm run build` | Type checks and builds to `dist/` (warns while the privacy notice placeholders are unset) |
| `npm test` | Contrast check, then all unit tests, including the stress cases and the accuracy regression test |
| `npm run coverage` | Unit coverage across `src`, with a 40 percent floor |
| `npm run lint` | ESLint, the em and en dash check, and the secrets check |
| `npm run i18n:check` | Same keys in all 11 locales, no exclamation marks, matching placeholders, NFC text, plural forms and valid review status |
| `npm run i18n:sync` | Copies new or changed English strings into untranslated locales |
| `npm run i18n:translate` | Machine translation with Google Cloud Translation, only with your key; never Tshivenda; never marks anything reviewed |
| `npm run fonts:check` | Every locale string is covered by the fonts |
| `npm run contrast` | WCAG contrast of every colour pair, plus Tight and Short hue separation |
| `npm run budget` | Fails if a first visit downloads more than 142 KB of JavaScript, gzipped |
| `npm run test:rls` | Runs the Supabase migration and the two-user row-level security tests on a throwaway local Postgres |
| `npx playwright test` | Flows, own profile, accounts, safety, phone layout, offline, headers and axe in both themes |

Playwright needs Chromium once: `npx playwright install chromium`. Account tests use an in-memory account server that only switches on at localhost.

To deploy and turn on accounts, follow `docs/SETUP-SUPABASE.md`. Environment variables are listed in `.env.example`.

## How the forecast works, in plain words

All of it lives in `src/engine/`: pure TypeScript, no UI imports, unit tested.

1. **Sort the history.** Every transaction is income, a recurring bill or everyday spend. A recurring bill is the same description with a similar amount (within 35%, so a price rise still matches) repeating 24 to 36 days apart; one skipped month (52 to 70 days) still counts. A bill is projected at the larger of its last two amounts.
2. **Leave out one-offs.** Anything the person marks as a one-off, money in that reads as a loan, refund, reversal or advance (a configurable word list), and very large amounts seen only once (more than five usual spending days, or four usual income days) are left out of usual spend and the income pattern. They stay in the balance. Under 45 days of history a large spend may be a habit, so it still counts and Home asks "Was this a one-off?".
3. **Everyday spend.** Take the last 60 days (fewer if that is all there is) and add up spending over every rolling 7 day stretch. The middle value, divided by 7, is the usual daily spend. The 80th percentile is a heavy week and the 20th a light week. Under 45 days the usual spend is never below the plain average of all outflows, so a monthly bill seen once is not missed. If at least two month ends show spending 30% above other days, days from the 25th use that uplift; without enough history, the heavy path is 25% heavier from the 25th.
4. **Next money.** Deposits of at least 10% of typical monthly income count as "next money". If most of them land on one weekday, the next one is the next such weekday, possibly a day late. Otherwise the gaps between deposits (10th to 90th percentile) give an earliest, typical and latest date. Amounts give a low, typical and high figure. Smaller deposits are background income.
   - **Payday today**: if the usual payment is due today and has not landed, it is still expected today ("It has come in" records it).
   - **Paused**: if nothing significant has landed for more than two usual gaps, income is paused. No next money is counted and the state is judged over the next 30 days.
   - **Irregular or none**: with no rhythm, or no income at all, no next-money date is invented.
5. **Missed bills.** A recurring bill more than 3 days past its due date with no payment shows as "Rent looks unpaid". The person answers: still owe it (counted as due today) or paid or stopped.
6. **Runway.** Start from the balance and run it down day by day at the daily spend rate, taking off known bills on their dates and adding a share of background income: all of it on the light path, half on the usual path, a quarter on the heavy path, and none without a regular rhythm and 28 days of history. The chart uses the same shares. Next money is not counted. The day the usual path reaches zero is **the date**.
7. **Band.** The likely range runs from the heavy-path date to the light-path date, widened to at least 1 day plus 15% of the lead time either side (3 days plus 15% at low confidence) and capped at half the lead plus 2 days. The constants were tuned on the review's synthetic backtest, with no hold-out set. On that data the range covers the actual date about 80% of the time overall. Near run-out the result depends on how the starting balances are chosen: about 79% on the rerun cases, about 54% on the balances both builds share (`docs/review/after/COMPARISON.md`, `docs/review/after/data-scientist.md`).
8. **Cover.**
   - **Enough**: even the heavy week lasts until the latest likely next money with the reserve (step 9) untouched. Never under 28 days of history.
   - **Tight**: a normal week reaches the typical next money, a heavy week does not, or only by eating into the reserve.
   - **Short**: a normal week runs out first. The headline then reads "Short from" with the gap in days.
   - **Not enough to tell**: under 14 days of history, no income at all, or a balance more than 14 days old.
9. **Daily budget.** Bills due in the week after the latest next money, less a low next payment, are kept back as a reserve. The budget is the balance less bills before next money and the reserve, spread over the days until the latest likely next money, rounded down to R5. Home shows it only for Enough and Tight; Short shows "Not advised".
10. **Room to lend.** The largest amount, in R10 steps, that keeps the state and a budget above zero. Zero when Short, unsure (low confidence, paused or irregular income) or not enough to tell.
11. **Overdraft and old statements.** A negative balance shows how far overdrawn. An imported statement is forecast as of its end date and Home asks for today's balance; confidence drops after 3 days and the state is hidden after 14.
12. **Confidence**: high with 60 or more days of history, medium with 28 to 59, low below 28 or with paused or irregular income. Low confidence widens the heavy and light paths by 1.5 times.
13. **Scrubber**: for each of the next 30 days, the light, usual and heavy balance including expected income at its usual timing. It describes the balance (above R0, could reach R0, below R0), never the cover state.
14. **What-if and loan check** rerun the same engine with an extra dated item or a lower starting balance.

Every Home element reads one view model, `homeView()` in `src/engine/view.ts`, so the headline, chip, gauge, budget, next-money date, chart and messages cannot disagree. (The chart's Today point and the budget card's Total can still differ; the re-review asks for labels, UX-A1.) `src/engine/stress.test.ts` keeps the review's stress cases as regression tests and `src/engine/accuracy.test.ts` fails the build if backtest accuracy drops below stated thresholds.

The "Why this date" drawer on Home shows every input behind the date and doubles as the explanation of this automated result.

## What is real and what is simulated

| Real | Simulated or not yet built |
| --- | --- |
| The forecast engine, on every mode | The fictional people and their money |
| Your own profile on this device, with export and deletion | Daily messages: previewed in the Inbox, never sent |
| Optional accounts on Supabase with row-level security, a server consent log, server export and real deletion | Product analytics: off, and nothing runs |
| PIN lock, discreet mode, quick exit | Human review of a result: the request is recorded, nobody replies yet |
| 12 month retention, enforced on open and by a server function | The breach notice: a sample |
| Offline after the first visit | Translations: English plus 10 unreviewed AI drafts |

## Security and privacy

- **Guest:** everything stays in this browser on this device; nothing is sent. Optional PIN lock (PBKDF2, salted, never the PIN itself), discreet mode and quick exit for shared phones.
- **Account:** passwordless one-time codes, a 60 second code cooldown on top of Supabase's rate limits, short sessions and "sign out everywhere". Row-level security on every table so a person reads and writes only their own rows; logs are append only. `delete_my_account()` removes every row and the sign-in and returns a receipt with no personal data. Only the public anon key is in the browser; `npm run lint` and CI (gitleaks) fail on secrets.
- **Never collected:** ID numbers, phone numbers, bank logins or PINs. Long numbers in imported descriptions are masked. Audit entries hold no descriptions or amounts. Local diagnostics keep only an error's name, kind, route pattern and time.
- **Headers:** CSP allowing only this site and the Supabase host, no frames, no referrer, a strict permissions policy and HSTS (`vercel.json`), checked on the built app.
- **Offline cache:** only the app's own files; never data. Each build stamps a version into `sw.js`, so a redeploy replaces the cached build (tested in `tests/deploy.spec.ts`).
- **Not indexed:** `robots.txt` disallows crawling and every page sends `noindex`, while Tengo is a pilot.
- **Notice and terms:** drafts at `/privacy-notice` and `/terms` for a lawyer to review. The responsible party and Information Officer come from environment variables and must be filled before launch. Tengo makes no claim of POPIA compliance or certification.

## Accessibility

- Zero axe WCAG 2.1 A and AA violations on every route in both themes at 390 and 1280 px.
- State is never shown by colour alone: every state has a word and an icon, and Tight and Short use clearly different hues in both themes.
- Page language is the language of the shown text. Inputs are 16 px on phones, focus scrolls clear of the sticky bars, there is no sideways panning, and the chart is a native slider with a full spoken value and a table.
- Form field borders are at least 3:1. Reduced motion is respected.

## Translations

11 languages: English is the source and the other 10 are complete AI drafts that no first-language speaker has checked yet. The app labels each draft "AI draft" in the language picker, sets the page language to match, and keeps the demo chip in English. Drafts go in through `scripts/import-drafts.mjs`, which rejects any string that loses a placeholder, a protected word such as STOP, or the house rules, and marks every imported string `machine` in `src/i18n/review-status.json`; nothing is ever marked reviewed except by a person. Draft money terms are listed per language in `src/i18n/glossary.json` for translators to confirm. `tests/languages.spec.ts` checks every drafted language on a phone for overflow, page language, leaked keys and axe. Dates use local month and day names only in Afrikaans and isiZulu, where the browser's data is complete; the rest keep English-style dates. Expect the weakest drafts in isiNdebele, siSwati, Xitsonga and Tshivenda. To see a page in one language: `node docs/tools/lang-shot.mjs zu /app out.png` with `vite preview` running. Only English is bundled; other languages load when chosen.

## Brand and placeholders to replace

- Logo: `src/components/Brand.tsx` (a text wordmark and a T mark) and `public/icons/*` (made by `npm run icons`). Replace with the final logo.
- Responsible party, address, Information Officer and privacy email: environment variables (`.env.example`).
- Help numbers on `/safety`: to confirm before launch.
- Translations: see `docs/HUMAN-ACTIONS.md`.
- The name story ("mutengo") is off until two Tshivenda speakers confirm it (`VITE_SHOW_NAME_STORY`).

## Decisions

- **Guest first.** Value in about a minute with no sign-up; an account only after that, as a choice. Account data wins on another device; replacing it is explicit.
- **The engine never runs on a server.** The account only stores data.
- **Account tests without Docker.** Docker was not running, so the policies are tested at the SQL level on a local Postgres and the app against an in-memory server with the same rules.
- **Small daily income counts in the headline** at half on the usual path, as in the chart, because the brief asked for consistency. This makes the headline a little later than an outflows-only date; `docs/review/after/COMPARISON.md` shows both measures.
- **Under 45 days of history a big spend still counts** and the person is asked whether it was a one-off, because leaving out a habit makes the date too late.
- **Plan opens with a labelled example** rather than empty, as build 2 asked, which differs from the review's suggestion.
- **Business model unchanged by the build**: see `docs/business-case.md`.

## Known limitations

- Every accuracy number is from synthetic data written by the same author as the engine. No real statements have been tested.
- Lumpy outflows (stock runs) are a daily rate, not events. Weekday effects are not modelled. The first missed payday is caught only after two usual gaps.
- Recurring bills need two monthly payments to be recognised; weekly bills are not detected.
- English only. The comprehension sessions, legal review and operator agreements have not happened.
- Guest data lives in one browser; clearing site data removes it.

## Colour and contrast

| Token | Dark | Light |
| --- | --- | --- |
| bg | #0B0B0C | #FBFBFA |
| surface-1 / 2 / 3 | #121214 / #18181B / #1F1F23 | #FFFFFF / #F4F3F1 / #ECEAE6 |
| border / border-strong | #26262B / #34343A | #E7E5E1 / #D6D3CD |
| text / muted / subtle | #F4F4F5 / #A1A1AA / #8B8B94 | #1C1B19 / #66635D / #6C6963 |
| accent / on-accent | #7291FF / #0B0B0C | #3755CC / #FFFFFF |
| enough / tight / short | #34D399 / #FBBF24 / #F97362 | #046E50 / #855700 / #B42318 |
| field border | #6E6E78 | #86837B |
| soft fills | state colour at 13%, accent at 14% | state colour at 10%, accent at 10% |

Measured by `npm run contrast` (also part of `npm test`):

| Theme | Pair | Foreground | Background | Ratio | Target |
| --- | --- | --- | --- | --- | --- |
| dark | Text on bg | #F4F4F5 | #0B0B0C | 17.90:1 | 4.5:1 |
| dark | Muted text on bg | #A1A1AA | #0B0B0C | 7.68:1 | 4.5:1 |
| dark | Subtle text on bg | #8B8B94 | #0B0B0C | 5.83:1 | 4.5:1 |
| dark | enough text on bg | #34D399 | #0B0B0C | 10.23:1 | 4.5:1 |
| dark | tight text on bg | #FBBF24 | #0B0B0C | 11.79:1 | 4.5:1 |
| dark | short text on bg | #F97362 | #0B0B0C | 7.17:1 | 4.5:1 |
| dark | Text on surface-1 | #F4F4F5 | #121214 | 17.02:1 | 4.5:1 |
| dark | Muted text on surface-1 | #A1A1AA | #121214 | 7.30:1 | 4.5:1 |
| dark | Subtle text on surface-1 | #8B8B94 | #121214 | 5.54:1 | 4.5:1 |
| dark | enough text on surface-1 | #34D399 | #121214 | 9.73:1 | 4.5:1 |
| dark | tight text on surface-1 | #FBBF24 | #121214 | 11.21:1 | 4.5:1 |
| dark | short text on surface-1 | #F97362 | #121214 | 6.82:1 | 4.5:1 |
| dark | Text on surface-2 | #F4F4F5 | #18181B | 16.12:1 | 4.5:1 |
| dark | Muted text on surface-2 | #A1A1AA | #18181B | 6.91:1 | 4.5:1 |
| dark | Subtle text on surface-2 | #8B8B94 | #18181B | 5.25:1 | 4.5:1 |
| dark | enough text on surface-2 | #34D399 | #18181B | 9.22:1 | 4.5:1 |
| dark | tight text on surface-2 | #FBBF24 | #18181B | 10.61:1 | 4.5:1 |
| dark | short text on surface-2 | #F97362 | #18181B | 6.46:1 | 4.5:1 |
| dark | Text on surface-3 | #F4F4F5 | #1F1F23 | 14.94:1 | 4.5:1 |
| dark | Muted text on surface-3 | #A1A1AA | #1F1F23 | 6.41:1 | 4.5:1 |
| dark | Subtle text on surface-3 | #8B8B94 | #1F1F23 | 4.86:1 | 4.5:1 |
| dark | enough text on surface-3 | #34D399 | #1F1F23 | 8.54:1 | 4.5:1 |
| dark | tight text on surface-3 | #FBBF24 | #1F1F23 | 9.84:1 | 4.5:1 |
| dark | short text on surface-3 | #F97362 | #1F1F23 | 5.99:1 | 4.5:1 |
| dark | Accent link on bg | #7291FF | #0B0B0C | 6.75:1 | 4.5:1 |
| dark | Accent link on surface-1 | #7291FF | #121214 | 6.42:1 | 4.5:1 |
| dark | Accent link on surface-2 | #7291FF | #18181B | 6.08:1 | 4.5:1 |
| dark | Accent text on accent-soft over bg | #7291FF | #191E2E | 5.69:1 | 4.5:1 |
| dark | Text on accent-soft over bg | #F4F4F5 | #191E2E | 15.09:1 | 4.5:1 |
| dark | enough text on enough-soft over bg | #34D399 | #10251E | 8.37:1 | 4.5:1 |
| dark | tight text on tight-soft over bg | #FBBF24 | #2A220F | 9.43:1 | 4.5:1 |
| dark | short text on short-soft over bg | #F97362 | #2A1917 | 6.13:1 | 4.5:1 |
| dark | Accent text on accent-soft over surface-1 | #7291FF | #1F2435 | 5.29:1 | 4.5:1 |
| dark | Text on accent-soft over surface-1 | #F4F4F5 | #1F2435 | 14.03:1 | 4.5:1 |
| dark | enough text on enough-soft over surface-1 | #34D399 | #162B25 | 7.77:1 | 4.5:1 |
| dark | tight text on tight-soft over surface-1 | #FBBF24 | #302816 | 8.73:1 | 4.5:1 |
| dark | short text on short-soft over surface-1 | #F97362 | #301F1E | 5.71:1 | 4.5:1 |
| dark | Accent text on accent-soft over surface-2 | #7291FF | #25293B | 4.94:1 | 4.5:1 |
| dark | Text on accent-soft over surface-2 | #F4F4F5 | #25293B | 13.09:1 | 4.5:1 |
| dark | enough text on enough-soft over surface-2 | #34D399 | #1C302B | 7.25:1 | 4.5:1 |
| dark | tight text on tight-soft over surface-2 | #FBBF24 | #362E1C | 8.04:1 | 4.5:1 |
| dark | short text on short-soft over surface-2 | #F97362 | #352424 | 5.36:1 | 4.5:1 |
| dark | Accent text on accent-soft over surface-3 | #7291FF | #2B2F42 | 4.54:1 | 4.5:1 |
| dark | Text on accent-soft over surface-3 | #F4F4F5 | #2B2F42 | 12.03:1 | 4.5:1 |
| dark | enough text on enough-soft over surface-3 | #34D399 | #223632 | 6.65:1 | 4.5:1 |
| dark | tight text on tight-soft over surface-3 | #FBBF24 | #3C3423 | 7.37:1 | 4.5:1 |
| dark | short text on short-soft over surface-3 | #F97362 | #3B2A2B | 4.93:1 | 4.5:1 |
| dark | Primary pill: background-colour label on text-colour fill | #0B0B0C | #F4F4F5 | 17.90:1 | 4.5:1 |
| dark | On-accent on accent (mark, selected) | #0B0B0C | #7291FF | 6.75:1 | 4.5:1 |
| dark | On-accent on short (destructive button) | #0B0B0C | #F97362 | 7.17:1 | 4.5:1 |
| dark | Dimmed headline half (display size) on bg | #A1A1AA | #0B0B0C | 7.68:1 | 3:1 |
| dark | Form field border on bg | #6E6E78 | #0B0B0C | 3.90:1 | 3:1 |
| dark | Form field border on surface-1 | #6E6E78 | #121214 | 3.71:1 | 3:1 |
| dark | Form field border on surface-2 | #6E6E78 | #18181B | 3.51:1 | 3:1 |
| dark | Focus ring and handle (accent) on bg | #7291FF | #0B0B0C | 6.75:1 | 3:1 |
| dark | Focus ring and handle (accent) on surface-1 | #7291FF | #121214 | 6.42:1 | 3:1 |
| dark | Focus ring and handle (accent) on surface-2 | #7291FF | #18181B | 6.08:1 | 3:1 |
| dark | enough gauge segment on surface-1 | #34D399 | #121214 | 9.73:1 | 3:1 |
| dark | tight gauge segment on surface-1 | #FBBF24 | #121214 | 11.21:1 | 3:1 |
| dark | short gauge segment on surface-1 | #F97362 | #121214 | 6.82:1 | 3:1 |
| dark | Gauge empty segment (surface-3) vs lit is decorative: state word always shown | #1F1F23 | #121214 | 1.14:1 | 1:1 |
| light | Text on bg | #1C1B19 | #FBFBFA | 16.62:1 | 4.5:1 |
| light | Muted text on bg | #66635D | #FBFBFA | 5.78:1 | 4.5:1 |
| light | Subtle text on bg | #6C6963 | #FBFBFA | 5.28:1 | 4.5:1 |
| light | enough text on bg | #046E50 | #FBFBFA | 6.05:1 | 4.5:1 |
| light | tight text on bg | #855700 | #FBFBFA | 6.04:1 | 4.5:1 |
| light | short text on bg | #B42318 | #FBFBFA | 6.35:1 | 4.5:1 |
| light | Text on surface-1 | #1C1B19 | #FFFFFF | 17.21:1 | 4.5:1 |
| light | Muted text on surface-1 | #66635D | #FFFFFF | 5.99:1 | 4.5:1 |
| light | Subtle text on surface-1 | #6C6963 | #FFFFFF | 5.47:1 | 4.5:1 |
| light | enough text on surface-1 | #046E50 | #FFFFFF | 6.27:1 | 4.5:1 |
| light | tight text on surface-1 | #855700 | #FFFFFF | 6.25:1 | 4.5:1 |
| light | short text on surface-1 | #B42318 | #FFFFFF | 6.57:1 | 4.5:1 |
| light | Text on surface-2 | #1C1B19 | #F4F3F1 | 15.52:1 | 4.5:1 |
| light | Muted text on surface-2 | #66635D | #F4F3F1 | 5.40:1 | 4.5:1 |
| light | Subtle text on surface-2 | #6C6963 | #F4F3F1 | 4.93:1 | 4.5:1 |
| light | enough text on surface-2 | #046E50 | #F4F3F1 | 5.65:1 | 4.5:1 |
| light | tight text on surface-2 | #855700 | #F4F3F1 | 5.64:1 | 4.5:1 |
| light | short text on surface-2 | #B42318 | #F4F3F1 | 5.93:1 | 4.5:1 |
| light | Text on surface-3 | #1C1B19 | #ECEAE6 | 14.32:1 | 4.5:1 |
| light | Muted text on surface-3 | #66635D | #ECEAE6 | 4.98:1 | 4.5:1 |
| light | Subtle text on surface-3 | #6C6963 | #ECEAE6 | 4.55:1 | 4.5:1 |
| light | enough text on surface-3 | #046E50 | #ECEAE6 | 5.22:1 | 4.5:1 |
| light | tight text on surface-3 | #855700 | #ECEAE6 | 5.20:1 | 4.5:1 |
| light | short text on surface-3 | #B42318 | #ECEAE6 | 5.47:1 | 4.5:1 |
| light | Accent link on bg | #3755CC | #FBFBFA | 6.08:1 | 4.5:1 |
| light | Accent link on surface-1 | #3755CC | #FFFFFF | 6.30:1 | 4.5:1 |
| light | Accent link on surface-2 | #3755CC | #F4F3F1 | 5.68:1 | 4.5:1 |
| light | Accent text on accent-soft over bg | #3755CC | #E7EAF5 | 5.24:1 | 4.5:1 |
| light | Text on accent-soft over bg | #1C1B19 | #E7EAF5 | 14.33:1 | 4.5:1 |
| light | enough text on enough-soft over bg | #046E50 | #E2EDE9 | 5.23:1 | 4.5:1 |
| light | tight text on tight-soft over bg | #855700 | #EFEBE1 | 5.25:1 | 4.5:1 |
| light | short text on short-soft over bg | #B42318 | #F4E5E3 | 5.37:1 | 4.5:1 |
| light | Accent text on accent-soft over surface-1 | #3755CC | #EBEEFA | 5.44:1 | 4.5:1 |
| light | Text on accent-soft over surface-1 | #1C1B19 | #EBEEFA | 14.87:1 | 4.5:1 |
| light | enough text on enough-soft over surface-1 | #046E50 | #E6F1EE | 5.43:1 | 4.5:1 |
| light | tight text on tight-soft over surface-1 | #855700 | #F3EEE6 | 5.41:1 | 4.5:1 |
| light | short text on short-soft over surface-1 | #B42318 | #F8E9E8 | 5.58:1 | 4.5:1 |
| light | Accent text on accent-soft over surface-2 | #3755CC | #E1E3ED | 4.92:1 | 4.5:1 |
| light | Text on accent-soft over surface-2 | #1C1B19 | #E1E3ED | 13.45:1 | 4.5:1 |
| light | enough text on enough-soft over surface-2 | #046E50 | #DCE6E1 | 4.91:1 | 4.5:1 |
| light | tight text on tight-soft over surface-2 | #855700 | #E9E3D9 | 4.90:1 | 4.5:1 |
| light | short text on short-soft over surface-2 | #B42318 | #EEDEDB | 5.04:1 | 4.5:1 |
| light | Accent text on accent-soft over surface-3 | #3755CC | #DADBE3 | 4.57:1 | 4.5:1 |
| light | Text on accent-soft over surface-3 | #1C1B19 | #DADBE3 | 12.48:1 | 4.5:1 |
| light | enough text on enough-soft over surface-3 | #046E50 | #D5DED7 | 4.55:1 | 4.5:1 |
| light | tight text on tight-soft over surface-3 | #855700 | #E2DBCF | 4.54:1 | 4.5:1 |
| light | short text on short-soft over surface-3 | #B42318 | #E6D6D1 | 4.67:1 | 4.5:1 |
| light | Primary pill: background-colour label on text-colour fill | #FBFBFA | #1C1B19 | 16.62:1 | 4.5:1 |
| light | On-accent on accent (mark, selected) | #FFFFFF | #3755CC | 6.30:1 | 4.5:1 |
| light | On-accent on short (destructive button) | #FFFFFF | #B42318 | 6.57:1 | 4.5:1 |
| light | Dimmed headline half (display size) on bg | #66635D | #FBFBFA | 5.78:1 | 3:1 |
| light | Form field border on bg | #86837B | #FBFBFA | 3.66:1 | 3:1 |
| light | Form field border on surface-1 | #86837B | #FFFFFF | 3.79:1 | 3:1 |
| light | Form field border on surface-2 | #86837B | #F4F3F1 | 3.41:1 | 3:1 |
| light | Focus ring and handle (accent) on bg | #3755CC | #FBFBFA | 6.08:1 | 3:1 |
| light | Focus ring and handle (accent) on surface-1 | #3755CC | #FFFFFF | 6.30:1 | 3:1 |
| light | Focus ring and handle (accent) on surface-2 | #3755CC | #F4F3F1 | 5.68:1 | 3:1 |
| light | enough gauge segment on surface-1 | #046E50 | #FFFFFF | 6.27:1 | 3:1 |
| light | tight gauge segment on surface-1 | #855700 | #FFFFFF | 6.25:1 | 3:1 |
| light | short gauge segment on surface-1 | #B42318 | #FFFFFF | 6.57:1 | 3:1 |
| light | Gauge empty segment (surface-3) vs lit is decorative: state word always shown | #ECEAE6 | #FFFFFF | 1.20:1 | 1:1 |
| dark | Tight and Short hue difference (degrees) | #FBBF24 | #F97362 | 37:1 | 25:1 |
| light | Tight and Short hue difference (degrees) | #855700 | #B42318 | 35:1 | 25:1 |
