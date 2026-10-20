# Data scientist (forecast validation)

> **What this backtest can and cannot show.** All data here is synthetic. The seed generator (`src/data/seed/generate.ts`) and the engine (`src/engine/forecast.ts`) were written by the same author with matching assumptions: income on a fixed weekday or at bounded intervals, bills on a fixed day of the month for a fixed amount, everyday spend drawn from the same distribution every day, no missed payouts, no shocks, no cash the bank cannot see. The engine was in effect designed for this world, so good numbers here are **weak evidence of real-world accuracy**. They show the engine is internally consistent and they locate structural weaknesses (which are real, because they appear even in this friendly world). They do not show that a real irregular earner would see a date within two days of reality. The shipped generator is also thinner than it looks: across 24 cut-off dates it produces only 7 distinct random paths for Thabo, 7 for Lerato and 1 for Ayanda (`results/generator_diversity.csv`). Real-data validation is described at the end of this file.

## Verdict

On data from its own generator the engine is reasonably accurate on the headline date (mean absolute error 2.1 days with 90 days of history, bias near zero, beats a naive balance divided by average spend baseline at 3.4 days) and its range band covers the actual date 72 percent of the time overall. That headline hides three structural problems that appear even in this friendly setting: the band is too narrow exactly when the user is close to running out (54 percent coverage when money runs out within 6 days, with 28 percent running out before the "heavy week" edge); the Tight state is followed by running short 24 to 35 percent of the time and Enough is followed by running short 12 percent of the time for the lumpy spaza owner; and with 14 to 28 days of history, which the CSV import accepts, monthly bills are invisible and the engine is worse than the naive baseline and biased optimistic by up to 5.5 days. None of this has been tested on real statements, so every number below is an upper bound on what to expect in the field.

## What works

- **Headline date is accurate on its own data.** Seeds, 90 day history, 2 157 observed cases: mean absolute error 2.1 days (95 percent bootstrap interval 1.95 to 2.20), mean signed error 0.0 days, 78 percent within 3 days. Source: `docs/review/backtest/results/summary_headline.csv`, `results/bootstrap_ci.csv`, chart `docs/review/backtest/charts/error_distribution.png`.
- **It beats a naive baseline once it has 60 or more days.** Naive balance divided by 28 day mean outflow: 3.4 days MAE against the engine's 2.1 (90 days) and 2.2 (60 days). The recurring bill detection (`src/engine/classify.ts:16`) is what earns this. Source: `results/summary_by_history.csv`.
- **Overall band coverage is near its implied level and misses are balanced.** The band is the 20th to 80th percentile of weekly spend (`src/engine/forecast.ts:81-82`), which implies roughly 60 percent coverage. Observed: 71.8 percent (interval 69.1 to 74.4), 13.5 percent before the band and 14.7 percent after. Source: `results/summary_headline.csv`, `charts/calibration.png`.
- **Enough is reliable for regular earners.** For Lerato no Enough or Tight case ran short (0 of 595), for Thabo 6 of 450 Enough cases ran short (1.3 percent). Source: `results/cases.csv` via the confusion breakdown in this file.
- **Next money is right for weekday earners.** Thabo and Lerato: next money date exact in 100 percent of cases with 28 or more days of history. Source: `results/summary_by_persona_history_seeds.csv`.
- **The engine is pure, deterministic and fast enough to backtest at scale.** 12 528 forecasts (plus bisection inside `startingBalance`) ran in about 55 seconds with no mocks. This makes continuous accuracy testing cheap. Source: `docs/review/backtest/backtest.ts`, `results/console.txt`.

## Method

### Data

