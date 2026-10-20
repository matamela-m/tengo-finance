# Credit and finance risk analyst

## Verdict

The engine is small, pure and explainable, and its core choice (count only money already in the account, run it down at a rolling 7 day rate) is sensibly conservative for the headline date. The risk sits elsewhere. The cover state, "Safe to spend" and "Safe to lend up to" all assume the next money will arrive, and nothing checks whether it still does: income that stopped five weeks ago, a three week holiday, or an overdue lump all still produce Enough, high confidence and a lending figure of most of the balance. Every "safe" figure is sized to leave about R0 on payday, and the state looks no further than payday, so a rent payment due the day after shows as Enough with R1 090 "safe to lend". Zero income can show Enough. One-off spends, windfalls and a changed bill amount distort the rates or drop bills entirely. For a product aimed at people whose income is irregular by definition, these are the failure modes that matter most, and the unit tests do not cover any of them. Fixable in days, but not safe for real users as it stands.

## What works

- **Conservative headline.** The runway counts only money already in the account and ignores expected income, so the date errs early. Evidence: `src/engine/forecast.ts:196` to `211`, README "How the forecast works" step 4.
- **Rolling 7 day spend instead of single-day medians.** Copes with lumpy stock runs and weekly grocery shops; heavy and light paths use the same basis. Evidence: `src/engine/forecast.ts:59` to `88`, README "Decisions" (Spend paths).
- **Safe to spend uses the latest likely next money date, not the typical one, and nets off bills due before it.** Following Ayanda's R310 every day leaves R17 on 26 Oct rather than running out. Evidence: `src/engine/forecast.ts:291` to `296`; `docs/review/tools/credit-risk/results.md` row P-ayanda.
- **Overdrawn and Short cases fail safe on lending.** A balance of minus R800 gives Short, R0 safe to spend and R0 safe to lend. Evidence: `src/engine/forecast.ts:202`, `358`; results row S03.
- **Overdue interval income never lands in the past.** The overdue rule moves the window to start tomorrow. Evidence: `src/engine/forecast.ts:178` to `182`.
- **Everything is reproducible and inspectable.** One engine powers date, what-if, loan check and help, and the "Why this date" drawer shows the inputs. Engine statement coverage is 97.6 percent. Evidence: `src/engine/help.ts:24` to `26`, `docs/review/prep/coverage.txt`, fact sheet.

## What to improve

Stress test: `docs/review/tools/credit-risk/stress.ts` (run with `npx vite-node docs/review/tools/credit-risk/stress.ts`), results in `docs/review/tools/credit-risk/results.md` and `results.csv`. Scenario ids below (S01 to S13, P-persona) refer to those rows. Constructed histories are synthetic: weekly R2 000 pay on Fridays, R60 to R160 daily spend, rent on the 1st unless stated.

### RISK-01: Income that has stopped is still treated as coming

**Severity:** High

**Evidence:** The weekday rule only needs 60 percent of qualifying deposits on one weekday and has no recency check; the interval rule, when income is overdue, simply restarts the window from tomorrow (`src/engine/forecast.ts:144` to `166`, `178` to `182`). Confidence depends only on history length (`forecast.ts:30` to `34`). Results:
- S11, weekly pay stopped 35 days ago (five missed paydays): next money "23 Oct, R2 000", state Enough, confidence high, safe to lend R1 990 of a R2 500 balance.
- S09, salon closed for 21 days with no income: Enough, next money Friday, safe to lend R990.
- S11b, lumpy deposits, none for 40 days: next money 21 to 23 Oct, Enough, safe to lend R2 110.
No unit test covers stopped or paused income (`src/engine/forecast.test.ts` test list).

**Recommendation:** Count expected paydays that did not happen since the last qualifying deposit. Weekday pattern: if the last qualifying deposit is more than 10 days old, treat the pattern as broken. Interval pattern: if today is past last deposit plus the 80th percentile gap plus one typical gap, treat it as broken. When broken: pattern becomes "paused", the state can be at most Tight, safe to lend is R0, confidence drops to low, and the copy says "Your usual money has not come in since 14 Sep. Tengo is not counting on it until it does." Add unit tests for S09, S11 and S11b.

**Effort:** S

### RISK-02: Every "safe" figure leaves nothing on payday, and the state ignores what is due just after payday

