# Behavioural economist: second pass on build 2

Numbers come from the seed personas on 21 Oct 2026, run through the build 2 engine with a scratch probe.

## 1. Verdict

Build 2 fixes the worst framing faults: Short shows Not advised, work costs are never cut, and cash and obligations exist. But the two money figures can still license a drop in cover. Following Lerato's daily budget for three days takes her from Enough to Tight. Room to lend in Tight can leave Thabo well below his usual spend. The research kit cannot test the date first claim it is meant to test.

## 2. Score

6 out of 10 now. It was 5 out of 10. It moves up for honest Short states, protected bills, cash and obligations. The budget and lend figures still invite harm, and nothing is tested with people.

## 3. BEH findings

| Id | Claimed status | Verdict | Evidence |
| --- | --- | --- | --- |
| BEH-01 | Partly fixed | Agree | Lerato budget R310 against usual R125, not capped (`src/engine/forecast.ts:526-527`); three days of it gives Tight. Rent is named (`en.json:405`). |
| BEH-02 | Fixed | Disagree | Accounts and cash entries exist, but no ATM or transfer rule (`forecast.ts:55` is the only transfer word). A withdrawal counts as spend and the cash out entry counts again. |
| BEH-03 | Partly fixed | Agree | "Use R…" chip still highlighted (`src/pages/Plan.tsx:271-274`); no repayment date; Lerato lends R330 and spends her budget today and drops to Tight. |
| BEH-04 | Fixed | Agree | One budget per state from one view model (`src/engine/view.ts:130-136`); chart labelled "If money lands as usual". |
| BEH-05 | Fixed | Agree | Stock and transport never trimmed (`src/engine/help.ts:42`); credit, rent and funeral cover protected (`help.ts:14-36`). |
| BEH-06 | Partly fixed | Agree | Discreet mode off by default (`src/store/session.ts:29`); Short sends the same "Budget not advised" each day (`en.json:829`). |
| BEH-07 | Fixed | Partly | Obligations count like bills, but stokvel and family support can be offered as bills to move (`help.ts:39`, `help.ts:150`), and a stokvel payout has no tag beyond one-off. |
| BEH-08 | Prepared for human action | Disagree | T2 has no balance-only condition, so it cannot compare date and balance (`docs/research/task-script.md:19-21`). |
| BEH-09 | Prepared for human action | Partly | Only "would not want someone else to see" is asked (`task-script.md:32`); nothing on showing the screen to turn down a request. |

## 4. New findings

**BEH-A1. Room to lend in Tight leaves too little to live on.** High.
Evidence: `src/engine/forecast.ts:616` only needs the state to hold and a budget above zero. Thabo is Tight with room R340. After lending it his budget is R190 a day against usual R292. Plan shows that amount with a one-tap chip (`Plan.tsx:271-274`).
Recommendation: show no amount in Tight. In Enough, cap room so the budget stays at or above usual spend. Show it net of today's budget. Remove the chip.

**BEH-A2. Cash is double counted.** High.
Evidence: no rule links a bank ATM withdrawal to cash in hand or cash out entries (`forecast.ts:55`, `src/engine/classify.ts`). People who withdraw and then log cash spending inflate usual spend, which skews every date and budget.
Recommendation: treat ATM withdrawals as transfers to cash. When cash in hand is set, ask whether recent withdrawals are already in it.

**BEH-A3. Estimated history can show Enough.** Medium.
Evidence: setup makes 60 days of synthetic history (`src/engine/setup.ts:25`), which passes the 28 day Enough gate (`forecast.ts:43`). The band reflects an invented weekly swing (`setup.ts:53`), not real variance.
Recommendation: cap estimated and sample profiles at Tight. Show the band as wide. Prompt for a week of real cash entries before Enough can appear.

**BEH-A4. Quick exit is not discreet.** Medium.
Evidence: the exit tab reads "Notes | Tengo" (`src/lib/usePageTitle.ts:5`). Its Back link returns to the app (`src/pages/Exit.tsx:12`). Without a PIN, lock does nothing (`src/components/Lock.tsx:85`), so browser Back shows amounts again.
Recommendation: no brand in the exit title, clear history, mask amounts even without a PIN, remove Back.

**BEH-A5. The research kit leads and cannot test the claim.** High.
Evidence: T2 uses R120 against Thabo's R250 budget, an easy yes that shows nothing about over-spending (`task-script.md:20`). Q10 offers two answers, but the key scores a third (`questions.md:25`, `scoring-guide.md:16`). Q11 names the right answer (`questions.md:26`). Fixed order primes answers. A design problem needs three zeros out of six (`scoring-guide.md:31`). No item covers sample or estimated labels, cash or obligations.
Recommendation: show the date first and the balance only screens to everyone, in alternating order. Set T2 on Lerato: "Can she spend R300 a day this week?" Use open questions. Any zero on Q6, Q10 or Q11 needs a fix before a pilot. Add one item on the Sample label.

## 5. What still blocks a real pilot

- The daily budget and Room to lend can still lead to a drop in cover. Fix them and re-run the probe on every persona.
- ATM and transfer handling, so cash users get a trustworthy date.
- A redesigned comprehension kit, run with six people, with results written up.
- Validation on consented real statements from cash-heavy earners, not seed data only.
- Change-based messages, discreet by default, with opt-out tracked by state.
