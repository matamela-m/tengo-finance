# Tengo build 2: fix everything, then make it a real product

Tengo exists and works as a demo. An independent review (docs/review/) scored it 5.0 of 10 on average and the judge panel gave 39 of 70, with 151 findings. The goal now is to close every finding that can be closed in code, prepare everything that needs a human, and add a way for anyone to use Tengo with their own money, so it is a proper application by hackathon day.

This is a change to the existing app, not a rebuild. Keep the engine's structure, the repository interface, the routes, the design system from docs/REDESIGN.md, and all existing tests. Read this whole brief, then read the review before touching code.

## 0. Inputs and rules

Read first: `docs/review/REPORT.pdf` (or the reviewer files), `docs/review/ROADMAP.md`, `docs/review/findings.csv`, `docs/review/risk-register.md`, `docs/review/judge-qa.md`, `docs/review/backtest/`, `docs/review/tools/credit-risk/stress.ts` and its results.

Hard rules, unchanged:
- No em dashes or en dashes anywhere (UI copy, comments, docs, commit messages). Grep after every phase.
- No exclamation marks in UI copy. Short, plain copy. No filler.
- Nothing may claim legal compliance, a certification or a bank partnership. Anything simulated is labelled as simulated.
- State is never shown by colour alone. Inputs stay at 16px on phones. No sideways panning. Zero axe violations in both themes.
- No third-party requests from the browser at runtime except the auth and database host in section 7, which must be disclosed in the privacy notice.
- Local commits after each phase, no push. After each phase run: build, unit tests, lint, i18n check, fonts check, contrast check, Playwright suite, axe. Never delete or weaken a test to make it pass. Update tests only when the intended behaviour changes, and say why in the commit.
- Close the loop on the review: add a `status` and `resolution` column to `findings.csv` for every finding (fixed, partly fixed, prepared for human action, not fixing with a reason) and keep it current. Every one of the 151 findings ends with a status.

Work in two parts. Part A (phases 1 to 6) fixes the review. Part B (phases 7 to 9) adds the own-profile flow and real accounts. Finish and commit Part A fully before starting Part B. Give a three line summary after each phase: what changed, what is next, test status.

## Part A: fix the review

### Phase 1: baseline and the Home rule (roadmap 1, 2, 5)

1. Baseline: confirm the suite is green, record counts, create a branch or tag for the starting point.
2. **One rule drives Home.** The state decides every number and word on the page:
   - Enough: "Enough until <date>". Tight: "Tight until <date>". Short: "Short from <date>", with the gap in days to next money.
   - The daily budget figure is shown only when the state is Enough or Tight. When Short it shows "Not advised" with one plain line on why, never a number that contradicts the state.
   - The chart readout is always prefixed "If money lands as usual" and uses the same next-money date as the rest of the page. Exactly one next-money date appears on Home (typical date, with the range inside the Why drawer).
   - The headline, the state chip, the cover gauge, the stat tiles and the chart can never disagree. Add a single selector that produces the Home view model from the engine result, and test that every persona and every edge case produces a consistent view model.
3. **Rename the promise words.** "Safe to spend" becomes "Daily budget" (or "Spend up to today" if it reads better on the date hero). "Safe to lend" becomes "Room to lend". Show a visible buffer line next to either figure, for example "Keeps R200 back for the next bill". Put a short, plain disclaimer beside the figures ("An estimate from your own history, not advice"). Update every locale string, the Inbox messages and the Why drawer.
4. **First-impression fixes** from the review: no empty Plan page on first visit (give it a sensible default scenario), daily messages off by default until the user opts in, neutral icons on privacy cards plus conditional copy (never show a tick for something not true), and clearly distinct Tight and Short colours in the light theme (verify with the contrast script).

### Phase 2: engine robustness (roadmap 8 and the engine items in the pilot list)

Teach the engine when a pattern breaks. All behaviour below is covered by unit tests, and the credit-risk stress cases S01 to S13 plus P-thabo, P-lerato and P-ayanda become permanent regression tests with expected outcomes.

