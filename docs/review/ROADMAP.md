# Roadmap

Prepared 2026-10-20 from `findings.csv` (all 13 reviewers) and the judge panel's criterion scores in `judges.md`. Every item links to finding ids. Effort: S is up to half a day, M is one to three days, L is one to three weeks. Hours are estimates for one developer familiar with the code.

## 1. Fix before hackathon submission

Ranked by expected judging score lift per hour. The judge panel (`judges.md`) scored 39 of 70 (average 5.6) and estimates that its top five fixes, about three working days, lift the entry to roughly 7. The "Lift" column splits that estimate across items: it is an **Assumption** anchored to the panel's statement and to how many reviewers raised each issue, so read it as a ranking aid, not a promise. Hours come from the effort the panel gives for each change.

| Rank | Item | Judge id | Underlying findings | Hours | Criteria raised | Lift (points of 70) | Lift per hour |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Honest languages claim ("built for 11, English today") and `lang="en"` while translations are pending | JUDGE-02 | INV-05, COMM-08, L10N-01, L10N-05, A11Y-01, L10N-13 | 1 | Presentation, Impact | 1.5 | 1.50 |
| 2 | One rule drives Home: "Tight until" for Tight, daily budget shown as not advised when Short, chart readout prefixed "If money lands as usual", one next-money date | JUDGE-01 | UX-01, UX-02, UX-03, UX-04, PROD-03, INV-03, BEH-04, LEGAL-08, RISK-04, A11Y-03, RISK-12 | 4 | Product, Usability, Presentation | 3 | 0.75 |
| 3 | Put the backtest in the pitch with its synthetic caveat and stated band coverage | JUDGE-05 | DATA-01, DATA-02, COMM-01 | 2 | Intelligence, Presentation | 1 | 0.50 |
| 4 | Three-minute demo script on the strongest screens (see `judge-qa.md`) | JUDGE-12 | walkthrough items 5 and 10 | 2 | Presentation | 1 | 0.50 |
| 5 | First-impression fixes: empty Plan, messages off by default, neutral icons and conditional privacy copy, distinct light-theme Tight and Short | JUDGE-10 | UX-06, UX-09, LEGAL-03, SEC-06, SEC-01, SEC-02, UX-05 | 2 | Usability, Presentation | 0.75 | 0.38 |
| 6 | One-page business case: bank-embedded licence, pilot fee and floor, in-app push, what the bank has versus what Tengo adds, data contract, pilot KPIs | JUDGE-06 | COMM-11, INV-07, COMM-07, PROD-02, PROD-06, COMM-02, COMM-03 | 4 | Sustainability | 1.5 | 0.38 |
| 7 | Remove harmful outputs: never move credit, insurance or rent, never suggest cutting stock or borrowing, rename "Safe to lend", disclaimer beside the safe figures | JUDGE-03 | LEGAL-01, LEGAL-02, LEGAL-06, RISK-09, RISK-11, BEH-01, BEH-03, BEH-05, PROD-04, INV-09 | 8 | Impact, Product | 2 | 0.25 |
| 8 | Notice when the pattern breaks: paused-income rule, a no-income state, payday-today rule, ageing of imported data; unit tests for each | JUDGE-04 | RISK-01, RISK-03, RISK-10, TECH-01, DATA-05 | 8 | Intelligence, Impact | 2 | 0.25 |
| 9 | Offline after the first visit: precache the build at install, offline fallback, test without the online reload | JUDGE-09 | A11Y-02, TECH-05 | 2.5 | Usability, Impact | 0.5 | 0.20 |
| 10 | Confirm the name with two Tshivenda speakers before telling the name story | JUDGE-11 | L10N-12, INV-11, COMM-10 | 2 | Presentation | 0.25 | 0.13 |
| 11 | Cash in hand and quick manual entries that feed the forecast | JUDGE-08 | BEH-02, COMM-04, INV-10, BEH-07, PROD-07 | 12 | Creativity, Impact | 1.5 | 0.13 |
| 12 | Six-person comprehension test after the fixes, quoted in the pitch | JUDGE-07 | INV-01, COMM-05, BEH-08 | 16 | Impact, Product | 2 | 0.13 |

