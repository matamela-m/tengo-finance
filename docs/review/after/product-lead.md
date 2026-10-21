# Retail banking product lead: second pass on build 2

Simulated perspective. I am not FNB staff and know nothing of any bank's internal policy. This pass covers changed areas only.

## Verdict

Build 2 fixes the thing a bank would notice first: Home now tells one story, driven by one selector, and the advice-like copy is mostly gone. The business case now has a data contract, a "bank has versus Tengo adds" table and a pilot with a control group. But the engine still works on one summed balance, beats a plain baseline by a tenth of a day on synthetic data, and the new consumer accounts pull the product away from the bank-embedded pitch.

## Score

6/10 now, 5/10 before. It moved because the headline is coherent and the bank pitch is written down, not because the bank data gaps are closed.

## Findings check

| id | Team status | My verdict | Evidence |
| --- | --- | --- | --- |
| PROD-01 | Partly fixed | Partly | Overdraft depth is shown (src/engine/view.ts:139), but it is computed on the summed total (src/engine/forecast.ts:540, src/data/repository.ts:23). No facility limit, no scheduled debit orders, no credit account type (src/data/repository.ts:7). |
| PROD-02 | Open | Disagree (understated) | docs/business-case.md:21-30 now has the "bank already has, Tengo adds" table and narrows the claim to the run-out date. Mark it Partly fixed; the pitch deck still needs the same slide. |
| PROD-03 | Fixed | Agree | src/engine/view.ts:125-172 builds every Home element from one view model; Home reads it (src/pages/Home.tsx:152); Short shows "Not advised", no number (src/pages/Home.tsx:94). 171 unit tests pass, including view.test.ts. |
| PROD-04 | Fixed | Partly | Credit and burial moves are blocked (src/engine/help.ts:38-39) and the not-advice lines exist (src/i18n/locales/en.json:523, 657). But Plan's largest figure is still a lending amount, "Room to lend" at 44px (src/pages/Plan.tsx:228-229), and Home's "Not advised" (en.json:409) reads as advice. |
| PROD-05 | Open | Agree | WhatsApp is still the default framing of messages (en.json:184, 798). No USSD path anywhere in src. |
| PROD-06 | Open | Agree | CSV import and manual setup only. The data contract (docs/business-case.md:32-38) is a request, not a sponsor. |
| PROD-07 | Partly fixed | Agree | Personas gained cash and obligations; docs/research holds a test kit, but no sessions have run. Segment fit is still asserted. |
| PROD-08 | Partly fixed | Partly | The new onboarding is a standalone four-step wizard, which is further from a one-screen in-app opt-in on bank consent, not closer. Locales are still English only. |

## New findings

**PROD-A1. Summed accounts hide a bank overdraft. High.**
Evidence: src/data/localRepository.ts:216 and src/data/repository.ts:23 sum bank, cash and wallet into one balance; src/engine/forecast.ts:540 flags overdraft only when that total is below zero. An overdrawn bank account plus more cash in hand than the overdraft shows no overdraft notice and is judged on the positive total, while debit orders bounce from the bank account.
Recommendation: forecast the bank account on its own for bills drawn from it, show overdraft per account, and tie each recurring bill to its source account.

**PROD-A2. The engine barely beats a plain baseline. High.**
Evidence: docs/review/after/COMPARISON.md:36 gives naive baseline error 3.3 days; the build 2 headline error with small income is 3.2 days (same table). The first missed payday is not caught (COMPARISON.md:86, 134). Yet docs/business-case.md:30 sells "the tested rules".
Recommendation: put the baseline next to every accuracy claim in the pitch, and set a pilot pass mark relative to the baseline on real data.

**PROD-A3. Consumer accounts pull against the bank-embedded model. Medium.**
Evidence: supabase/migrations/20261021000000_tengo_accounts.sql adds Tengo-held customer data and email sign-in; docs/business-case.md:7 says the product lives inside the bank's own app, and line 76 treats the account storage as a side cost.
Recommendation: label own-profile and accounts as the demo and research path. In the bank pitch, state that the embedded build uses the bank's identity and consent and holds no customer data on a Tengo server.

**PROD-A4. "Not advised" contradicts the not-advice line. Low.**
Evidence: src/i18n/locales/en.json:409 "Not advised" sits on the same page as en.json:412 "not advice".
Recommendation: use a descriptive label such as "Nothing spare to spend".

**PROD-A5. Weekly and new bills are missed. Medium.**
Evidence: README.md:129 says recurring bills need two monthly payments and weekly bills are not detected. Weekly stokvel, transport or debit order patterns fall into everyday spend.
Recommendation: take scheduled debit orders from the bank feed as known bills, and detect weekly intervals.

## What still blocks a real pilot

- No named bank sponsor and no internal data feed. The data contract is written but unsigned.
- Balance handling is not bank-grade: one summed balance, no facility limit, no scheduled debit orders.
- Value to the bank is weak by the team's own model: R0.51 of value per rand of licence (docs/business-case.md:57).
- No evidence on real statements or real people: the backtest is synthetic and the comprehension sessions have not run.
- No compliance review of the copy or the regulatory position (docs/HUMAN-ACTIONS.md:12).
