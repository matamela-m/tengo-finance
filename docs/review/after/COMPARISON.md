# Engine before and after build 2

Prepared 2026-10-20. Compares the forecast engine at tag `build2-start` with the build 2 engine, on the review's own backtest and stress cases. Everything here is generated from the CSV files in this folder; `comparison.py` rebuilds the tables.

**Read this first.** All numbers come from synthetic histories written by the same author as the engine (see `docs/review/backtest/README.md` and DATA-01). They show whether the engine got more or less consistent with that synthetic world. They are not evidence of accuracy on real bank statements. Validation on consented real statements is listed in `docs/HUMAN-ACTIONS.md`.

## What changed in the engine

| Rule | Before | After |
| --- | --- | --- |
| Paused income | Kept expecting pay after five missed paydays | Paused after more than two usual gaps with nothing significant. No next money is counted, the state is judged over the next 30 days, confidence is low, nothing to lend |
| No income | Invented next money 30 days out | Status Not enough to tell, with the plain runway shown as a fact |
| Thin data | Any history length, zero-width bands possible | Under 14 days: Not enough to tell. 14 to 27 days: low confidence, at best Tight, wide band |
| Payday today | Pushed next money a week, often Short | Today's expected payment is pending, with a one-tap "It has come in" |
| Bills just after payday | Ignored | The part of bills due in the week after next money that a low payment would not cover is kept back from the daily budget; Enough becomes Tight if a heavy week would eat into it |
| Missed bills | Silently dropped, or turned into everyday spend | Reported as "Rent looks unpaid" for the person to answer (still owe it, or paid or stopped). One skipped month keeps a bill a bill |
| Rising bills | Median of the last three, so a rise lagged | The larger of the last two amounts |
| One-offs and loans | Counted as habit and as income | Marked items, loans and refunds (configurable words) and large unrepeated amounts are left out. Under 45 days of history a large spend still counts and the person is asked |
| Short histories | Percentile rule only | Usual spend is at least the plain average of all outflows under 45 days, so a monthly bill seen once is not missed |
| Month end | Averaged away | A month-end uplift from the 25th when history shows one; otherwise the heavy path is 25 percent heavier near month end |
| Overdraft | Short from today, depth not shown | Overdrawn amount shown as its own notice |
| Stale imports | Shifted forward silently | Forecast runs as of the statement end, says so, asks for today's balance; confidence drops after 3 days and the state is hidden after 14 |
| Small daily income | Only in the chart | Counted in the headline and the chart alike: all of it on the light path, half on the usual path, a quarter on the heavy path, and only with a regular rhythm and 28 or more days of history |
| Band | Pessimistic to optimistic zero dates | Calibrated: at least 1 day plus 15 percent of the lead either side (3 days at low confidence), at most half the lead plus 2 days |

## Backtest headline

Convention changes applied to both engines in the rerun, so they compare like for like: money landing on the cut-off day counts as next money on day 0, and a second "actual" run-out adds the small income that really arrived. The "published review" column is the original run with the original conventions.

Slice: other seeds, 90 day history, all balances (2 160 cases).

| Metric | Published review | Old engine, new conventions | Build 2 engine |
| --- | --- | --- | --- |
| Run-out error, outflows only (MAE, days) | 2.1 | 2.1 | 4.6 |
| Run-out error, with the small income that arrived (MAE, days) | n/a | 4.9 | 3.2 |
| Naive baseline error (MAE, days) | 3.4 | 3.4 | 3.3 |
| Band coverage (percent) | 71.8 | 71.8 | 81.0 |
| Band width (mean days) | 8.2 | 8.2 | 12.9 |
| State accuracy (percent) | 71.9 | 69.8 | 75.0 |
| False reassurance, outflows only (percent) | 7.6 | 5.4 | 5.9 |
| False reassurance, with the small income that arrived (percent) | n/a | 3.6 | 3.7 |
| Next money error (MAE, days) | 0.7 | 1.2 | 0.5 |
| Next money inside the shown window (percent) | 85.8 | 75.6 | 90.1 |
| Not enough to tell (percent of cases) | n/a | 0.0 | 0.0 |

