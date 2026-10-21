# Data scientist, second pass on build 2

Changed areas only. Numbers come from `docs/review/after/backtest/results*/cases.csv` and one run of `src/engine/accuracy.test.ts`. All synthetic.

## 1. Verdict

Build 2 really improves payday today, paused income, thin data and Short alarm precision. But half the cases use balances chosen by each engine's own `startingBalance`, so the comparison is not like for like. On balances both engines share, the band gain disappears, and "Fixed" for the band is not supported.

## 2. Score

Now 6/10. Earlier 5/10. Up for better state logic and the counted small income. Held back by an overstated band claim and a loose guard.

## 3. DATA findings

| Id | Claimed | Verdict | Evidence |
| --- | --- | --- | --- |
| DATA-01 | Open | agree | Still synthetic. Target balances differ between engines in 5 986 of 6 054 cases. Build 2 drops 210 target_short cases. |
| DATA-02 | Partly fixed | agree | Ayanda false reassurance (seeds, 90 days): 10.0 before, 9.8 after. It rises under all 7 shocks. |
| DATA-03 | Fixed | disagree | Engine-independent balances, run-out within 6 days: 53.5 percent coverage (n 129), old 48.1. The 78.9 headline comes from target cases (83.2). Ayanda overall: 70.5. |
| DATA-04 | Fixed | partly | False reassurance at 14 days fell from 6.9 to 0.8. MAE still ties the naive baseline: 5.4 vs 5.4 at 14 days, 3.3 vs 3.3 at 28. |
| DATA-05 | Partly fixed | agree | Coverage improves under shocks. False reassurance worsens: income_missed 36.8 to 45.4. |
| DATA-06 | Partly fixed | partly | "85.8 to 90.1" mixes conventions. Under the same convention it is 75.6 to 90.1. Without day 0 paydays, 89.5 to 94.1. |
| DATA-07 | Prepared for human action | agree | The date now counts half of small income, so outflows-only MAE went from 2.1 to 4.6. Test comprehension on the new meaning. |
| DATA-08 | Partly fixed | agree | Real shortfall after a Short: 47.6 percent, up from 36.1. False alarm share of Short: 48.5 down to 28.4. |
| DATA-09 | Partly fixed | partly | The test passes: MAE 2.59, coverage 87.2, false reassurance 2.8, n 108. Thresholds are loose (DATA-A3). |
| DATA-10 | Not fixing | partly | Untested. The harness puts day 0 income in the hold-out but still subtracts all of day 0 spend. 336 of 2 160 cases are day 0 paydays. |

## 4. New findings

**DATA-A1. High. Before and after are not matched.**
Evidence: target balances come from each engine's `startingBalance` (`backtest.ts:273`). Build 2 drops 43 of the 2 160 headline cases, all target_short. On engine-independent balances (seeds, 90 days), old against new:
- Coverage: 82.0 to 79.9.
- State accuracy: 91.1 to 92.1.
- False reassurance: 2.4 to 2.5.

Recommendation: lead with the engine-independent slice. Fix target balances from one engine for both runs. Report dropped cases.

**DATA-A2. High. The band is calibrated in-sample and scored against the wrong actual.**
Evidence: `forecast.ts:68-78` says the constants were calibrated on the synthetic backtest. They are reported on the same seeds. The 60 day slice reuses those paths, so it is not a hold-out. Coverage is scored against the outflows-only run-out (`backtest.ts:354`), but the central date now aims at the with-small-income run-out. Against that actual, coverage by lead time is 76.0, 72.3, 82.9 and 76.0. Lerato at 14 to 20 days: 50.8. Mean width: 8.2 to 12.9 days.
Recommendation: tune on some seeds, report on others, and score against the actual the date means. Report coverage by persona. Change DATA-03 to Partly fixed.

**DATA-A3. Medium. The regression guard is loose and depends on its cut-offs.**
Evidence: thresholds 3.5, 78 and 5. Measured 2.59, 87.2 and 2.8. False reassurance could nearly double without a failure. Ayanda's shipped history is one path over 24 dates. Built the same way in the backtest (shipped, 60 days, independent balances), false reassurance is 6.5 (Ayanda 13 of 72), which fails the threshold. The guard does not check the baseline or any one persona.
Recommendation: use the seed generator. Set thresholds at the measured value plus noise. Add per-persona and engine-minus-baseline checks.

**DATA-A4. Medium. The baseline row is mismatched.**
Evidence: the baseline is scored outflows only. COMPARISON.md sets it beside the engine's 3.2 with small income. Like for like, the engine scores 4.6 vs 3.3 outflows only (a loss) and 3.2 vs 5.9 with small income (a win). Lerato outflows only: 8.97 vs 4.19.
Recommendation: show both baselines beside both errors.

**DATA-A5. Low. The day 0 convention flatters the fix.**
Evidence: day 0 cases are 15.6 percent of the slice. On them, state accuracy is 57.4 old and 75.1 new. Without them, the gain is 72.1 to 74.9, not 69.8 to 75.0.
Recommendation: report day 0 cases separately.

## 5. What still blocks a pilot

- No validation on real consented statements.
- No held-out, matched band evaluation. Near run-out, coverage on matched balances is 53.5 percent.
- Lumpy earners: Ayanda false reassurance is about 10 percent. A first missed payout is missed.
- No logging of shown forecasts scored 30 days later.
- The accuracy guard would not catch a doubling of false reassurance.