- **Personas:** thabo (weekly app payout plus daily cash fares), lerato (Saturday takings), ayanda (lumpy cash deposits every 4 to 9 days, irregular stock runs).
- **Cut-offs:** 24 per persona, every 15 days from 2025-10-06 to 2026-09-11, so they cover 12 months, every weekday and month boundaries.
- **Source "shipped":** `generateHistory(persona, cutoff + 30)` returns 90 days ending cutoff + 29. The first 60 days are history, the last 30 the hold-out.
- **Source "seeds":** a copy of the persona rules from `generate.ts` with the seed and length as parameters. The script asserts it reproduces `generateHistory` exactly for the shipped seed on three dates before running. Seeds `tengo:<persona>:backtest<k>:<cutoff>`, k = 1 to 5, 120 days: 90 history, 30 hold-out. This gives 120 independent paths per persona. I added it because the shipped generator repeats itself (see the box above).
- **History length:** truncated to the last 14, 28, 60 (both sources) and 90 days (seeds) before the cut-off, then reclassified with `classifyRows` on the history only, so future bill occurrences cannot leak into classification.
- **Balance at the cut-off (known):** six per case. Three from `startingBalance` with targets enough, tight and short (this uses the engine itself, so it is circular and reported separately). Three engine-independent: 7, 14 and 21 days of the history's mean daily outflow.
- **Case counts:** 9 936 unperturbed cases (1 296 shipped, 8 640 seeds) and 2 592 perturbed cases.

### Measures (day index 0 is the cut-off, the engine's "today")

