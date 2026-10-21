# Hackathon judge panel, second pass on build 2

Simulated panel, not FNB judges. Criteria as in `docs/review/judges.md`.

## 1. Verdict

Build 2 fixes what a judge sees first: one story on Home, an honest language claim, and no harmful help suggestions. The pitch now overstates in new places: accuracy, harm, shared phones and accessibility.

## 2. Scores

| Criterion | Before | Now | Reason |
|---|---|---|---|
| Product | 6 | 7 | One view model drives Home (PROD-03); account sync can lose data (TECH-A1, TECH-A2). |
| Creativity | 7 | 8 | Cash, obligations, paused income and shared-phone design fit the segment. |
| Usability | 6 | 7 | Home and Plan reconciled; two "today" balances, unlabelled exit icon, lost focus (UX-A1, UX-A2, A11Y-A1). |
| Sustainability | 4 | 5 | Business case exists; one bank does not break even; bank value R0.51 per rand of licence. |
| Impact | 5 | 6 | Worst harm paths closed (LEGAL-01, RISK-09); late pay and Room to lend still cut cover; no users. |
| Presentation | 5 | 6 | Script and Q&A exist; several answers overstate (section 4). |
| Intelligence | 6 | 6 | Guards tested, but like for like the engine roughly ties the baseline and the band claim fails (DATA-A1, DATA-A2). |
| **Total** | **39** | **45** | |

## 3. JUDGE findings

| id | Claimed | Verdict | Evidence |
|---|---|---|---|
| JUDGE-01 | Fixed | agree | UX and PROD agree. New: UX-A1. |
| JUDGE-02 | Fixed | partly | Stat and html lang fixed; Inbox lang still wrong (A11Y-01). |
| JUDGE-03 | Fixed | partly | One-tap Room to lend in Tight and uncapped budget remain (BEH-A1, BEH-01, RISK-11). |
| JUDGE-04 | Fixed | partly | Late pay and stopped daily takings show Enough (RISK-A1, RISK-A2); income_missed false reassurance 36.8 to 45.4 (DATA-05). |
| JUDGE-05 | Open | partly | In script and Q&A; numbers disputed (JUDGE-A1). |
| JUDGE-06 | Open | disagree | `docs/business-case.md` covers it. Partly fixed (PROD-A3). |
| JUDGE-07 | Open | agree | No sessions; kit cannot compare date with balance (BEH-08, BEH-A5). |
| JUDGE-08 | Fixed | partly | ATM withdrawals double count (BEH-A2); summed balances hide overdraft (PROD-A1). |
| JUDGE-09 | Fixed | agree | Cold-profile tests (A11Y-02); account mode not (TECH-A4). |
| JUDGE-10 | Fixed | partly | Plan example still loads a change (UX-06); notice claims staff logging (SEC-A4). |
| JUDGE-11 | Prepared for human action | agree | Name story off; listed in `docs/HUMAN-ACTIONS.md`. |
| JUDGE-12 | Open | disagree | `docs/pitch/demo-script.md` exists. Partly fixed (JUDGE-A1). |

## 4. Overstated lines in the pitch

**JUDGE-A1. High. Accuracy (Q&A 2, script step 7, business case).** The 3 day and 80 percent claims rest on unmatched balances and in-sample tuning. On shared balances, near run-out coverage is 53.5 percent (DATA-03, DATA-A1, DATA-A2, DATA-A4).
Say: "On synthetic data, counting small income, the date is off by 3.2 days against 5.9 for a simple baseline. Counting outflows only it loses, 4.6 against 3.3. Real accuracy is unknown."

**JUDGE-A2. High. Harm (Q&A 6, Q&A 7 "No longer", script step 3 "never").** Lending in Tight leaves Thabo R190 a day against usual R292 (BEH-A1). Following Lerato's budget takes her to Tight (BEH-01). Also RISK-A3, BEH-07, LEGAL-A5.
Say: "It is built not to suggest moving credit, insurance, rent or funeral cover, or cutting stock. Room to lend and the budget still need caps."

**JUDGE-A3. High. Income stops (Q&A 3, script step 4).** Pay 51 days late shows Enough, high confidence, R2 740 to lend (RISK-A1). Daily takings stopped 20 days ago show Enough (RISK-A2).
Say: "After two missed gaps it says paused. Before that, late pay can still show Enough."

**JUDGE-A4. Medium. Accessibility (Q&A 15).** Zero axe violations is true. Manual review found lost focus and a page-resetting timer (A11Y-A1, A11Y-A2).
Say: "Zero automated violations. Manual issues remain. No TalkBack or disabled-user testing yet."

**JUDGE-A5. Medium. Shared phone (Q&A 13, script step 6).** Forgot PIN leaves a signed-in user signed in (SEC-A1). The try counter resets on reload (SEC-A5). Back after quick exit returns to Home (A11Y-06, BEH-A4).
Say: "The lock hides the screen; it does not encrypt. Untested with people."

**JUDGE-A6. Medium. Server and deletion (Q&A 11, 12, script step 6).** RLS tested on a stub (SEC-A2); saves can wipe data (TECH-A1); receipts unsigned (SEC-05).
Say: "RLS is tested in a local harness. Accounts are a demo path, not for real data yet."

**JUDGE-A7. Medium. Cash (Q&A 8 "Yes").** Cash can be counted twice (BEH-A2).
Say: "Cash entries feed the forecast. Linking ATM withdrawals is next."

**JUDGE-A8. Medium. Estimated history (Q&A 4, 9, script step 5).** Setup invents 60 days, so answers alone can show Enough (RISK-A5, BEH-A3).
Say: "Answers give a low-confidence estimate, capped at Tight once fixed."

**JUDGE-A9. Low.** Script step 2 "every number follows one rule": chart Today differs from Total (UX-A1). Label it first.

**JUDGE-A10. Low.** Q&A 18 "tested rules": say "tested on synthetic cases" (PROD-A2).

**JUDGE-A11. Low.** Q&A 1 "kit is ready": say "a draft kit" (BEH-A5).

**JUDGE-A12. Low.** Q&A 14 offline "Yes": say "in guest mode" (TECH-A4).

## 5. What stands in the way

**Winning pitch**
- Matched accuracy numbers with the baseline beside them (JUDGE-A1).
- Cap Room to lend and the budget, drop the Tight chip (JUDGE-A2).
- A late-pay rule (JUDGE-A3).
- Three comprehension sessions with a fixed kit, quoted (JUDGE-07).
- Tracker statuses for JUDGE-05, 06 and 12 that match the repo.

**Real pilot**
- Real consented statements and a held-out, matched band test (DATA-A2).
- Atomic, paged saves and a fixed PIN erase (TECH-A1, TECH-A2, SEC-A1).
- Late pay, daily recency and ATM cash rules (RISK-A1, RISK-A2, BEH-A2).
- Named responsible party, attorney review, notice matching code (LEGAL-A4).
- A bank sponsor and feed with per-account balances and debit orders (PROD-A1).