Items 1 to 8 take about 31 hours (four working days) and carry most of the expected lift. If only one day is available, do items 1, 2, 5 and the copy parts of 7 (about 9 hours).

## 2. Fix before any real pilot

| Item | Findings | Effort |
| --- | --- | --- |
| Authenticated backend with encryption at rest and in transit, row-level security, security headers; no real data in localStorage | SEC-04, TECH-03, TECH-12, SEC-09 | L |
| Data protection impact assessment, responsible party, Information Officer, terms of use and complaints route | SEC-08, LEGAL-04, SEC-12 | M |
| Retention and deletion that actually delete (including server copies and backups), consent records that can be proved | SEC-01, SEC-05, SEC-06, SEC-07, SEC-13 | M |
| Operator agreements and cross-border assessment for any hosting, LLM or messaging provider | SEC-10, LEGAL-07, LEGAL-09 | M |
| Written regulatory position on FAIS and NCA with the partner bank's compliance team | LEGAL-05, PROD-04, INV-09 | M |
| Engine: one-offs and windfalls, price rises and skipped bills, month-end spikes, a reserve for the next large bill, background income in the headline | RISK-02, RISK-05, RISK-06, RISK-07, RISK-12, BEH-01 | L |
| Engine: band calibrated near run-out, short-history handling, shock robustness | DATA-03, DATA-04, DATA-05, DATA-06, DATA-10, RISK-08 | M |
| Validation on consented real statements, accuracy regression tests in CI, field accuracy logging | DATA-01, DATA-09, TECH-02, INV-06 | L |
| Cash entries, informal obligations (stokvel, burial society, family transfers) and multiple accounts | BEH-02, BEH-07, COMM-04, INV-10, PROD-01, PROD-07 | L |
| First-language review of all 10 languages with a money glossary; per-string review status; word order out of code | L10N-03, L10N-04, L10N-06, L10N-07, L10N-08, L10N-10, A11Y-09 | L |
| Shared-phone protection: app lock, discreet previews, quick exit; vulnerable users and children policy | A11Y-06, BEH-06, SEC-11 | M |
| Observability with privacy-safe logging; storage error handling; service worker strategy for personal data | TECH-02, TECH-04, TECH-05, SEC-09 | M |
| Bank business case with a measurable outcome and a control group | COMM-05, COMM-02, COMM-11, INV-07 | M |
| Dependency upgrades (react-router, vitest) and bundle splitting | TECH-06, TECH-08, INV-12, A11Y-14, L10N-14 | S |
| UI test coverage for the data layer and failure paths | TECH-07 | M |

## 3. Later

| Item | Findings | Effort |
| --- | --- | --- |
| Low-data and USSD channel; push before paid WhatsApp | PROD-05, COMM-03, COMM-09 | L |
| Final brand and confirmed name; commercial clearance of assets | PROD-08, COMM-10, INV-11, L10N-12 | M |
| Defensibility: design partnerships for irregular earners, evidence from pilots, second bank or sponsor channel | COMM-01, INV-02, PROD-02, COMM-09 | L |
| Remaining UX and accessibility polish (import density, microcopy, truncation, chart scale, command menu) | UX-08, UX-10, UX-11, UX-12, UX-13, A11Y-07, A11Y-08, A11Y-10, A11Y-11, A11Y-12, A11Y-13, A11Y-15, L10N-11 | M |
| Engine performance work (worker thread, memoisation) and removal of the demo latency | TECH-09, TECH-10, TECH-11 | S |
| Strategic use and gaming of the account view; anxiety and avoidance research | BEH-09, BEH-06 | M |