- **Actual runway date (engine definition):** first day on which balance minus cumulative actual outflows (everyday spend and bills, from day 0) is zero or below, ignoring all new income. This matches `zeroDate` (`src/engine/forecast.ts:196`). Censored if not reached within 30 days (0.1 percent of seeds cases).
- **Runway error:** engine central date minus actual runway date, in days. Positive means the forecast was too late, that is too optimistic. MAE is over observed cases.
- **Actual run-out including real income:** first day the real balance (including all real income from day 1) is zero or below. Day 0 income is treated as already in the balance, as the engine does (`src/engine/forecast.ts:124`).
- **Band coverage:** share of decidable cases where the actual runway date is inside [heavy-path date, light-path date] inclusive (`src/engine/forecast.ts:305`). Undecidable when the actual is censored and the band reaches past day 29. Misses are split into "early" (ran out before the heavy-path edge, the dangerous direction) and "late".
- **Next money accuracy:** actual next money is the first day from day 1 whose income is at least the engine's own significance threshold (10 percent of typical monthly income, computed from the history). Reported as MAE of the typical date, percent exact, and percent inside the engine's earliest to latest window.
- **State in hindsight:** let A be the actual next money day and L the balance after outflows on days 0 to A-1 (no income). **Short** if L is zero or below (ran out before next money, the engine's convention that running out on the arrival day counts as covered). **Enough** if L is at least 20 percent of the outflows of that period (it would have survived a heavier stretch). **Tight** otherwise. Sensitivity with 10 and 30 percent is in the CSVs and changes overall accuracy by under 1 point for seeds.
- **Covered accuracy (binary):** engine Enough or Tight against hindsight not Short. **False reassurance:** share of all cases where the engine showed Enough or Tight and the hindsight state was Short.
- **Real shortfall:** the real balance with all real income hit zero before the next money.
- **Baseline:** balance divided by the mean daily outflow (spend and bills) of the last 28 days of history.
- **Uncertainty:** 95 percent bootstrap intervals, resampling the 360 independent seed paths with the six balances of a path kept together (`bootstrap.py`, `results/bootstrap_ci.csv`). Shipped-source numbers have no meaningful interval because they rest on 15 distinct paths.

## Backtest summary

Primary row for citing: **seeds, 90 day history, all personas**. "Cov" is band coverage; "early" is the share that ran out before the heavy-week edge. State accuracy is 3-class with the 20 percent buffer rule.

| Slice | Cases | MAE days | Bias days | Within 3 days % | Baseline MAE days | Band coverage % | Early miss % | Mean band width days | State accuracy % | Covered accuracy % | False reassurance % | Next money in window % |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Seeds, 90 day, all** | 2 160 | **2.1** (1.95 to 2.20) | 0.0 | 78.1 | 3.4 | **71.8** (69.1 to 74.4) | 13.5 | 8.2 | **71.9** (70.4 to 73.2) | 86.7 | 7.6 (6.1 to 9.2) | 85.8 |
| Seeds, 90 day, Thabo | 720 | 1.3 | 0.0 | 92.6 | 2.3 | 73.1 | 15.8 | 2.5 | 79.3 | 90.7 | 7.2 | 100.0 |
| Seeds, 90 day, Lerato | 720 | 2.1 | 1.0 | 77.1 | 4.5 | 83.3 | 1.4 | 6.8 | 73.5 | 93.1 | 0.0 | 100.0 |
| Seeds, 90 day, Ayanda | 720 | 2.9 | -0.8 | 64.4 | 3.3 | 59.0 | 23.3 | 15.2 | 62.8 | 76.2 | 15.6 | 57.5 |
| Seeds, 60 day, all | 2 160 | 2.2 | 0.2 | 78.2 | 3.3 | 71.2 | 14.8 | 8.2 | 71.3 | 85.7 | 8.4 | 83.9 |
| Seeds, 28 day, all | 2 160 | 3.9 | 1.3 | 60.6 | 3.3 | 71.2 | 14.1 | 14.3 | 64.8 | 85.6 | 7.7 | 81.9 |
| Seeds, 14 day, all | 2 160 | 5.4 | 1.3 | 53.9 | 4.2 | 59.2 | 18.2 | 14.0 | 64.0 | 78.8 | 12.3 | 63.6 |
| Shipped, 60 day, all | 432 | 1.9 | 0.3 | 76.1 | 3.4 | 65.7 | 19.3 | 14.5 | 70.6 | 89.1 | 7.6 | 100.0 |
| Shipped, 60 day, Thabo | 144 | 2.2 | -1.2 | 73.6 | 2.8 | 61.1 | 10.4 | 2.8 | 80.6 | 93.8 | 4.2 | 100.0 |
| Shipped, 60 day, Lerato | 144 | 2.0 | 0.4 | 79.0 | 4.9 | 77.6 | 5.6 | 7.1 | 72.2 | 90.3 | 2.1 | 100.0 |
| Shipped, 60 day, Ayanda | 144 | 1.7 | 1.7 | 75.7 | 2.4 | 58.3 | 41.7 | 33.4 | 59.0 | 83.3 | 16.7 | 100.0 |
| Shipped, 28 day, all | 432 | 4.1 | 1.5 | 59.9 | 3.5 | 74.0 | 15.8 | 30.0 | 68.5 | 86.8 | 8.1 | 100.0 |
| Shipped, 14 day, all | 432 | 5.1 | 0.6 | 62.6 | 4.7 | 56.3 | 25.3 | 11.0 | 62.7 | 80.1 | 14.1 | 56.9 |

Intervals in brackets are 95 percent bootstrap intervals. Lerato at 14 and 28 days: MAE 8.4 and 5.9 days, bias +5.5 and +3.6 days (`results/summary_by_persona_history_seeds.csv`).

### Other results

- **By lead time** (seeds, 90 day; `results/summary_by_lead_time.csv`): when money actually ran out on day 0 to 6, band coverage 53.5 percent with 27.5 percent before the heavy edge, state accuracy 49.8 percent, false reassurance 19.0 percent. Day 7 to 13: coverage 80.4 percent. Day 14 to 20: 88.5 percent. Day 21 to 29: 87.1 percent.
- **Shown state against hindsight** (seeds, 90 day; `charts/state_confusion.png`): Enough shown 1 349 times, 93 percent Enough, 2 percent Tight, 4.3 percent Short. Tight shown 434 times, 66 percent Enough, 9 percent Tight, 24.4 percent Short. Short shown 377 times, 67 percent Short, 33 percent covered. By persona, P(Short in hindsight given shown): Thabo Enough 1.3, Tight 32.9; Lerato Enough 0.0, Tight 0.0; Ayanda Enough 11.6, Tight 39.7. Shown Short was right 88.5 percent for Thabo, 60.0 for Lerato, 51.6 for Ayanda.
- **Real money, with real income:** the engine's runway date fell inside the 30 day hold-out in 99.9 percent of seeds cases, but the real balance reached zero within 30 days in only 20.8 percent. When the engine showed Short, the real balance hit zero before the next money in 53.1 percent of cases (background income such as card sales and cash fares carried the rest).
- **At the persona's own demo balance level** (`startingBalance` target enough, seeds 90): Ayanda ran short in hindsight in 29 of 120 Enough cases (24 percent); Thabo 6 of 120; Lerato 0.
- **Perturbations** (shipped, 60 day, 432 cases each; `results/perturbation.csv`, `charts/perturbation.png`): MAE / band coverage / false reassurance went from 1.9 / 65.7 / 7.6 with no change to: noisier daily spend 2.2 / 63.1 / 8.6; new R800 debit order 2.8 / 56.7 / 18.5; prices up 25 percent 2.9 / 52.8 / 19.9; one R2 000 emergency 3.4 / 47.5 / 17.4; income 3 days late 1.9 / 65.7 / 15.0 (next money in window falls from 100 to 0 percent); one payout missed 1.9 / 65.7 / 36.8.

## What to improve

### DATA-01 Validation is circular and the evidence base is thin
- **Severity:** High
- **Evidence:** The generator encodes the engine's assumptions: monthly bills on a fixed day at a fixed amount (`src/data/seed/generate.ts:18-20`), income on a fixed weekday or a bounded interval (`generate.ts:26, 40, 72-76`), no missed payouts, no shocks. `startingBalance` picks balances with the engine itself (`generate.ts:117-149`). The shipped seed is fixed per persona (`generate.ts:97`) and the random stream only depends on weekday alignment, so 24 cut-offs give 7, 7 and 1 distinct paths (`results/generator_diversity.csv`); Ayanda's demo history is the same on every date. The engine unit tests check rules, not accuracy (`src/engine/forecast.test.ts`). There is no real-data result anywhere in the repository.
- **Recommendation:** Treat every number in this file as an upper bound. Do not quote "2 day accuracy" in the pitch without "on synthetic data". Run the real-data validation below before any pilot claim. Make the generator seed vary with the date so demo data is not one path.
- **Effort:** L

### DATA-02 Tight and Enough give false reassurance for lumpy earners
- **Severity:** High
- **Evidence:** Seeds, 90 day: when Tight is shown ("Covered on a normal week, not on a heavy one", `src/i18n/locales/en.json:366`) the user ran out before the next money in 24.4 percent of cases (Ayanda 39.7, Thabo 32.9). Enough ("Covered until your next money, even on a heavy week", `en.json:365`) was followed by running short 11.6 percent of the time for Ayanda and 24 percent at Ayanda's own demo balance level. Overall false reassurance 7.6 percent (6.1 to 9.2). The cause: Enough only stresses spend with a constant 80th percentile weekly rate (`forecast.ts:81`) and income by one day for weekday patterns (`forecast.ts:156`); large irregular outflows such as stock runs are smoothed into the rate.
- **Recommendation:** Set state thresholds from a target error rate, for example "Enough means under 3 percent chance of running short", estimated by simulation over resampled historical weeks and income gaps. Model large irregular outflows as discrete events. Make the Tight copy say plainly that running short is a real possibility. Report P(short) per state as a tracked metric.
- **Effort:** M

### DATA-03 The band is too narrow when it matters most and too wide when it does not
- **Severity:** High
- **Evidence:** Seeds, 90 day: when money ran out within 6 days, only 53.5 percent of actual dates fell in the band and 27.5 percent fell before the heavy-week edge; at 14 to 29 days coverage is 87 to 88 percent (`results/summary_by_lead_time.csv`, `charts/calibration.png`). The band applies one constant percentile rate over the whole horizon (`forecast.ts:81-82, 196-213`), which ignores that a single fuel fill or stock run dominates a short horizon while weekly variation averages out over a long one. Ayanda coverage is 59.0 percent with 23.3 percent early misses. The band is labelled "Likely between" (`en.json:353`) with no stated coverage.
- **Recommendation:** Build the band from simulated paths (block bootstrap of historical days or weeks) and take date quantiles, so width grows with horizon correctly and lumpy outflows are represented. Pick and state a nominal coverage (for example 80 percent) and track empirical coverage by lead time.
- **Effort:** M

### DATA-04 Short histories hide bills and the engine becomes worse than a naive baseline
- **Severity:** High
- **Evidence:** Import accepts 14 days and only warns under 28 (`src/lib/csv.ts:6-7`). A bill needs 2 occurrences 24 to 36 days apart (`src/engine/classify.ts:16-21`), so no monthly bill can be detected under about 25 days and few under 60. Seeds: MAE 5.4 days at 14 days against a baseline of 4.2, and 3.9 at 28 days against 3.3. Lerato (rent R2 800 on the 1st) is biased optimistic by +5.5 days at 14 days and +3.6 days at 28. The low-confidence widening (`forecast.ts:84-85`) does not fix it: band coverage at 14 days is 59.2 percent.
- **Recommendation:** Treat a single large debit as a provisional monthly bill (or ask the user to confirm "Is this rent? Monthly?"), or fall back to mean total outflow when history is under 60 days. Do not show Enough with under 28 days of history.
- **Effort:** M

### DATA-05 Errors grow quickly under shocks the generator never produces
- **Severity:** Medium
- **Evidence:** One payout missed raises false reassurance from 7.6 to 36.8 percent; prices up 25 percent to 19.9; a new R800 debit order to 18.5; one R2 000 emergency to 17.4 with band coverage down to 47.5 percent (`results/perturbation.csv`). These events are ordinary for informal earners. The engine has no notion of income risk beyond a one day delay for weekday patterns (`forecast.ts:156`).
- **Recommendation:** Add an explicit "what if the next payout is missed" check to the state rule for Enough, update rates faster after a regime change (weight recent weeks more), and surface new debit orders as soon as they appear once.
- **Effort:** M

### DATA-06 Next money is weak for interval income
- **Severity:** Medium
- **Evidence:** Ayanda (interval pattern, seeds 90): next money inside the earliest to latest window in 57.5 percent of cases, exact 16.7 percent, MAE 2.1 days. Weekday personas score 100 percent only because the generator never misses or shifts a payout; with income 3 days late, window accuracy falls to 0 percent (`results/perturbation.csv`). The weekday window is hard-coded to typical plus one day (`forecast.ts:156`).
- **Recommendation:** Estimate the weekday window from observed lateness in the history, widen the interval window (20th to 80th percentile of 8 to 13 gaps is noisy), and show next money as a range in the copy.
- **Effort:** S

### DATA-07 The headline date is a counterfactual that never happens for most users
- **Severity:** Medium
- **Evidence:** The runway ignores all future income (`forecast.ts:196-213`). The date fell within 30 days in 99.9 percent of seeds cases, yet the real balance reached zero in only 20.8 percent. The message copy says "Your money should last until *{{date}}*" and "money lasts until {{date}}" (`en.json:666, 680`), which a user will read as a prediction that their account hits zero then. It also makes real validation harder: the quantity is not observable and must be reconstructed by removing income from statements.
- **Recommendation:** Name it for what it is ("Money you have now lasts until"), and track a second, observable target (real shortfall before next money) as the primary accuracy measure in a pilot.
- **Effort:** S

### DATA-08 Short over-warns, especially for Ayanda
- **Severity:** Medium
- **Evidence:** When Short was shown, 33 percent of cases were covered in hindsight and the real balance hit zero before next money in only 53.1 percent (Ayanda: Short right 51.6 percent). Background income (card sales, cash fares) counts toward the scrubber (`forecast.ts:242-245`) but not toward state.
- **Recommendation:** Include a conservative share of background income (for example its 20th percentile) in the state decision, and measure alarm precision as a product metric to avoid alarm fatigue.
- **Effort:** S

### DATA-09 No accuracy regression test or field measurement plan in the product
- **Severity:** Low
- **Evidence:** 66 unit tests cover rules (`docs/review/prep/checks.md`); none measures accuracy. Nothing stores past forecasts to compare with outcomes.
- **Recommendation:** Add this harness to CI with thresholds (MAE, coverage by lead time, P(short | Enough)) so engine changes cannot silently regress. In any pilot, store each shown forecast and score it against the statement 30 days later.
- **Effort:** S

### DATA-10 Day 0 is treated inconsistently
- **Severity:** Low
- **Evidence:** Income dated today is assumed to be in the balance and next money is searched from tomorrow (`forecast.ts:106, 124`), but a full day of spend is subtracted for today (`forecast.ts:205-209`). If a payout lands today but the balance feed lags, next money skips to next week. In the first backtest run, counting day 0 income as next money moved next money accuracy for weekday personas from about 87 to 100 percent exact.
- **Recommendation:** Use the timestamp of the balance and include same-day credits that are not yet in it; subtract only the rest of today's expected spend.
- **Effort:** S

## Real-data validation that is still needed

1. **Data:** consented, de-identified transaction histories of at least 120 days from irregular earners, sourced through a bank partner or user CSV imports with explicit research consent (POPIA review by the security and legal reviewers applies). Stratify by income type (weekly platform payout, weekend trade, lumpy cash deposits, grants, mixed). **Assumption:** a few hundred users per stratum would give intervals of about plus or minus 5 points on rates near 10 percent; the exact number needs a power calculation once the target rates are set.
2. **Rolling-origin evaluation:** many cut-offs per user, as here, with the same metrics, but scored on the observable target (real shortfall before next money, overdraft or declined debit order) as well as the reconstructed runway.
3. **Real-data issues the generator never produces:** pending and reversed transactions, transfers between own accounts, cash withdrawals that hide where money went, cash income never deposited, stokvel contributions and payouts, family transfers, month-end and festive season seasonality, debit orders that move or bounce.
4. **Baselines:** naive mean outflow and the bank's existing balance alert logic. The engine should beat both by a pre-registered margin.
5. **Pre-registered acceptance thresholds** before a pilot, for example P(short | Enough) under 3 percent, band coverage within 10 points of the stated level at every lead time, Short precision over 70 percent. These targets are **Assumptions** for discussion, not sourced standards.
6. **Prospective pilot:** log every forecast shown and score it 30 days later; check whether users who see Tight or Short change behaviour, since that changes the outcome the forecast is scored on.

## Top three risks

1. **False reassurance for the most vulnerable pattern.** A lumpy earner shown Enough runs short about 1 time in 9 on the engine's own data (1 in 4 at the demo balance level), and the copy says "even on a heavy week". Real data will be harsher.
2. **Accuracy claims built on circular evidence.** The only accuracy evidence is synthetic data shaped like the engine's assumptions, with one distinct path for Ayanda in the shipped generator. A judge or bank who asks "how accurate is it on real statements" has no answer yet.
3. **Short imports degrade silently.** 14 to 28 days of history, which the import allows, hides rent and other monthly bills and gives an optimistic date by several days, with a low-confidence label that does not convey the direction of the error.

## Score

5/10: an accurate and well-built engine on its own synthetic world, with clear structural calibration and state-risk weaknesses and no real-data validation yet.

## Sources

None. All figures come from the backtest in `docs/review/backtest/` run on 2026-10-20 against the code in this repository.

## Findings table

| id | severity | title | evidence | recommendation | effort |
| --- | --- | --- | --- | --- | --- |
| DATA-01 | High | Validation is circular and the evidence base is thin | Generator encodes engine assumptions (src/data/seed/generate.ts:18-20, 26, 40, 72-76); startingBalance uses the engine (generate.ts:117-149); shipped seed gives 7, 7 and 1 distinct paths over 24 dates (backtest/results/generator_diversity.csv); no real-data result exists | Treat all backtest numbers as upper bounds, say "on synthetic data" in any claim, run real-data validation before pilot claims, vary demo seed by date | L |
| DATA-02 | High | Tight and Enough give false reassurance for lumpy earners | Seeds 90 day: Tight followed by short 24.4 percent (Ayanda 39.7); Ayanda Enough followed by short 11.6 percent, 24 percent at demo balance; constant P80 rate (src/engine/forecast.ts:81) and one day income slack (forecast.ts:156); copy en.json:365-366 | Set state thresholds from a target error rate via simulation, model lumpy outflows as events, make Tight copy name the risk, track P(short) per state | M |
| DATA-03 | High | Band too narrow near run-out and too wide far out | Run-out within 6 days: 53.5 percent coverage, 27.5 percent before heavy edge; 14 to 29 days: 87 to 88 percent (backtest/results/summary_by_lead_time.csv, charts/calibration.png); constant percentile rate (forecast.ts:81-82, 196-213) | Build band from simulated paths and take date quantiles, state a nominal coverage, track coverage by lead time | M |
| DATA-04 | High | Short histories hide bills and lose to a naive baseline | Import accepts 14 days (src/lib/csv.ts:6-7); bills need 2 occurrences 24 to 36 days apart (src/engine/classify.ts:16-21); seeds MAE 5.4 vs baseline 4.2 at 14 days, 3.9 vs 3.3 at 28; Lerato bias +5.5 days | Treat single large debits as provisional monthly bills or ask the user, fall back to mean outflow under 60 days, no Enough under 28 days | M |
| DATA-05 | Medium | Errors grow fast under unmodelled shocks | Missed payout: false reassurance 7.6 to 36.8 percent; prices up 25 percent: 19.9; new R800 debit order: 18.5; R2 000 emergency: 17.4 with coverage 47.5 (backtest/results/perturbation.csv) | Add a missed-payout check to Enough, weight recent weeks more, surface new debit orders after one occurrence | M |
| DATA-06 | Medium | Next money weak for interval income | Ayanda in window 57.5 percent, exact 16.7, MAE 2.1 days; weekday window hard-coded to +1 day (forecast.ts:156); 3 day delay drops window accuracy to 0 percent | Estimate lateness from history, widen interval window, show next money as a range | S |
| DATA-07 | Medium | Headline date is a counterfactual users will misread | Runway ignores income (forecast.ts:196-213); date within 30 days in 99.9 percent of cases but real balance hit zero in 20.8 percent; copy "money lasts until" (en.json:666, 680) | Rename to money you have now lasts until, use real shortfall before next money as the primary pilot metric | S |
| DATA-08 | Medium | Short over-warns, especially for Ayanda | Shown Short: 33 percent covered in hindsight, real shortfall 53.1 percent, Ayanda Short right 51.6 percent; background income only used in scrubber (forecast.ts:242-245) | Count a conservative share of background income in the state, track alarm precision | S |
| DATA-09 | Low | No accuracy regression test or field measurement | Unit tests cover rules only (docs/review/prep/checks.md); no stored forecasts to score | Add this backtest to CI with thresholds, log and score every shown forecast in a pilot | S |
| DATA-10 | Low | Day 0 treated inconsistently | Today's income assumed in balance, next money from tomorrow (forecast.ts:106, 124), but a full day's spend subtracted today (forecast.ts:205-209) | Use balance timestamp, include pending same-day credits, subtract only remaining expected spend | S |
