# Credit risk, second pass on build 2

Engine tests: 104 of 104 pass. Probes ran on a copy of the engine, today 2026-10-20 unless stated.

## 1. Verdict

Build 2 fixes the cases I wrote down, and each is now a permanent test. The fixes are tuned to those cases. Late pay short of two full gaps, stopped daily takings and the week after payday still give Enough, high confidence and room to lend.

## 2. Score

Now 6/10. Earlier 4/10. No income, long pauses, payday morning and one-offs are now handled and tested; late pay and daily income are not.

## 3. Finding check

| id | claimed | verdict | evidence |
| --- | --- | --- | --- |
| RISK-01 | Fixed | partly | S09, S11, S11b paused, lend R0. Monthly salary 51 days since last: high, Enough, lend R2 740 (A1). |
| RISK-02 | Fixed | partly | S13 reserve R1 000, but following the budget ends at minus R667 (A3). |
| RISK-03 | Fixed | agree | S02, S02b: unclear, no next money, lend R0; `forecast.ts:518`. |
| RISK-04 | Fixed | agree | Short shows Not advised (`view.ts:132`); usual spend shown. |
| RISK-05 | Fixed | partly | S04, S04b, S08 fixed. New misfire: tips R60 a day plus "Salary" R6 000 twice in 50 days; both salaries dropped as one-offs (`forecast.ts:189`). |
| RISK-06 | Partly fixed | agree | S05 flags the bill but stays Enough, lend R690, until answered. |
| RISK-07 | Fixed | agree | S06 now Short from 28 Oct, was Enough until 16 Nov. |
| RISK-08 | Fixed | partly | Band never zero (S07-14). Confidence ignores late pay: A1, A2 show high. |
| RISK-09 | Fixed | agree | Only earn, trim flexible, move a marked bill (`help.ts:14`, `151`). |
| RISK-10 | Fixed | partly | S12 pending. A day late (Tuesday pay, today 21 Oct, R300) it is Short, next money 27 Oct, though `latest` allows that day. |
| RISK-11 | Fixed | partly | Renamed, caution added. One-tap "Use" still shows in Tight (`Plan.tsx:271`), no heavy-week warning; Thabo's Tight room rose R320 to R370. |
| RISK-12 | Fixed | agree | Same shares in headline and chart (`forecast.ts:62`, `470`). |

## 4. New findings

### RISK-A1: Late pay is invisible until two full gaps pass

**Severity:** High

**Evidence:** Paused needs more than 2 gaps (`forecast.ts:254`, `283`); until then next money rolls to tomorrow. Monthly R8 000 salary last on 15 Sep, R3 000 balance: at 32, 40 and 51 days, high confidence, Enough, next money two days out, budget R1 500 a day (usual R122), room to lend R2 740. One missed weekly Friday: Enough, high, room R1 990 of R2 500.

**Recommendation:** Past the latest expected date, mark income late: confidence at most medium, room to lend R0, notice "Your usual money is late". Pause monthly income after 1.5 gaps.

### RISK-A2: Daily income rhythm has no recency check

**Severity:** High

**Evidence:** Daily rhythm needs income on half of 60 days, averaged over all 60 (`forecast.ts:230`, `235`). Card sales R300 six days a week, stopped 20 days ago, R9 000: high confidence, Enough, R170 a day still counted, room to lend R3 750.

**Recommendation:** Use the last 14 days for the rate. Pause a daily earner after 5 days with no income.

### RISK-A3: The reserve ignores spending in the week after payday

**Severity:** Medium

**Evidence:** Reserve is bills in the 7 days after next money less the low payment (`forecast.ts:502`); that week's spend is ignored. S13: budget R150 to 22 Oct, then usual R117, R2 000 Fridays: minus R200 on 25 Oct, minus R667 on 29 Oct. A R1 500 stokvel on 25 Oct: reserve R0, same R375 budget, R58 left on 29 Oct.

**Recommendation:** Reserve = bills plus heavy spend from next money to the following payday, less the low payment.

### RISK-A4: With no money expected, the budget spends the balance in 30 days

**Severity:** Medium

**Evidence:** With no next money the budget spreads the balance over 30 days (`forecast.ts:489`, `526`). Paused income, R9 000: Enough, budget R300 a day, usual R117. That is R0 in a month with nothing coming.

**Recommendation:** When income is paused or daily, cap the budget at usual spend, or spread the balance over the full runway.

### RISK-A5: Estimated history earns Enough on day one and invents regularity

**Severity:** Medium

**Evidence:** Setup makes 60 days of history (`setup.ts:25`), so the 28 day cap on Enough (`forecast.ts:513`) never applies. Weekly, monthly and irregular answers with R4 000 all give Enough; weekly gives R1 000 a day, usual R194. "Irregular, about every 10 days" becomes regular with next money on one exact day.

**Recommendation:** Count only real days for the caps. Cap estimated profiles at Tight. Give irregular answers a spread.

## 5. What still blocks a real pilot

- Late pay (RISK-A1) and stopped daily income (RISK-A2) still show Enough, high confidence and room to lend.
- One-tap room to lend in Tight, with no heavy-week warning.
- Unanswered missed bills are not reserved: S05 lends R690 against unpaid rent.
- The windfall rule can drop real salary or grants for mixed earners.
- All tuning is synthetic. No real statements backtested for false reassurance.
