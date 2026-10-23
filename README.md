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
| `npm run contrast` | WCAG contrast of every colour pair, hue separation of Tight, Short and the destructive red, and no navy or primary-blue text |
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
| bg | #0B0B0C | #FAFAFA |
| surface-1 (cards) / 2 (muted) / 3 | #121214 / #18181B / #1F1F23 | #FFFFFF / #F5F5F5 / #EBEBEB |
| border / border-strong | #26262B / #34343A | #E5E5E5 / #D4D4D4 |
| field border | #737373 | #858585 (the specified #A3A3A3 is 2.5:1, below the 3:1 a field needs) |
| text / muted / subtle | #FAFAFA / #B0B0B0 / #ADADAD | #171717 / #525252 / #5C5C5C |
| primary (accent) / text on it | #3B82F6 / #0B0B0C (white is 3.7:1) | #2563EB / #FFFFFF |
| link and small blue text | #60A5FA | #1D4ED8 (#2563EB fails on the light-blue fill) |
| accent fill, backgrounds only, never text | #1E3A8A | #DBEAFE |
| destructive fill / text on it / text-safe | #EF4444 / #0B0B0C / #F87878 | #DC2626 / #FFFFFF / #B91C1C |
| enough / tight / short | #34D399 / #FBBF24 / #FF8A5B | #065F46 / #735400 / #A93A0B |
| soft fills | state colour at 14%, destructive at 10% | state colour at 10%, destructive at 10% |

Short is coral-orange: at least 25 degrees of hue from Tight and 15 from both destructive reds, checked by the script. The script also fails the build if the navy fill or the primary blue is ever used as a text colour.

Measured by `npm run contrast` (also part of `npm test`):