- **Paused income.** If income has been missing for more than about two expected intervals, mark income as paused. The headline stops assuming next money. The state is judged against an explicit "no money expected" horizon and the UI says "Income looks paused". Never show Enough with high confidence in this situation.
- **No income at all** in the history: do not invent a next-money date. Show a fourth, neutral status, "Not enough to tell", with what the user can add to get an answer.
- **Thin data.** Under 14 days: "Not enough to tell". 14 to 27 days: a visibly wide band and "Low confidence". Never a zero-width band.
- **Payday today.** If the typical payday is today and the payout is not yet in the balance, do not show Short because of it. Treat today's expected deposit as pending and say so.
- **Bills just after payday.** Reserve known bills due before and shortly after next money before computing the daily budget, and show the reserve.
- **Missed or unpaid bills.** Detect a recurring bill that did not appear when expected and surface "Rent looks unpaid" as a user-confirmable item instead of silently dropping it.
- **Rising bills.** Project a recurring bill from its latest amount (or the larger of the latest two), not a lagging median.
- **One-offs and outliers.** Cap or winsorise large one-off spends and windfalls so one repair or one loan does not set the daily rate or inflate the income threshold. Treat loan disbursements and refunds as non-income when the user marks them or the description matches a configurable list. Let the user mark any transaction as "one-off".
- **Month-end and known spikes.** Use day-of-month and weekday effects where history supports it, otherwise widen the band near month end.
- **Overdraft.** Show how far overdrawn the user is and treat it as its own message.
- **Stale imports.** Do not shift old statements forward silently. Show the statement end date, warn that the forecast reflects that date, and ask for a current balance.
- **Background income** (small daily deposits) is included in the headline projection consistently with the chart.
- **Band calibration.** Recalibrate the band so coverage near run-out is honest and report coverage by lead time. Document the method in the README.
- Re-run the backtest in `docs/review/backtest/` and the stress cases. Write `docs/review/after/COMPARISON.md` with before and after tables (MAE, band coverage, state accuracy, false reassurance, each edge case). Add a fast accuracy regression test to CI that fails if headline metrics get worse than stated thresholds.

### Phase 3: harmful outputs, claims and honesty (roadmap 3, 7, 10 and pilot-list copy items)

- **What helps most.** Never suggest delaying or skipping credit, insurance, rent, school fees or any bill with a penalty. Never suggest cutting stock for a shop or borrowing. Allowed suggestions: bring in more money, trim categories the user has marked as flexible, move a bill only if the user marked it movable. Every suggestion states the assumption behind it.
- **Languages.** Replace "11 languages" claims with "Built for 11 languages. English today." Per-language status chips (English, machine-translated, human-reviewed) driven by `status.json`. Keep `html lang="en"` while the visible text is English and set the language attribute only for strings that are actually translated. Tshivenda is not supported by Google Cloud Translation, so exclude it from the machine route and mark it "Needs a first-language translator". Add a per-string review status and a glossary file for money terms. Do not run machine translation without the founder providing an API key, and never mark machine output as reviewed.
- **Privacy and security copy.** Every privacy statement must be conditional on what is actually true in the current mode (device only, or account). Remove or reword any tick, badge or sentence the review flagged as overstating.
- **Name story.** Put the "mutengo" meaning behind a flag, off by default, with a TODO to confirm with two Tshivenda speakers. The About page works without it.
- Legal wording pass using `docs/review/legal.md`: no wording that reads as regulated advice or a lending decision, plain-language disclosures, a standing "estimate" note.

### Phase 4: offline, performance, dependencies, tests (roadmap 9 and pilot-list technical items)

- **Offline after the first visit.** Precache the whole build at service worker install (build manifest), an offline fallback page, and a Playwright test that goes offline after the first load without an intermediate reload, on a cold profile.
- **Performance.** Lazy-load locale files (only the active language plus English), split the bundle by route, keep the 142 KB gzip budget or better and enforce it in CI. Remove the artificial 140 ms repository delay outside demo mode. Move heavy engine work off the main thread if profiling shows it matters, and memoise.
- **Dependencies.** Upgrade react-router and vitest and fix every advisory that affects shipped code. `npm audit` must show no critical or high advisories in production dependencies.
- **Data layer.** Handle storage errors and quota failures with visible messages, schema versioning with migrations, and a documented service worker strategy that never caches personal data responses.
- **Tests.** Add unit tests for the data layer and failure paths, raise unit coverage across `src` well above 20 percent, and keep Playwright covering every route.
- Security headers in `vercel.json` (CSP, frame ancestors, referrer policy, permissions policy) with a test that checks them on the built app.