**Severity:** High

**Evidence:** Safe to spend spreads the balance to exactly zero at the latest next money (`forecast.ts:294` to `296`): following it leaves R32 (Thabo), R18 (Lerato) and R17 (Ayanda) (rows P-thabo, P-lerato, P-ayanda). Safe to lend is the largest amount that keeps the state (`forecast.ts:357` to `367`); in every Enough scenario the heavy-week path is left at R0 to R10 on the latest payday (column "heavy left after lending", rows S01, S02b, S05, S09, S11, S12b, S13). The state checks only that the money reaches next money (`forecast.ts:217` to `221`), never whether next money covers what follows. S13: rent R3 000 due 25 Oct, the day after the latest next money, weekly pay about R2 000. Engine: Enough, safe to spend R400 a day, safe to lend R1 090. Following either leaves the user unable to pay rent.

**Recommendation:** (1) Extend the cover check one cycle: Enough also requires balance minus spend to next money, plus the low next-money amount, to cover heavy spend and bills up to the payday after. (2) Keep a buffer in both "safe" figures. **Assumption:** one heavy day of spend or 10 percent of the balance, whichever is larger, is a reasonable starting buffer (plausible range: one heavy day to one heavy week); validate with the backtest. (3) Subtract bills due within 7 days after next money that the low next-money amount cannot cover. (4) Cap safe to lend at the smaller of the state-keeping amount and the balance left after a full heavy week.

**Effort:** M

### RISK-03: No income can show Enough, and Short still talks about "your next money"

**Severity:** High

**Evidence:** With no qualifying deposits the engine invents a next money 30 days out (`forecast.ts:107` to `119`, `UNKNOWN_INCOME_DAYS` at `forecast.ts:28`) and then grades cover against it. S02b, 90 days with no income and R9 000 in the account: Enough, safe to lend R2 670. S02, R4 000: Short, and the state card says "Runs out N days before your next money" (`src/i18n/locales/en.json` `stateCard.short_other`) although there is no next money. S07-5 and S07-7 (5 and 7 days of history, one payday seen) fall into the same 30 day plan. A unit test asserts Enough with no history at all (`src/engine/forecast.test.ts:116` to `122`). A windfall can also trigger this path (RISK-05).

**Recommendation:** When the pattern is unknown, do not show Enough, Tight or Short. Show "No regular income found" as the state, keep the date as "Money lasts until 2 Dec if nothing comes in", set safe to lend to R0, and let the user enter an expected date and amount. Change the no-history test to expect no state.

**Effort:** S

### RISK-04: "Safe to spend" contradicts the state and is not a safe amount

**Severity:** High

**Evidence:** Ayanda is Short from 23 Oct, yet "Safe to spend today R310" (`docs/review/prep/persona-snapshot.json`, walkthrough item 2, `docs/review/screens/ayanda-home-dark-1280.png`). The two numbers use different rules: the state uses the usual spend rate against the typical next money, the figure divides the balance by days to the latest next money (`forecast.ts:217` to `221` versus `291` to `296`). R310 is 50 percent of her usual R623 a day, and about 88 percent of her everyday spend is wholesale stock (R15 137 of the 30 day breakdown), so halving it may cut the income that pays for next week. For Lerato the same label shows R330, 274 percent of her usual R120 (row P-lerato), which reads as permission to spend nearly three times her norm. The SMS repeats it: "money may run out {{date}} (Short). Safe today {{sts}}" (`en.json` `messages.sms.short`). The "not financial advice" line appears only inside the Why drawer (`src/components/forecast/WhyDrawer.tsx:145`).

**Recommendation:** Rename and reword by state. Short: "To reach 26 Oct, keep to R310 a day. You usually spend R620." Tight: "Daily limit to reach 27 Oct: R295." Enough: "You can spend up to R330 a day until 25 Oct. You usually spend R120." Never use the word "safe" when the state is Short. Show the usual daily spend beside the figure. Drop "Safe today" from the Short SMS and say "Check Tengo before spending today." Put the estimate line under the figure on Home, not only in the drawer.

**Effort:** S

### RISK-05: One-off spends, windfalls and loans distort rates, income detection and help

**Severity:** High

