# Hackathon judge panel

Simulated judging panel. We are not FNB judges, have no access to FNB's internal rubric or weighting, and score only from the code, the shared preparation in `docs/review/prep/`, the screenshots, and the twelve other reviewer files, which this panel was told to read.

**Criteria used.** The brief names seven criteria: Product, Creativity, Usability, Sustainability, Impact, Presentation and Intelligence. The public FNB App of the Year FAQ (https://appoftheyear.co.za/faqs/, accessed 2026-10-20) defines the same seven for the App of the Year awards and says round 1 judges "play around" with apps loaded on devices. I did not find a hackathon-specific scoring sheet for 2026, or anything public about the "Financial inclusion and money confidence" track, so I applied the FAQ wording to this entry as follows:

| Criterion | Public FAQ wording (summarised) | How this panel applied it |
| --- | --- | --- |
| Product | Complete, polished, works as a user would expect, solves the stated need, market need, traction | Does the build work end to end and answer "is my money enough until the next money" correctly and consistently? Traction counts as zero today. |
| Creativity | New application or service, creative approach, new approach to an old problem | Is the date-first, irregular-income framing new compared with what South African bank apps publicly offer? |
| Usability | Easy to use, clear, simple, intuitive, obvious what to do next | First two minutes on a phone for each persona, plus accessibility and offline evidence. |
| Sustainability | Potential of app and team, next level, path to revenue | Business model, data route, defensibility, readiness for a real backend. |
| Impact | Size of problem, indispensability, importance | Size and fit of the segment, minus the risk of harm and the parts of the segment the product cannot see. |
| Presentation | How well the team communicates the idea and its relevance to society | What a judge sees without the founder: landing page, in-app story, README, and honesty of claims. No pitch deck or demo script was in the repository, so this is scored on the product's own story. |
| Intelligence | Can the app forecast and predict likely future behaviour by analysing patterns in data | Quality of the forecast engine, its validation, and how it behaves when the patterns break. |

## Verdict

Tengo is a well-made, honest prototype with one clear and good idea: tell an irregular earner the date their money runs out and whether it reaches the next money, not just a balance. It works end to end, it is fast and accessible by tool measures, and its engine is pure, tested and explainable, which maps directly onto the Intelligence criterion. It would lose points in judging for three reasons that are visible within a minute of use: the Home screen contradicts itself (Short beside "Safe to spend R310" and a green "Enough" on the chart, "Enough until" beside a Tight chip, the latter also on the landing hero); the landing page claims 11 official languages when all 10 non-English files are English; and some outputs could cause harm (it tells Thabo to pay his car instalment late). Most of these are copy and rule fixes measured in hours. Sustainability and Impact are capped by things a hackathon cannot fully fix (no users, no data route, a thin single-bank revenue case), but an honest business page and a handful of user sessions would move both. On the evidence today we would shortlist it in round 1 and expect it to struggle in a final unless the Home contradictions and the language claim are fixed first.

## What works

- **A sharp, explainable core answer.** The date is the largest element on Home at every width, with state shown by word, icon, colour and bar count (`ayanda-home-dark-1280.png`, `thabo-home-light-390.png`; UX "What works"; `src/components/StateChip.tsx`). Product lead and commercial reviewers each found no verified South African bank feature that projects a run-out date against irregular income cadence (PROD verdict, COMM "What works").
- **Intelligence that is real, not decorative.** The engine detects weekday and interval income rhythms, recurring bills, and rolling spend percentiles (`src/engine/forecast.ts`, `classify.ts:16`). On the backtest, with 90 days of history, mean absolute error is 2.1 days against a naive baseline of 3.4, with near-zero bias and 71.8 percent band coverage (`docs/review/backtest/results/summary_headline.csv`, data scientist "What works"). The engine has 97.6 percent statement coverage and 66 passing unit tests (`docs/review/prep/coverage.txt`, `checks.md`).
- **Polish and accessibility above hackathon norm.** Lighthouse mobile landing 94 performance and 100 accessibility; 221 Playwright tests pass; axe finds 1 violation over 15 routes in both themes (fact sheet; `docs/review/prep/playwright.txt`; A11Y "What works"). Reduced motion, reflow at 320 px and target sizes all pass (A11Y "What works").
- **Honest demo labelling.** "Demo | Fictional Data" appears on every app screen and simulated privacy and messaging are labelled (`landing-dark-1280.png` footer; LEGAL "What works"; UX "What works").
- **Features that fit the segment.** The family loan check and daily safe-to-spend unit match how informal earners decide (BEH "What works", citing Hershfield, Shu and Benartzi 2020). The privacy centre demonstrates consent, export, deletion and human review in working screens (SEC "What works").
- **Built to be embedded.** `TengoRepository` and `MessageWriter` give a bank the seams to supply data and channel (PROD, COMM, TECH "What works").

## Criterion scores

| Criterion | Score (0 to 10) | Justification and evidence | Biggest gap | Single change that would raise it most |
| --- | --- | --- | --- | --- |
| Product | 6 | Complete and working across 10 screens, both themes and three widths (fact sheet "Screens", 221 Playwright passes). Answers its one question for all three personas. Loses points because the main screen gives conflicting answers (UX-01, UX-02, UX-03, PROD-03, INV-03), data never ages after import so the state drifts to Enough (TECH-01), and there is no traction or real data (INV-01, DATA-01). | The headline, safe to spend figure and chart disagree on the screen judges see first. | Make one rule drive Home: state-specific hero label, a daily limit tied to the state, no state word on the chart readout (JUDGE-01). |
| Creativity | 7 | Date-first framing for people without a payday, an inferred "next money" window, three plain states and a loan-to-family check are not publicly offered by the SA banks reviewed (PROD verdict, COMM competitor table). Not a 9 because the arithmetic is simple and "safe to spend until payday" exists in other apps (INV-02, COMM-01), and the date-beats-balance claim is untested (BEH-08). | The idea's novelty rests on the framing; the cash and stokvel reality that would make it uniquely South African is missing (BEH-02, BEH-07). | A one-tap "cash in hand" entry that feeds the forecast (JUDGE-08). |
| Usability | 6 | Strong base: clean hierarchy, designed empty and error states, keyboard and drawer patterns, Nielsen average 3.6 of 5 (UX heuristic table). Pulled down by the lowest heuristic, consistency of numbers (2 of 5), about 20 figures on Ayanda's first screen (A11Y-05), three different next-money dates (UX-04), a pre-filled Plan that shows a loss before the user acts (UX-06), and focus hidden under the phone tab bar (A11Y-04). Offline: the app's own test passes an offline reload (`tests/flows.spec.ts:131`) and the accessibility reviewer found a blank page offline after one visit (A11Y-02). Both are true: offline works only from the second load (TECH-05). | A stressed user cannot tell which number to believe. | Same as Product: reconcile Home (JUDGE-01), then start Plan empty (JUDGE-10). |
| Sustainability | 4 | Right shape for a bank licence (COMM "What works", PROD "What works") and cheap to run if messages go in-app (COMM-03). But no business model in the repo (COMM-11, INV-07), no data route beyond CSV (PROD-06, INV-04), no moat against the bank building it (COMM-01, INV-02), and single-bank economics short of break-even at the base fee (COMM-02: about 44 000 MAU against about 82 000 needed at R5, all marked Assumption in `model-inputs.md`). The repository contract is not ready for a real backend (TECH-03). | No stated buyer, price or data route. | A one-page business case: bank-embedded licence, pilot KPIs, data contract, honest moat (JUDGE-06). |
| Impact | 5 | The problem is large: 3.6 million in the informal sector and only 18.3 percent of the poorest 40 percent can easily raise emergency money (COMM "What works", Stats SA and World Bank sources). But the product sees one bank account while the segment lives in cash and stokvels (BEH-02, COMM-04, INV-10), the engine shows Enough when income has stopped (RISK-01, RISK-03), lumpy earners shown Enough ran short 11.6 percent of the time on synthetic data (DATA-02), some advice could harm (LEGAL-01, RISK-09), and the multilingual reach is not real yet (L10N-01). No user has tested it (INV-01). | Possible harm and no evidence of benefit. | Remove harmful suggestions (JUDGE-03), then run 5 to 8 user sessions and quote them (JUDGE-07). |
| Presentation | 5 | The tagline "A balance tells you what you have. Tengo tells you until when" is the strongest line in the entry (COMM, INV "What works"), and the landing page explains three steps clearly (`landing-dark-1280.png`). But the landing hero itself shows "Enough until Tue 27 Oct" beside "Tight" (UX-03), the stats row claims "11 Official languages" (COMM-08, INV-05, L10N-01) and "0 Bank logins needed", which conflicts with the bank-embed story (COMM-07). Privacy screens show green ticks beside controls that do not exist (SEC-02). No pitch deck, demo script or user quotes are in the repository. | The first screen a judge sees contains a contradiction and an untrue claim. | Fix the landing hero label and replace the language stat with an honest one (JUDGE-02), then rehearse a demo built on the fixed screens (JUDGE-12). |
| Intelligence | 6 | This is the criterion the engine was built for: it analyses patterns to forecast income timing and run-out, and the backtest shows it beats a naive baseline with 60 or more days (DATA "What works"). Held back because validation is circular (DATA-01: Ayanda's shipped history is one path), the band is too narrow near run-out (DATA-03: 53.5 percent coverage within 6 days), short imports are worse than the baseline (DATA-04), and pattern breaks are not detected: stopped income, payday morning, windfalls (RISK-01, RISK-03, RISK-05, RISK-10, DATA-05). | The engine assumes the pattern holds when the point of the product is that it often does not. | Add pattern-break guards (missed paydays, no income, payday today, stale data) with tests, and show the backtest honestly (JUDGE-04, JUDGE-05). |

**Total: 39 of 70. Average: 5.6 of 10.**

The spread is deliberate. Creativity is highest because the framing is distinct. Sustainability is lowest because nothing in the repository answers who pays or where real data comes from. Reviewer scores ranged from 4 (credit risk, localisation, commercial, investor) to 6 (technology, UX, accessibility), which matches this panel's split between a strong build and a weak case.

## What to improve

Ranked by expected judging score gain per hour of work before submission. Effort is for the change itself, not for every underlying finding.

### JUDGE-01 Make one rule drive the Home screen
- **Severity:** High
- **Evidence:** Ayanda: hero "Short from Fri 23 Oct", card "Safe to spend today R310", chart readout "Enough" (`ayanda-home-dark-1280.png`, seen by this panel). Thabo: "Enough until" above a "Tight" chip (`thabo-home-light-390.png`, `landing-dark-1280.png`). See UX-01, UX-02, UX-03, UX-04, PROD-03, INV-03, BEH-04, LEGAL-08, RISK-04, A11Y-03. Seven reviewers raised it independently. The credit risk reviewer notes R310 is in fact a conservative ceiling (following it leaves R17 on 26 Oct, RISK "What works"), so the fix is mainly the label and placement, not the maths.
- **Recommendation:** State-specific hero label ("Lasts until (on a normal week)" for Tight). For Short, show "To reach Mon 26 Oct, keep to R310 a day. You usually spend R620." Drop the state word from today's chart readout or say "Enough if money lands as usual" in the readout and in `aria-valuetext`. Show one next-money date. Re-capture the landing mock.
- **Effort:** S (about half a day). Raises Product, Usability and Presentation.

### JUDGE-02 Replace the 11-languages claim and fix the page language
- **Severity:** High
- **Evidence:** Landing stat "11 Official languages" (`landing-dark-1280.png`); all 10 non-English files are byte-identical to English (L10N-01); `html lang` says Tshivenda over English text (A11Y-01, L10N-05); the translation script cannot produce Tshivenda (L10N-02). See COMM-08, INV-05. A judge who picks isiZulu sees English and discounts the rest.
- **Recommendation:** Change the stat to "Built for 11 languages" or "English now, more coming". Set `lang="en"` while a locale is pending. If time allows, have a first-language speaker write the money keys (state, hero, safe to spend, messages) for one Gauteng language and mark it reviewed.
- **Effort:** S for copy and `lang` (under an hour); M for one reviewed language. Raises Presentation and Impact.

### JUDGE-03 Remove the outputs that could cause harm
- **Severity:** High
- **Evidence:** "Pay Car instalment (R3 450) after Tue 27 Oct instead of before" (`thabo-home-light-390.png`; `src/engine/help.ts:62` sorts by amount only). "Safe to lend up to" with a one-tap "Use" button; Lerato told she can spend R330, set aside R280 and lend R280 from the same buffer. The only "not advice" line is at the foot of a drawer. See LEGAL-01, LEGAL-02, RISK-09, RISK-11, BEH-01, BEH-03, BEH-05, PROD-04, INV-09.
- **Recommendation:** Never suggest moving credit, insurance, funeral or rent payments; add a unit test. Rename "Safe to lend up to" to "You could lend up to" with "and stay Tight". Exclude stock and fuel from the daily cut. Put "An estimate from your past money, not advice" under the hero, Plan and help card.
- **Effort:** S to M (about a day). Raises Impact and Product, and removes the question a judge is most likely to end on.

### JUDGE-04 Teach the engine to notice when the pattern breaks
- **Severity:** High
- **Evidence:** Income stopped 35 days ago still gives Enough with high confidence and R1 990 safe to lend (RISK-01, S11). No income at all can show Enough (RISK-03; `forecast.test.ts:116` asserts it). Payday morning shows Short (RISK-10). Imported data never ages, so Ayanda drifts from Short to Enough after 30 days (TECH-01). A missed payout raises false reassurance from 7.6 to 36.8 percent (DATA-05).
- **Recommendation:** Add four guarded rules with tests: missed paydays mark the pattern "paused" (state at most Tight, lend R0); no pattern shows "No regular income found"; "Payday today, not in yet" instead of Short; store an `asOf` date and show "Your data is N days old". Show one of these in the demo; a judge scoring Intelligence will value an engine that knows when not to trust itself.
- **Effort:** S each, about a day together. Raises Intelligence and Impact.

### JUDGE-05 Put the backtest in the pitch, with its limits
- **Severity:** Medium
- **Evidence:** MAE 2.1 days against a naive 3.4, band coverage 71.8 percent, Enough reliable for regular earners (DATA "What works", `docs/review/backtest/results/summary_headline.csv`, `charts/calibration.png`). But all of it is synthetic and partly circular (DATA-01), and Tight was followed by running short 24.4 percent of the time (DATA-02). No competitor publishes accuracy for irregular income (COMM-01).
- **Recommendation:** One slide or About section: "On synthetic data: within about 2 days, beats a simple baseline, worst for lumpy earners. Not yet tested on real statements." Rename "Likely between" to state its coverage. Optionally tighten Tight copy to say running short is possible.
- **Effort:** S (two hours). Raises Intelligence and Presentation.

### JUDGE-06 Write the one-page business case and pick one distribution story
- **Severity:** Medium
- **Evidence:** No buyer, pricing or metrics in README or BRIEF (COMM-11, INV-07). Landing claims "0 Bank logins needed" while the only realistic route is inside a bank app (COMM-07, PROD-06, INV-04). Overlap with nav» Money and Standard Bank Future Payments is unaddressed (PROD-02). Single-bank economics need a platform floor (COMM-02); daily paid WhatsApp costs more than the likely fee (COMM-03).
- **Recommendation:** Add a page: B2B2C licence embedded in a bank app, pilot fee plus per-active-user fee plus floor, in-app push by default, a "bank already has versus Tengo adds" table, a data contract (balance, facility limit, debit orders, 60 days of transactions; PROD-01), and four pilot KPIs. State plainly that the moat is tested copy, accuracy evidence and segment design, not code.
- **Effort:** S (half a day). Raises Sustainability by the most of any single change.

### JUDGE-07 Run five to eight user sessions and quote them
- **Severity:** Medium
- **Evidence:** No users, interviews or sessions anywhere in the repo (INV-01, COMM-05). The date-first claim is a hypothesis (BEH-08). The behavioural reviewer wrote a ready plan with tasks, pass criteria and an assumed budget of about R2 000 to R2 500 (BEH user-testing plan).
- **Recommendation:** Run the BEH plan's T1 and T2 with six drivers, hairdressers or traders after JUDGE-01 and JUDGE-03 land. Report how many read the date correctly and quote three people.
- **Effort:** M (two days). Lower score per hour than the fixes above, but the only change that moves Impact and Product traction with evidence.

### JUDGE-08 Add cash in hand
- **Severity:** Medium
- **Evidence:** The engine sees one bank account; FinScope 2023 reports 94 percent withdraw cash monthly (BEH-02); two of three personas earn cash (COMM-04, INV-10); stokvels and family transfers are absent (BEH-07). The product lead would pilot gig earners paid into the account first (PROD-07).
- **Recommendation:** A "Cash in hand" figure updated in one tap and a quick money in or out entry that feeds the forecast, with "Based on your bank account only" under the date until it is used.
- **Effort:** M (one to two days). Raises Creativity and Impact; it is the clearest answer to "why not just a bank feature".

### JUDGE-09 Make offline work on the first visit
- **Severity:** Medium
- **Evidence:** The service worker precaches only `/`, the manifest and icons, and registers on `load`, so first-visit JS and CSS are not cached (A11Y-02, TECH-05). The repo test reloads online before going offline (`tests/flows.spec.ts:131-140`), so it passes while a first-time user offline gets a blank page. Both reviewers are right; they tested different sequences.
- **Recommendation:** Precache the build output at install (vite-plugin-pwa or a generated manifest), add a plain offline fallback, and change the test to go offline straight after the first visit. Then the loadshedding claim holds in a live demo.
- **Effort:** S (two to three hours). Raises Usability and Impact.

### JUDGE-10 Small first-impression fixes on Plan, consent and privacy
- **Severity:** Low
- **Evidence:** Plan opens with a R500 what-if and R300 loan already applied (UX-06). Daily messages default on at consent (UX-09, LEGAL-03, SEC-06). Privacy shows green ticks beside encryption and access claims and a retention rule that never runs (SEC-01, SEC-02). Tight and Short are almost the same colour in light theme (UX-05).
- **Recommendation:** Start Plan empty, default messages off, swap ticks for a neutral "planned" icon and write future controls as "would", shift light Tight to amber.
- **Effort:** S (two hours together). Raises Usability and Presentation, and avoids a judge reading simulated controls as real claims.

### JUDGE-11 Confirm the name and clear the brand basics
- **Severity:** Low
- **Evidence:** The Tshivenda meaning of the name is unconfirmed and may mean "price" rather than "value" (L10N-12, INV-11); the heading font needs a commercial licence and the logo is a placeholder (COMM-10).
- **Recommendation:** Confirm the name with two Tshivenda speakers before telling the name story on stage.
- **Effort:** S. Raises Presentation.

### JUDGE-12 Script the demo around the fixed screens
- **Severity:** Low
- **Evidence:** No demo script, deck or video is in the repository. The strongest moments are Ayanda's Short warning paired with an action, the Why drawer and the loan check (UX walkthrough, BEH "What works"); the weakest are the language picker and the help card (walkthrough items 5 and 10).
- **Recommendation:** Three minutes: tagline, Ayanda Short with the reconciled daily limit, Why this date, loan check on Thabo, one pattern-break case (JUDGE-04), backtest slide with its caveat, business page. Avoid the language picker unless JUDGE-02 shipped a reviewed language.
- **Effort:** S. Raises Presentation.

## Top three risks

1. **A judge finds the contradiction first.** The landing hero and Ayanda's Home disagree with themselves; a judge who notices will doubt the forecast even where it is right (JUDGE-01; UX-01 to UX-03, INV-03).
2. **A false claim costs credibility across all criteria.** "11 Official languages" and green privacy ticks are checkable in seconds and are not true (JUDGE-02, JUDGE-10; L10N-01, SEC-02).
3. **The judge ends on harm.** "Pay your car instalment late" or "Safe to lend" to someone already Tight turns an inclusion pitch into a liability question (JUDGE-03; LEGAL-01, RISK-09, RISK-11).

## Score

6 out of 10 (criterion average 5.6). A distinct, well-built and honest prototype whose main screen contradicts itself and whose case for revenue, reach and real-world accuracy is not yet made; the top five fixes are about three working days and would move it to roughly 7.

## Sources

- FNB App of the Year, FAQs (judging rounds and the seven criteria): https://appoftheyear.co.za/faqs/ (accessed 2026-10-20)
- FNB App of the Year, 2025 Hackathon programme (found in search; listed as the closest hackathon document, covers schedule rather than scoring, not used for criteria): https://appoftheyear.co.za/wp-content/uploads/2025/10/2025-Hackathon-programme.pdf (accessed 2026-10-20)
- All other external facts are taken from the other reviewers' files, where their sources and access dates are listed.

## Findings table

| id | severity | title | evidence | recommendation | effort |
| --- | --- | --- | --- | --- | --- |
| JUDGE-01 | High | Make one rule drive the Home screen | ayanda-home-dark-1280.png Short plus R310 plus chart Enough; thabo-home-light-390.png and landing-dark-1280.png Enough until with Tight; UX-01, UX-02, UX-03, UX-04, PROD-03, INV-03, BEH-04, LEGAL-08, RISK-04, A11Y-03 | State-specific hero label, daily limit tied to state with usual spend, no state word on chart readout, one next-money date, recapture landing mock | S |
| JUDGE-02 | High | Replace the 11-languages claim and fix page language | landing stat 11 Official languages; locales identical to English (L10N-01); html lang wrong (A11Y-01, L10N-05); L10N-02; COMM-08; INV-05 | Honest stat, lang=en while pending, one reviewed Gauteng language if time allows | S |
| JUDGE-03 | High | Remove outputs that could cause harm | help.ts:62 suggests late car instalment; Safe to lend with Use button; shared buffer double counted; LEGAL-01, LEGAL-02, RISK-09, RISK-11, BEH-01, BEH-03, BEH-05, PROD-04, INV-09 | Never move credit, insurance or rent; rename safe to lend; exclude stock and fuel from cuts; estimate-not-advice line on Home, Plan, help | M |
| JUDGE-04 | High | Engine does not notice when the pattern breaks | RISK-01 S11 Enough after 35 days without pay; RISK-03; RISK-10; TECH-01 Ayanda Short to Enough after 30 days; DATA-05 missed payout 36.8 percent false reassurance | Paused income rule, no-income state, payday-today rule, asOf date and data age, with unit tests | S |
| JUDGE-05 | Medium | Put the backtest in the pitch with its limits | backtest/results/summary_headline.csv MAE 2.1 vs 3.4, coverage 71.8 percent; DATA-01 circular; DATA-02 Tight short 24.4 percent; COMM-01 | One slide or About section with synthetic caveat, stated band coverage, honest Tight copy | S |
| JUDGE-06 | Medium | No business case or single distribution story | COMM-11, INV-07 no pricing; COMM-07 0 Bank logins vs bank embed; PROD-02, PROD-06, COMM-02, COMM-03 | One page: bank-embedded licence, fees and floor, in-app push, bank-has vs Tengo-adds, data contract, pilot KPIs | S |
| JUDGE-07 | Medium | No user evidence | INV-01, COMM-05 no sessions; BEH-08 claim untested; BEH user-testing plan | Run BEH tasks T1 and T2 with six real earners after fixes; report and quote | M |
| JUDGE-08 | Medium | Cash income invisible | BEH-02 FinScope 94 percent withdraw cash; COMM-04; INV-10; BEH-07; PROD-07 | One-tap cash in hand and quick entries feeding the forecast; bank-only label until used | M |
| JUDGE-09 | Medium | Offline fails on first visit | A11Y-02 blank page after one visit; TECH-05 registration on load and naive cache; tests/flows.spec.ts:131-140 reloads online first | Precache build at install, offline fallback, test offline after first visit | S |
| JUDGE-10 | Low | First-impression issues on Plan, consent, privacy and colour | UX-06 pre-filled Plan; UX-09, LEGAL-03, SEC-06 messages on by default; SEC-01, SEC-02 ticks and retention; UX-05 light Tight vs Short | Empty Plan, messages off, neutral planned icons and conditional copy, amber Tight | S |
| JUDGE-11 | Low | Name meaning and brand assets unconfirmed | L10N-12 mutengo may mean price; INV-11; COMM-10 font licence and placeholder logo | Confirm name with two Tshivenda speakers before using the name story | S |
| JUDGE-12 | Low | No demo script built on the strongest screens | No deck or script in repo; walkthrough items 5 and 10; UX walkthrough | Three-minute script: tagline, reconciled Short, Why drawer, loan check, pattern-break case, backtest, business page | S |