### Phase 5: the money people actually live on (roadmap 11 and the cash and obligations items)

- **Cash.** Quick add for cash in, cash out and cash in hand, with a one-tap flow. Cash entries feed the forecast like any transaction. A "cash on hand" balance is part of the total the forecast uses, shown separately and editable.
- **Wallets and extra accounts.** Allow more than one account (bank, cash, mobile wallet) with a balance each, summed for the forecast, with the breakdown shown on Money.
- **Informal obligations.** First-class recurring items for stokvel contributions, burial society, family support and informal loans, with amount, interval and a "movable" flag. They behave like bills in the engine.
- **Manual setup path** for people without statements: balance, how money usually arrives (daily, weekly, monthly, irregular), typical amounts, and regular bills. Generate a low-confidence starting history from this clearly labelled as "estimated from your answers", replaced as real entries arrive.
- Update the seed personas so each includes some cash and one informal obligation, and update tests and the backtest accordingly.

### Phase 6: shared phones and safety (pilot-list items)

- **App lock.** Optional PIN lock with auto-lock after a period, stored as a salted hash on the device.
- **Discreet mode.** Hide amounts on screen until tapped and show generic text in any preview or notification.
- **Quick exit.** A visible control that clears the view and returns to a neutral page.
- Written policy page for vulnerable users and children (the app is for adults, with an 18 or older self-declaration at account creation, section 7).
- Observability that never logs personal data: error boundaries, a local diagnostic panel in Me, and a documented plan for server logging with personal data excluded.

## Part B: use Tengo with your own money

### Product decision (assumed, confirm in the README if changed)

Under "Explore Tengo" the persona picker gets a fourth option, "Use your own money", beside the three fictional personas. It is **guest-first**: a person gets value in about a minute with no sign-up wall, on their own device, and may then choose to save to an account. Personas stay fictional and keep the exact chip "Demo | Fictional Data". Own-profile mode never shows that chip, because it would be false. It shows "Your profile" with the storage mode ("This device only" or "Saved to your account").

### Phase 7: own profile, guest mode, onboarding

1. **Entry.** The fourth card on the picker, with a one-line promise ("Your numbers, your date. Nothing leaves your device unless you save an account."). The language selector stays on the picker.
2. **Onboarding wizard** (4 short steps, can be resumed): what Tengo asks for and why (plain language), consent choices (granular, same controls as the privacy centre, messages and analytics off by default), add your money, then your first forecast.
   - Add your money, three ways: import a CSV statement (existing importer), manual setup (Phase 5), or "Try with sample numbers", which fills the profile with an editable, clearly labelled sample so people can explore without typing anything.
   - Suggest made-up numbers for anyone who prefers not to enter real ones ("You can use pretend numbers to try it").
3. **Profile model.** Name or nickname (optional), language, consent state, accounts, transactions, recurring items, flags, notice version accepted. No ID numbers, no phone number, no bank credentials, ever. Collect only what the forecast needs.
4. **Device-only storage.** Use the existing local repository with a separate profile namespace. Optional PIN lock from Phase 6. Show the storage mode on Me.
5. **Profile management** in Me: edit data, export JSON and CSV, delete profile (real deletion with a receipt that contains no personal data), switch back to the fictional personas.
6. **Messaging and analytics** stay simulated or off. Nothing is sent.
7. Playwright flows: create a profile as a guest in each of the three ways, forecast appears and is consistent with the Home rule, export, delete, return to picker.

### Phase 8: optional accounts with Supabase

Accounts are optional and only reachable after a guest has seen value ("Save to an account to keep this on any device"). The forecast engine still runs in the browser, so the server stores data and never computes on it.