**Evidence:** No outlier handling in spend rates (`forecast.ts:66` to `82`) or income totals (`forecast.ts:128` to `131`). S08, two R9 000 one-offs (car repair, funeral) in 60 days: heavy rate R1 393 a day against R127 normally, state Tight, help says "cut R645 a day". S08b, one R6 000 repair in 20 days of history: band widens to 25 days. S04, a R40 000 stokvel payout lifts "typical monthly income" so the 10 percent threshold (R2 200) exceeds the R2 000 weekly pay: the pattern becomes unknown and a person with steady pay shows Short with "next money" a month away. S04b: a R15 000 loan disbursement counts as income because every positive amount is income (`src/engine/classify.ts:66`).

**Recommendation:** Winsorise daily spend before the rolling sums (cap each day at, for example, the 95th percentile of daily spend, and list capped items as "one-offs" the user can confirm). Base the significance threshold on median monthly income or exclude the single largest deposit. Tag transfers, reversals and loan payouts (description keywords plus a user toggle) as "not income". Add unit tests for S04, S04b and S08.

**Effort:** M

### RISK-06: Bill detection breaks on a price rise or a skipped month, and arrears are invisible

**Severity:** Medium

**Evidence:** All amounts must be within 20 percent of the median and every gap 24 to 36 days (`classify.ts:16` to `22`, `44` to `54`). S10, rent R2 000, R2 000, R2 600: all three become everyday spend, no November rent is projected, the heavy rate triples to R379 and the state is still Enough. S10b, a 15 percent rise: projected rent stays R2 000, the median of the last three (`classify.ts:88`). S05b, a skipped September: rent becomes spend. S05, October rent unpaid: the engine projects the next rent on 1 Nov and treats the missed R2 500 as never owed; state Enough, safe to lend R690. Only monthly bills exist, so weekly stokvel contributions or termly school fees are everyday spend.

**Recommendation:** Allow one missing cycle (gap up to 2 times the cycle) and judge tolerance against the latest amount, projecting the latest amount when the last two agree. When an expected bill has not appeared 5 days after its usual date, ask "Did you pay Rent this month?" and, if not, add it as due now. Let users mark and edit bills. Support weekly and fortnightly cycles.

**Effort:** M

### RISK-07: Month-end and seasonal spikes are averaged away

**Severity:** Medium

**Evidence:** The median of rolling 7 day sums ignores calendar position. S06, R600 a day extra spending from the 25th, today 24 Oct, balance R3 000: usual rate R128, headline "Enough until 16 Nov", safe to spend R425. The known spike costs about R4 260 over 25 to 30 Oct, so the balance is gone around 28 Oct. The README admits no month-end or seasonality modelling (`README.md:319`). Irregular earners in South Africa often face month-end and December pressure (**Assumption**, based on salaried customers and school fees spending around paydays and January; not sourced).

**Recommendation:** With 60 or more days of history, build a day-of-month uplift (ratio of spend in days 25 to 31 versus the rest) and apply it to the projected days that fall in that window. At minimum, flag "Month end is usually heavier for you" when the ratio exceeds 1.5.

**Effort:** M

### RISK-08: Confidence and the range band do not reflect real uncertainty

**Severity:** Medium

**Evidence:** Confidence is history length only (`forecast.ts:30` to `34`). The band is the spread of rolling weekly spend, so with few windows it collapses: S07-5 and S07-7 show a 0 day band at low confidence (one rolling window, so all percentiles are equal and 1.5 times zero is zero); S07-14 shows a 0 day band, an interval pattern inferred from just two paydays, Enough and safe to lend R1 150. S11 shows high confidence after income stopped. The band ignores uncertainty in the income date and amount.

**Recommendation:** Score confidence on history length, number of qualifying deposits (at least 4), gap regularity, recency of last income and outlier share. Enforce a minimum band (**Assumption:** plus or minus 1 day per week of runway at low confidence, range 0.5 to 2 days). Hide safe to lend at low confidence and say why.

**Effort:** S

### RISK-09: "What helps most" can recommend harmful actions

**Severity:** Medium