**How to read the run-out error.** Before build 2 the headline counted no income at all, so it was scored against "outflows only". The build 2 headline counts a share of small daily income, so the fair comparison is the row "with the small income that arrived": the error falls from 4.9 to 3.2 days. Scored the old way it rises from 2.1 to 4.6 days, because the date now means something slightly different. Both are shown so the change cannot hide a regression.

## By history length (other seeds, all balances)

| History | Engine | MAE outflows only | MAE with small income | Band coverage | State accuracy | False reassurance | Not enough to tell |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 14 days | old | 5.4 | 6.0 | 59.2 | 65.1 | 6.9 | 0.0 |
| 14 days | build 2 | 5.4 | 6.8 | 63.6 | 3.8 | 0.8 | 5.0 |
| 28 days | old | 3.9 | 5.5 | 71.2 | 64.4 | 4.9 | 0.0 |
| 28 days | build 2 | 3.3 | 5.5 | 82.6 | 64.6 | 4.9 | 0.0 |
| 60 days | old | 2.2 | 5.0 | 71.2 | 69.3 | 6.1 | 0.0 |
| 60 days | build 2 | 5.1 | 3.5 | 80.6 | 74.6 | 6.8 | 0.0 |
| 90 days | old | 2.1 | 4.9 | 71.8 | 69.8 | 5.4 | 0.0 |
| 90 days | build 2 | 4.6 | 3.2 | 81.0 | 75.0 | 5.9 | 0.0 |

At 14 days, state accuracy drops to 3.8 percent by design: under 28 days the engine never says Enough (DATA-04), and most 14-day cases are Enough in hindsight. False reassurance there falls from 6.9 to 0.8 percent, and 5 percent of cases are Not enough to tell.

## Band coverage by lead time (other seeds, 90 days)

| Days until money actually ran out | Old coverage | Old width | Build 2 coverage | Build 2 width |
| --- | --- | --- | --- | --- |
| 0 to 6 | 53.5 | 3.6 | 78.9 | 5.5 |
| 7 to 13 | 80.4 | 7.8 | 80.4 | 13.8 |
| 14 to 20 | 88.5 | 17.6 | 78.0 | 19.1 |
| 21 to 29 | 87.1 | 13.3 | 95.6 | 30.3 |

Coverage near run-out was the main calibration problem (DATA-03). It is now close to 80 percent at every lead time up to 20 days. Beyond 20 days the band is wider than it needs to be.

## Shocks in the hold-out (shipped generator, 60 days)

| Shock in the hold-out | False reassurance, old | Build 2 | Same, with small income, old | Build 2 | Band coverage, old | Build 2 |
| --- | --- | --- | --- | --- | --- | --- |
| income_late3 | 15.0 | 23.3 | 10.4 | 13.9 | 65.7 | 82.1 |
| income_missed | 36.8 | 45.4 | 27.1 | 32.5 | 65.7 | 82.1 |
| new_bill800 | 16.2 | 18.1 | 6.9 | 11.1 | 56.7 | 63.5 |
| noise35 | 8.6 | 12.2 | 7.4 | 10.8 | 63.1 | 80.7 |
| none | 7.6 | 10.8 | 6.9 | 10.4 | 65.7 | 82.1 |
| shock2000 | 15.5 | 18.6 | 13.4 | 17.2 | 47.5 | 54.1 |
| spend+25pct | 18.8 | 23.3 | 13.0 | 15.5 | 52.8 | 62.8 |