| Theme | Pair | Foreground | Background | Ratio | Target |
| --- | --- | --- | --- | --- | --- |
| dark | Text on bg | #FAFAFA | #0B0B0C | 18.85:1 | 4.5:1 |
| dark | Muted text on bg | #B0B0B0 | #0B0B0C | 9.07:1 | 4.5:1 |
| dark | Subtle text on bg | #ADADAD | #0B0B0C | 8.77:1 | 4.5:1 |
| dark | Text on surface-1 | #FAFAFA | #121214 | 17.93:1 | 4.5:1 |
| dark | Muted text on surface-1 | #B0B0B0 | #121214 | 8.63:1 | 4.5:1 |
| dark | Subtle text on surface-1 | #ADADAD | #121214 | 8.34:1 | 4.5:1 |
| dark | Text on surface-2 | #FAFAFA | #18181B | 16.97:1 | 4.5:1 |
| dark | Muted text on surface-2 | #B0B0B0 | #18181B | 8.17:1 | 4.5:1 |
| dark | Subtle text on surface-2 | #ADADAD | #18181B | 7.89:1 | 4.5:1 |
| dark | Text on surface-3 | #FAFAFA | #1F1F23 | 15.74:1 | 4.5:1 |
| dark | Muted text on surface-3 | #B0B0B0 | #1F1F23 | 7.57:1 | 4.5:1 |
| dark | Subtle text on surface-3 | #ADADAD | #1F1F23 | 7.32:1 | 4.5:1 |
| dark | Text on accent-fill | #FAFAFA | #1E3A8A | 9.92:1 | 4.5:1 |
| dark | Muted text on accent-fill | #B0B0B0 | #1E3A8A | 4.78:1 | 4.5:1 |
| dark | Subtle text on accent-fill | #ADADAD | #1E3A8A | 4.62:1 | 4.5:1 |
| dark | enough text on bg | #34D399 | #0B0B0C | 10.23:1 | 4.5:1 |
| dark | tight text on bg | #FBBF24 | #0B0B0C | 11.79:1 | 4.5:1 |
| dark | short text on bg | #FF8A5B | #0B0B0C | 8.47:1 | 4.5:1 |
| dark | Link and small blue text on bg | #60A5FA | #0B0B0C | 7.74:1 | 4.5:1 |
| dark | Destructive text on bg | #F87878 | #0B0B0C | 7.45:1 | 4.5:1 |
| dark | Destructive text on destructive notice over bg | #F87878 | #221112 | 6.87:1 | 4.5:1 |
| dark | Text on destructive notice over bg | #FAFAFA | #221112 | 17.39:1 | 4.5:1 |
| dark | enough text on enough-soft over bg | #34D399 | #112720 | 8.18:1 | 4.5:1 |
| dark | tight text on tight-soft over bg | #FBBF24 | #2D240F | 9.18:1 | 4.5:1 |
| dark | short text on short-soft over bg | #FF8A5B | #2D1D17 | 6.95:1 | 4.5:1 |
| dark | enough text on surface-1 | #34D399 | #121214 | 9.73:1 | 4.5:1 |
| dark | tight text on surface-1 | #FBBF24 | #121214 | 11.21:1 | 4.5:1 |
| dark | short text on surface-1 | #FF8A5B | #121214 | 8.05:1 | 4.5:1 |
| dark | Link and small blue text on surface-1 | #60A5FA | #121214 | 7.36:1 | 4.5:1 |
| dark | Destructive text on surface-1 | #F87878 | #121214 | 7.08:1 | 4.5:1 |
| dark | Destructive text on destructive notice over surface-1 | #F87878 | #281719 | 6.48:1 | 4.5:1 |
| dark | Text on destructive notice over surface-1 | #FAFAFA | #281719 | 16.40:1 | 4.5:1 |
| dark | enough text on enough-soft over surface-1 | #34D399 | #172D27 | 7.58:1 | 4.5:1 |
| dark | tight text on tight-soft over surface-1 | #FBBF24 | #332A16 | 8.48:1 | 4.5:1 |
| dark | short text on short-soft over surface-1 | #FF8A5B | #33231E | 6.46:1 | 4.5:1 |
| dark | enough text on surface-2 | #34D399 | #18181B | 9.22:1 | 4.5:1 |
| dark | tight text on surface-2 | #FBBF24 | #18181B | 10.61:1 | 4.5:1 |
| dark | short text on surface-2 | #FF8A5B | #18181B | 7.63:1 | 4.5:1 |
| dark | Link and small blue text on surface-2 | #60A5FA | #18181B | 6.97:1 | 4.5:1 |
| dark | Destructive text on surface-2 | #F87878 | #18181B | 6.71:1 | 4.5:1 |
| dark | Destructive text on destructive notice over surface-2 | #F87878 | #2E1C1F | 6.11:1 | 4.5:1 |
| dark | Text on destructive notice over surface-2 | #FAFAFA | #2E1C1F | 15.45:1 | 4.5:1 |
| dark | enough text on enough-soft over surface-2 | #34D399 | #1C322D | 7.08:1 | 4.5:1 |
| dark | tight text on tight-soft over surface-2 | #FBBF24 | #382F1C | 7.90:1 | 4.5:1 |
| dark | short text on short-soft over surface-2 | #FF8A5B | #382824 | 6.04:1 | 4.5:1 |
| dark | enough text on surface-3 | #34D399 | #1F1F23 | 8.54:1 | 4.5:1 |
| dark | tight text on surface-3 | #FBBF24 | #1F1F23 | 9.84:1 | 4.5:1 |
| dark | short text on surface-3 | #FF8A5B | #1F1F23 | 7.07:1 | 4.5:1 |
| dark | Link and small blue text on surface-3 | #60A5FA | #1F1F23 | 6.46:1 | 4.5:1 |
| dark | Destructive text on surface-3 | #F87878 | #1F1F23 | 6.22:1 | 4.5:1 |
| dark | Destructive text on destructive notice over surface-3 | #F87878 | #342326 | 5.62:1 | 4.5:1 |
| dark | Text on destructive notice over surface-3 | #FAFAFA | #342326 | 14.22:1 | 4.5:1 |
| dark | enough text on enough-soft over surface-3 | #34D399 | #223834 | 6.49:1 | 4.5:1 |
| dark | tight text on tight-soft over surface-3 | #FBBF24 | #3E3523 | 7.24:1 | 4.5:1 |
| dark | short text on short-soft over surface-3 | #FF8A5B | #3E2E2B | 5.54:1 | 4.5:1 |
| dark | On-accent text on primary button | #0B0B0C | #3B82F6 | 5.35:1 | 4.5:1 |
| dark | On-danger text on destructive button | #0B0B0C | #EF4444 | 5.23:1 | 4.5:1 |
| dark | Primary pill: background-colour label on text-colour fill | #0B0B0C | #FAFAFA | 18.85:1 | 4.5:1 |
| dark | Dimmed headline half (display size) on bg | #B0B0B0 | #0B0B0C | 9.07:1 | 3:1 |
| dark | Form field border on bg | #737373 | #0B0B0C | 4.15:1 | 3:1 |
| dark | Form field border on surface-1 | #737373 | #121214 | 3.95:1 | 3:1 |
| dark | Form field border on surface-2 | #737373 | #18181B | 3.74:1 | 3:1 |
| dark | Focus ring and handle (accent) on bg | #3B82F6 | #0B0B0C | 5.35:1 | 3:1 |
| dark | Focus ring and handle (accent) on surface-1 | #3B82F6 | #121214 | 5.09:1 | 3:1 |
| dark | Focus ring and handle (accent) on surface-2 | #3B82F6 | #18181B | 4.82:1 | 3:1 |
| dark | Focus ring and handle (accent) on surface-3 | #3B82F6 | #1F1F23 | 4.47:1 | 3:1 |
| dark | Selected segment outline (accent) on its track (surface-2) | #3B82F6 | #18181B | 4.82:1 | 3:1 |
| dark | enough gauge segment on surface-1 | #34D399 | #121214 | 9.73:1 | 3:1 |
| dark | tight gauge segment on surface-1 | #FBBF24 | #121214 | 11.21:1 | 3:1 |
| dark | short gauge segment on surface-1 | #FF8A5B | #121214 | 8.05:1 | 3:1 |
| dark | Gauge empty segment (surface-3) vs lit is decorative: state word always shown | #1F1F23 | #121214 | 1.14:1 | 1:1 |
| light | Text on bg | #171717 | #FAFAFA | 17.18:1 | 4.5:1 |
| light | Muted text on bg | #525252 | #FAFAFA | 7.49:1 | 4.5:1 |
| light | Subtle text on bg | #5C5C5C | #FAFAFA | 6.41:1 | 4.5:1 |
| light | Text on surface-1 | #171717 | #FFFFFF | 17.93:1 | 4.5:1 |
| light | Muted text on surface-1 | #525252 | #FFFFFF | 7.81:1 | 4.5:1 |
| light | Subtle text on surface-1 | #5C5C5C | #FFFFFF | 6.69:1 | 4.5:1 |
| light | Text on surface-2 | #171717 | #F5F5F5 | 16.44:1 | 4.5:1 |
| light | Muted text on surface-2 | #525252 | #F5F5F5 | 7.17:1 | 4.5:1 |
| light | Subtle text on surface-2 | #5C5C5C | #F5F5F5 | 6.13:1 | 4.5:1 |
| light | Text on surface-3 | #171717 | #EBEBEB | 15.04:1 | 4.5:1 |
| light | Muted text on surface-3 | #525252 | #EBEBEB | 6.55:1 | 4.5:1 |
| light | Subtle text on surface-3 | #5C5C5C | #EBEBEB | 5.61:1 | 4.5:1 |
| light | Text on accent-fill | #171717 | #DBEAFE | 14.69:1 | 4.5:1 |
| light | Muted text on accent-fill | #525252 | #DBEAFE | 6.40:1 | 4.5:1 |
| light | Subtle text on accent-fill | #5C5C5C | #DBEAFE | 5.48:1 | 4.5:1 |
| light | enough text on bg | #065F46 | #FAFAFA | 7.36:1 | 4.5:1 |
| light | tight text on bg | #735400 | #FAFAFA | 6.71:1 | 4.5:1 |
| light | short text on bg | #A93A0B | #FAFAFA | 6.10:1 | 4.5:1 |
| light | Link and small blue text on bg | #1D4ED8 | #FAFAFA | 6.42:1 | 4.5:1 |
| light | Destructive text on bg | #B91C1C | #FAFAFA | 6.20:1 | 4.5:1 |
| light | Destructive text on destructive notice over bg | #B91C1C | #F7E5E5 | 5.33:1 | 4.5:1 |
| light | Text on destructive notice over bg | #171717 | #F7E5E5 | 14.76:1 | 4.5:1 |
| light | enough text on enough-soft over bg | #065F46 | #E2EBE8 | 6.32:1 | 4.5:1 |
| light | tight text on tight-soft over bg | #735400 | #EDE9E1 | 5.79:1 | 4.5:1 |
| light | short text on short-soft over bg | #A93A0B | #F2E7E2 | 5.25:1 | 4.5:1 |
| light | enough text on surface-1 | #065F46 | #FFFFFF | 7.68:1 | 4.5:1 |
| light | tight text on surface-1 | #735400 | #FFFFFF | 7.01:1 | 4.5:1 |
| light | short text on surface-1 | #A93A0B | #FFFFFF | 6.37:1 | 4.5:1 |
| light | Link and small blue text on surface-1 | #1D4ED8 | #FFFFFF | 6.70:1 | 4.5:1 |
| light | Destructive text on surface-1 | #B91C1C | #FFFFFF | 6.47:1 | 4.5:1 |
| light | Destructive text on destructive notice over surface-1 | #B91C1C | #FCE9E9 | 5.54:1 | 4.5:1 |
| light | Text on destructive notice over surface-1 | #171717 | #FCE9E9 | 15.34:1 | 4.5:1 |
| light | enough text on enough-soft over surface-1 | #065F46 | #E6EFED | 6.56:1 | 4.5:1 |
| light | tight text on tight-soft over surface-1 | #735400 | #F1EEE6 | 6.04:1 | 4.5:1 |
| light | short text on short-soft over surface-1 | #A93A0B | #F6EBE7 | 5.45:1 | 4.5:1 |
| light | enough text on surface-2 | #065F46 | #F5F5F5 | 7.05:1 | 4.5:1 |
| light | tight text on surface-2 | #735400 | #F5F5F5 | 6.43:1 | 4.5:1 |
| light | short text on surface-2 | #A93A0B | #F5F5F5 | 5.84:1 | 4.5:1 |
| light | Link and small blue text on surface-2 | #1D4ED8 | #F5F5F5 | 6.15:1 | 4.5:1 |
| light | Destructive text on surface-2 | #B91C1C | #F5F5F5 | 5.93:1 | 4.5:1 |
| light | Destructive text on destructive notice over surface-2 | #B91C1C | #F3E0E0 | 5.10:1 | 4.5:1 |
| light | Text on destructive notice over surface-2 | #171717 | #F3E0E0 | 14.13:1 | 4.5:1 |
| light | enough text on enough-soft over surface-2 | #065F46 | #DDE6E4 | 6.04:1 | 4.5:1 |
| light | tight text on tight-soft over surface-2 | #735400 | #E8E5DD | 5.57:1 | 4.5:1 |
| light | short text on short-soft over surface-2 | #A93A0B | #EDE2DE | 5.01:1 | 4.5:1 |
| light | enough text on surface-3 | #065F46 | #EBEBEB | 6.45:1 | 4.5:1 |
| light | tight text on surface-3 | #735400 | #EBEBEB | 5.88:1 | 4.5:1 |
| light | short text on surface-3 | #A93A0B | #EBEBEB | 5.34:1 | 4.5:1 |
| light | Link and small blue text on surface-3 | #1D4ED8 | #EBEBEB | 5.62:1 | 4.5:1 |
| light | Destructive text on surface-3 | #B91C1C | #EBEBEB | 5.43:1 | 4.5:1 |
| light | Destructive text on destructive notice over surface-3 | #B91C1C | #EAD7D7 | 4.68:1 | 4.5:1 |
| light | Text on destructive notice over surface-3 | #171717 | #EAD7D7 | 12.98:1 | 4.5:1 |
| light | enough text on enough-soft over surface-3 | #065F46 | #D4DDDB | 5.55:1 | 4.5:1 |
| light | tight text on tight-soft over surface-3 | #735400 | #DFDCD4 | 5.11:1 | 4.5:1 |
| light | short text on short-soft over surface-3 | #A93A0B | #E4D9D5 | 4.61:1 | 4.5:1 |
| light | On-accent text on primary button | #FFFFFF | #2563EB | 5.17:1 | 4.5:1 |
| light | On-danger text on destructive button | #FFFFFF | #DC2626 | 4.83:1 | 4.5:1 |
| light | Primary pill: background-colour label on text-colour fill | #FAFAFA | #171717 | 17.18:1 | 4.5:1 |
| light | Dimmed headline half (display size) on bg | #525252 | #FAFAFA | 7.49:1 | 3:1 |
| light | Form field border on bg | #858585 | #FAFAFA | 3.54:1 | 3:1 |
| light | Form field border on surface-1 | #858585 | #FFFFFF | 3.69:1 | 3:1 |
| light | Form field border on surface-2 | #858585 | #F5F5F5 | 3.38:1 | 3:1 |
| light | Focus ring and handle (accent) on bg | #2563EB | #FAFAFA | 4.95:1 | 3:1 |
| light | Focus ring and handle (accent) on surface-1 | #2563EB | #FFFFFF | 5.17:1 | 3:1 |
| light | Focus ring and handle (accent) on surface-2 | #2563EB | #F5F5F5 | 4.74:1 | 3:1 |
| light | Focus ring and handle (accent) on surface-3 | #2563EB | #EBEBEB | 4.34:1 | 3:1 |
| light | Selected segment outline (accent) on its track (surface-2) | #2563EB | #F5F5F5 | 4.74:1 | 3:1 |
| light | enough gauge segment on surface-1 | #065F46 | #FFFFFF | 7.68:1 | 3:1 |
| light | tight gauge segment on surface-1 | #735400 | #FFFFFF | 7.01:1 | 3:1 |
| light | short gauge segment on surface-1 | #A93A0B | #FFFFFF | 6.37:1 | 3:1 |
| light | Gauge empty segment (surface-3) vs lit is decorative: state word always shown | #EBEBEB | #FFFFFF | 1.19:1 | 1:1 |
| dark | Tight and Short hue difference (degrees) | #FBBF24 | #FF8A5B | 26:1 | 25:1 |
| dark | Short and destructive fill hue difference (degrees) | #FF8A5B | #EF4444 | 17:1 | 15:1 |
| dark | Short and destructive text hue difference (degrees) | #FF8A5B | #F87878 | 17:1 | 15:1 |
| light | Tight and Short hue difference (degrees) | #735400 | #A93A0B | 26:1 | 25:1 |
| light | Short and destructive fill hue difference (degrees) | #A93A0B | #DC2626 | 18:1 | 15:1 |
| light | Short and destructive text hue difference (degrees) | #A93A0B | #B91C1C | 18:1 | 15:1 |