**Evidence:** The bill to move is any bill before next money whose deferral reaches the target (`src/engine/help.ts:58` to `74`). It names Thabo's R3 450 car instalment (P-thabo, walkthrough item 10) and, with zero income, suggests moving R2 500 rent (S02), where deferral may mean penalties, arrears or eviction risk. The daily cut is the money gap divided by days (`help.ts:56`), so for Ayanda it is R250 a day out of R623, mostly stock, and after a one-off repair it is R645 a day (S08). Copy: "Pay {{name}} ({{amount}}) after {{date}} instead of before." (`en.json` `help.moveBill`).

**Recommendation:** Never suggest moving rent, credit instalments, insurance or funeral policies unless the user marks the bill as flexible; when shown, say "Ask {{name}} first if you can pay on {{date}}. Late payments can cost fees or hurt your credit record." Separate business stock from household spend (the spending groups already find "stock") and phrase cuts on household spend only: "Spend about R55 less a day on household costs until 27 Oct." Cap the suggested cut at a share of usual spend (**Assumption:** 25 percent, range 15 to 35) and fall back to "Bring in R1 240 more" beyond that.

**Effort:** S

### RISK-10: Payday morning shows Short

**Severity:** Medium

**Evidence:** Next money is "always after today" (`forecast.ts:103`, `106`, `149`), so if the usual payday is today and the payout has not cleared, it is pushed a full week. S12, Tuesday payout due today, R400 in the account: Short, next money 27 Oct, help says "bring in R420". Once paid (S12b) the same person is Enough. This invites alarm and panic borrowing on the morning pay is due.

**Recommendation:** If today is the expected payday and no qualifying deposit has landed today, set earliest and typical to today and latest to tomorrow, and show "Payday today, not in yet" in place of Short until the latest date passes.

**Effort:** S

### RISK-11: Safe to lend wording implies safety and ignores repayment

**Severity:** Medium

**Evidence:** "Safe to lend up to" and "Lending up to this keeps you at {{state}}" (`en.json` `plan.safeToLend`, `plan.safeToLendHint`, shown at `src/pages/Plan.tsx:204` to `206`), with a one-tap "Use R…" button (`Plan.tsx:236` to `238`). The figure assumes the money never returns but does not say so, and in Tight it keeps only the normal-week path alive, so lending Thabo's R320 leaves his heavy week R695 short (row P-thabo).

**Recommendation:** Rename to "You could lend up to R320". Hint: "You would still reach payday on a normal week. Only lend what you can manage without getting it back." In Tight add "A heavy week would leave you short." Remove the one-tap fill or show it only in Enough.

**Effort:** S

### RISK-12: Small daily income is ignored in the headline, so states skew low and conflict with the chart

**Severity:** Low

**Evidence:** Deposits under 10 percent of monthly income are background income used only in the scrubber (`forecast.ts:135`, `259` to `262`). Ignored per day: Thabo R107, Lerato R170, Ayanda R57 (persona rows). This is part of why Ayanda's headline says Short while the chart for today says Enough (walkthrough item 3).

**Recommendation:** Add half the background rate to the central path (the heavy path keeps none), or at least show "Not counting about R107 a day in small takings" in the Why drawer. Keep the headline conservative but explain it.

**Effort:** S

### Proposed wording, summary

| Where | Now | Proposed |
| --- | --- | --- |
| Home figure, Short | Safe to spend today R310 | To reach 26 Oct, keep to R310 a day. You usually spend R620. |
| Home figure, Enough | Safe to spend today R330 | You can spend up to R330 a day until 25 Oct. You usually spend R120. |
| State, no income | Short / Runs out N days before your next money | No regular income found. Money lasts until 2 Dec if nothing comes in. |
| State, income paused | Enough | Your usual money has not come in since 14 Sep. Tengo is not counting on it. |
| Payday today | Short | Payday today, not in yet. |
| Plan | Safe to lend up to R1 090 | You could lend up to R1 090. Only lend what you can manage without getting it back. |
| Help, bill | Pay Car instalment (R3 450) after 27 Oct instead of before. | Ask the lender first if you can pay on 28 Oct. Late payments can cost fees or hurt your credit record. |
| SMS, Short | Safe today R310. | Check Tengo before spending today. |
| Under every figure | (drawer only) | An estimate from your past money, not advice. |

## Top three risks