- **Auth.** Passwordless email sign-in (one-time code or magic link) with Supabase Auth. No passwords. Rate limiting on sign-in requests, short-lived sessions, "sign out everywhere". Confirm the user is 18 or older with an explicit checkbox at account creation; do not store a date of birth.
- **Data.** Postgres tables for profiles, accounts, transactions, recurring items, consent records (with timestamp and notice version), audit log and deletion receipts. Migrations in `supabase/migrations/`. Row-level security on every table so a user can read and write only their own rows. Automated tests with two test users proving user B cannot read, update or delete user A's data, including through the API and RPC.
- **Repository.** Implement `SupabaseRepository` behind the existing `TengoRepository` interface. UI code does not change. Select the repository by mode (guest local, account remote). When a guest signs up, offer to upload their device data, and define conflict rules: account data wins on another device, with a clear prompt.
- **Real deletion.** Delete account removes the user's rows and the auth user, shows a receipt without personal data, and states honestly any backup retention period of the hosting plan. Retention rule is stated and enforced by a scheduled job or documented manual step.
- **Real consent records.** Server-side consent log, viewable and exportable, with withdrawal that changes behaviour (messages off, analytics off, forecast paused with resume or delete).
- **Export.** Complete JSON and CSV export from the server.
- **Security.** Only the anon key in the browser, service role key never in client code or the repo, secrets in environment variables, `.env.example` committed. Update the CSP for the Supabase host only. No personal data in logs or error reports. Dependency and secret scanning in CI.
- **Notice and terms.** Replace placeholder text with a real draft privacy notice and terms of use that match what the app actually does: what is stored, where it is processed, who the responsible party is, retention, rights, how to complain. The responsible party and Information Officer details come from environment variables and must be filled by the founder before launch. The app shows a build-time warning if they are still placeholders. State plainly that this is a pilot, not a bank and not financial advice, and never claim POPIA compliance or certification. Mark the notice "draft, to be reviewed by a lawyer".
- **Setup steps for the founder** (write these in `docs/SETUP-SUPABASE.md`, do not attempt them yourself): create a Supabase project, copy the project URL and anon key into `.env.local`, configure the email provider and site URL, run the migrations, set environment variables on Vercel. Make the app run fully in guest mode with no keys at all.
- Playwright and unit tests cover the sign-up upload path, sign-in on a second device, conflict prompt, export and deletion. Use the Supabase local stack for tests if Docker is available, otherwise a mocked client with the same policies tested at the SQL level.

### Phase 9: documents, evidence and final QA

1. **Business case** in `docs/business-case.md` and as a one-page PDF: bank-embedded licence, pilot fee with an annual platform minimum, in-app notifications instead of paid WhatsApp, what a bank already has versus what Tengo adds, data contract (what Tengo needs from the bank and returns), pilot KPIs with a control group. Use only numbers from `docs/review/model.xlsx`, keep every assumption labelled, and update the workbook where the build changes a cost.
2. **Comprehension test kit** in `docs/research/`: a six-participant protocol, consent form, task script (first two minutes, then three tasks), questions that test whether people read the date, the range and the states correctly, a note-taking sheet and a scoring guide. The founder runs the sessions, you only prepare the kit.
3. **Pitch material.** Updated three-minute demo script and judge Q&A reflecting the fixes and the own-profile flow, with the backtest cited alongside its synthetic caveat and the before and after table.
4. **README** rewritten: what Tengo is, run and test instructions, forecast method including every new rule, modes (fictional personas, own profile on device, account), what is real and what is simulated, security and privacy summary that matches the code, decisions, known limitations, placeholders to replace (logo, icons, Information Officer, responsible party, translations).
5. **Final QA.** Full suite, axe in both themes, Lighthouse mobile on landing, picker, Home and onboarding, screenshots at 390, 768, 1280 and 1600 in both themes for every page and all four entry options, npm audit, bundle budget check, `fonts:check`, em dash grep. Look at every screenshot yourself and fix problems.
6. **Re-review.** Run a short second pass of the review panel on the changed areas only (product, technology, security and privacy, legal, credit risk, data, UX, accessibility, behavioural, judges) in `docs/review/after/`, again read-only and critical, and write `docs/review/after/OUTCOME.md` with new scores against the old ones, every finding's final status, and what still blocks a real pilot.

## What you cannot do yourself, and must say so

State in `docs/HUMAN-ACTIONS.md`, with owner and why: translation review by first-language speakers (especially Tshivenda), confirming the name meaning, running the comprehension sessions, legal review of the privacy notice, terms and regulatory position (FAIS, NCA), naming the responsible party and Information Officer, Supabase and Vercel account setup, a Google Cloud key if machine translation is wanted, validation on consented real statements, and a final logo. Do not pretend any of these are done.