Band coverage improves under every shock. False reassurance is higher on this slice. Most of the increase is one Ayanda path: the shipped generator produces the same random path at every cut-off (DATA-01), and counting half of her card-machine sales tips that one borderline case from Short to Tight while a stock run empties the account. On the five-seed slice above, false reassurance is unchanged (3.6 before, 3.7 after, with small income counted). Lumpy outflows are still modelled as a daily rate, which is DATA-02's open recommendation. A missed payout is still the worst case: the engine only marks income paused after two usual gaps, so the first missed payday is not caught.

## Stress cases

Each case is also a permanent unit test in `src/engine/stress.test.ts`. Full detail in `stress-results.md`.

| Case | Before (review) | After (build 2) |
| --- | --- | --- |
| S01 Baseline: weekly Friday pay, steady spend, rent on 1st, 90 days | enough; Enough until 2026-10-30; safe to spend R300; safe to lend R690 | enough, enoughUntil 2026-10-30, budget R300, room to lend R690 |
| S02 Zero income for 90 days, R4000 balance | short; Short from 2026-11-01; safe to spend R50; safe to lend R0 | unclear (noIncome), Not enough to tell, budget unclear, room to lend R0 |
| S02b Zero income for 90 days, R9000 balance | enough; Enough until 2026-12-01; safe to spend R215; safe to lend R2670 | unclear (noIncome), Not enough to tell, budget unclear, room to lend R0 |
| S03 Overdrawn: balance -R800 | short; Short from 2026-10-20; safe to spend R0; safe to lend R0 | short, shortFrom 2026-10-20, budget notAdvised, room to lend R0, notices: overdrawn |
| S04 Windfall R40000 twenty days ago on top of weekly R2000 pay | short; Short from 2026-10-30; safe to spend R0; safe to lend R0 | enough, enoughUntil 2026-10-30, budget R300, room to lend R690, notices: oneOffs |
| S04b Loan disbursement R15000 twenty days ago | enough; Enough until 2026-10-30; safe to spend R300; safe to lend R690 | enough, enoughUntil 2026-10-30, budget R300, room to lend R690, notices: oneOffs |
| S05 Missed bill: rent paid Aug and Sep, October rent unpaid | enough; Enough until 2026-10-30; safe to spend R300; safe to lend R690 | enough, enoughUntil 2026-10-30, budget R300, room to lend R690, notices: missedBill |
| S05b Missed bill mid history: rent Aug and Oct, September skipped | enough; Enough until 2026-10-30; safe to spend R300; safe to lend R680 | enough, enoughUntil 2026-10-30, budget R300, room to lend R690 |
| S06 Month-end spike: R600 a day extra from the 25th, today 24 Oct | enough; Enough until 2026-11-16; safe to spend R425; safe to lend R350 | short, shortFrom 2026-10-28, budget notAdvised, room to lend R0 |
| S07-5 Thin data: 5 days of history | short; Short from 2026-11-01; safe to spend R50; safe to lend R0 | unclear (thin), Not enough to tell, budget unclear, room to lend R0 |
| S07-7 Thin data: 7 days of history | short; Short from 2026-11-02; safe to spend R50; safe to lend R0 | unclear (thin), Not enough to tell, budget unclear, room to lend R0 |
| S07-14 Thin data: 14 days of history | enough; Enough until 2026-11-02; safe to spend R500; safe to lend R1150 | tight, tightUntil 2026-11-02, budget R500, room to lend R0 |
| S07-20 Thin data: 20 days of history | enough; Enough until 2026-11-02; safe to spend R375; safe to lend R1040 | tight, tightUntil 2026-11-02, budget R375, room to lend R0 |
| S08 Outliers: two R9000 one-off spends in the last 60 days | tight; Enough until 2026-11-01; safe to spend R750; safe to lend R2610 | enough, enoughUntil 2026-11-01, budget R750, room to lend R2490, notices: oneOffs |
| S08b Outlier in thin data: R6000 repair with 20 days of history | tight; Enough until 2026-11-14; safe to spend R750; safe to lend R2650 | tight, tightUntil 2026-10-27, budget R750, room to lend R0, notices: askOneOff |
| S09 Holiday: no income for the last 21 days, weekly pattern before | enough; Enough until 2026-11-01; safe to spend R375; safe to lend R990 | short, shortFrom 2026-11-01, budget notAdvised, room to lend R0, notices: paused |
| S10 Bill rises 30%: rent R2000, R2000, then R2600 | enough; Enough until 2026-11-13; safe to spend R750; safe to lend R1480 | enough, enoughUntil 2026-11-01, budget R750, room to lend R2490 |
| S10b Bill rises 15%: rent R2000, R2000, then R2300 | enough; Enough until 2026-11-01; safe to spend R750; safe to lend R2490 | enough, enoughUntil 2026-11-01, budget R750, room to lend R2490 |
| S11 Income stopped 35 days ago (weekly pay before that) | enough; Enough until 2026-11-01; safe to spend R625; safe to lend R1990 | short, shortFrom 2026-11-01, budget notAdvised, room to lend R0, notices: paused |
| S11b Lumpy deposits every 7 to 9 days, none in the last 40 days | enough; Enough until 2026-11-01; safe to spend R830; safe to lend R2110 | short, shortFrom 2026-11-01, budget notAdvised, room to lend R0, notices: paused |
| S12 Payday is today (Tuesday), payout not yet in balance | short; Short from 2026-10-23; safe to spend R50; safe to lend R0 | enough, enoughUntil 2026-10-23, budget pending, room to lend R0, notices: pendingToday |
| S12b Payday is today, payout already in balance (R400 + R2000) | enough; Enough until 2026-11-01; safe to spend R300; safe to lend R1380 | enough, enoughUntil 2026-11-01, budget pending, room to lend R0, notices: pendingToday |
| S13 Rent R3000 due 25 Oct, the day after the latest next money (24 Oct) | enough; Enough until 2026-10-25; safe to spend R400; safe to lend R1090 | enough, enoughUntil 2026-10-25, budget R150, room to lend R90 |
| P-thabo Persona thabo as seeded, with cash and an informal obligation | tight; Enough until 2026-10-27; safe to spend R295; safe to lend R320 | tight, tightUntil 2026-10-27, budget R260, room to lend R370 |
| P-lerato Persona lerato as seeded, with cash and an informal obligation | enough; Enough until 2026-11-01; safe to spend R330; safe to lend R280 | enough, enoughUntil 2026-11-01, budget R320, room to lend R440 |
| P-ayanda Persona ayanda as seeded, with cash and an informal obligation | short; Short from 2026-10-23; safe to spend R310; safe to lend R0 | short, shortFrom 2026-10-23, budget notAdvised, room to lend R0 |

## Cash, wallets and obligations (Phase 5)

The personas now hold some cash on hand and one informal obligation each (Thabo: R500 a month for his mother; Lerato: a R400 stokvel; Ayanda: a R150 burial society). These live in the record, not in the generated bank history, so the backtest's generator copy still matches `generateHistory` line for line and every number above is unchanged. Obligations are known in advance and projected exactly like bills, so they add no forecast error of their own; their effect on state and lending is covered by the persona stress cases and unit tests (`src/engine/setup.test.ts`, `src/engine/help.test.ts`). The persona rows in the stress table include them.

## Regression guard

`src/engine/accuracy.test.ts` runs a fixed slice of this backtest with every `npm test` and in CI (`.github/workflows/ci.yml`). It fails if the run-out error goes above 3.5 days, band coverage below 78 percent or false reassurance above 5 percent. Measured at build 2: 2.6 days, 87.2 percent and 2.8 percent.

## Still open

- No real-data validation. Every number here is synthetic.
- Lumpy outflows (stock runs) are a daily rate, not events.
- Weekday effects are not modelled; only month end is.
- The first missed payday is not caught until two usual gaps pass.
- Day 0 still subtracts a full day of spend whatever the time of day (DATA-10).