1. **False Enough when income has stopped or never existed** (RISK-01, RISK-03): a person who lost platform access or closed for the holidays is told they are covered and can lend most of their balance.
2. **Zero-buffer "safe" figures that look only to payday** (RISK-02, RISK-04, RISK-11): following the figures exactly leaves R0 to R30 on payday and can leave rent unpaid the day after, while the word "safe" carries the authority of a bank.
3. **Harmful nudges from distorted inputs** (RISK-05, RISK-09): one-off costs and windfalls swing the state, and the help card can tell someone to defer rent or a car instalment or to halve stock purchases that generate their income.

## Score

4/10: clean, explainable and conservative on the date, but the state and "safe" figures fail exactly the irregular-income cases the product is built for, and none of them is tested.

## Sources

None. All evidence is from the repository and the stress test in `docs/review/tools/credit-risk/`. Items marked **Assumption** are unsourced judgements with stated ranges.

## Findings table

| id | severity | title | evidence | recommendation | effort |
| --- | --- | --- | --- | --- | --- |
| RISK-01 | High | Stopped or paused income still treated as coming | forecast.ts:144-166,178-182; results S09, S11, S11b: Enough, high confidence, safe to lend R990 to R2110 | Detect missed paydays, mark pattern paused, cap state at Tight, lend R0, add tests | S |
| RISK-02 | High | Safe figures leave R0 on payday and state ignores bills just after payday | forecast.ts:217-221,294-296,357-367; results S13 Enough and lend R1090 with R3000 rent next day; heavy left after lending R0 to R10 | Check cover one cycle ahead, keep a buffer, cap lending at balance after a heavy week | M |
| RISK-03 | High | No income can show Enough and Short refers to a non-existent next money | forecast.ts:28,107-119; forecast.test.ts:116-122; results S02, S02b (Enough, lend R2670), S07-5, S07-7 | Show "No regular income found", runway only, lend R0, user-entered income | S |
| RISK-04 | High | Safe to spend contradicts Short and is not a safe amount | persona-snapshot.json Ayanda Short with R310 (50% of usual, mostly stock); Lerato R330 (274% of usual); en.json messages.sms.short; WhyDrawer.tsx:145 | State-specific wording, show usual spend, drop "safe" in Short, disclaimer on Home | S |
| RISK-05 | High | One-offs, windfalls and loans distort rates and income detection | forecast.ts:66-82,128-131; classify.ts:66; results S04 (windfall makes pattern unknown), S04b, S08 (heavy R1393/day, cut R645/day) | Winsorise spend, robust income threshold, tag loans and transfers as not income | M |
| RISK-06 | Medium | Bill detection breaks on price rise or skipped month; arrears invisible | classify.ts:16-22,44-54,88; results S05, S05b, S10, S10b | Allow a missed cycle, use latest amount, ask about missed bills, weekly cycles, user-editable bills | M |
| RISK-07 | Medium | Month-end spikes averaged away | forecast.ts:59-88; README.md:319; results S06 headline 16 Nov vs runout about 28 Oct | Day-of-month uplift with 60+ days of history, or a month-end warning | M |
| RISK-08 | Medium | Confidence and band do not reflect real uncertainty | forecast.ts:30-34,83-86; results S07-5, S07-7, S07-14 zero-width band, S11 high confidence | Multi-factor confidence, minimum band, hide lending at low confidence | S |
| RISK-09 | Medium | What helps most can suggest deferring rent or credit and cutting stock | help.ts:56-74; en.json help.moveBill; results S02, P-thabo, P-ayanda, S08 | Exclude essential and credit bills unless flexible, warn about fees, cut household spend only, cap cut | S |
| RISK-10 | Medium | Payday morning shows Short and pushes next money a week | forecast.ts:103,149; results S12 Short vs S12b Enough | Treat today as payday until latest passes, "Payday today, not in yet" | S |
| RISK-11 | Medium | Safe to lend wording implies safety and ignores non-repayment | en.json plan.safeToLend, plan.safeToLendHint; Plan.tsx:204-206,236-238; results P-thabo heavy week R695 short | Rename, add "only lend what you can manage without", warn in Tight | S |
| RISK-12 | Low | Small daily income ignored in headline, skewing states and conflicting with chart | forecast.ts:135,259-262; results P rows R57 to R170 a day ignored; walkthrough item 3 | Count half the background rate on the central path or disclose it | S |
