# Outcome of build 2

Prepared 2026-10-21. A short second pass of the same simulated review panel, on the areas build 2 changed. Every reviewer worked read-only and wrote one file in this folder. This page brings them together: scores against build 1, what was fixed after the second pass, the final status of all 151 findings, and what still blocks a real pilot.

The panel is simulated. No reviewer is a bank employee, a lawyer or a real judge, and every accuracy number is from synthetic data.

## Scores

| Role | File | Build 1 | Build 2 | Why it moved |
| --- | --- | --- | --- | --- |
| Retail banking product lead | `product-lead.md` | 5 | 6 | One view model drives Home; business case has a data contract. Summed balances and no bank feed remain. |
| Technology | `technology.md` | 6 | 7 | Data age, headers, route splitting and a clean production audit. Account sync could lose data. |
| Security and privacy | `security-privacy.md` | 5 | 6 | Real row-level security, deletion and export. Client-set log times, a weak PIN lock, notice claims ahead of code. |
| Legal and regulatory | `legal.md` | 5 | 7 | Harmful suggestions blocked, "safe" removed, messages off by default. Drafts unreviewed, no named responsible party. |
| Credit risk | `credit-risk.md` | 4 | 6 | Every build 1 stress case fixed and kept as a test. Late pay and stopped daily takings still show Enough. |
| Data science | `data-scientist.md` | 5 | 6 | Real gains on payday today, paused income and Short precision. Before and after not matched; band tuned in-sample. |
| UX | `ux.md` | 6 | 7 | Home and Plan agree; Short shows Not advised. Two "today" balances, stacked notices, onboarding friction. |
| Accessibility | `accessibility.md` | 6 | 7 | Page language, slider text, focus and field borders fixed. Focus lost between onboarding steps; faint selected state. |
| Behavioural economics | `behavioural.md` | 5 | 6 | Not advised in Short, protected bills, cash and obligations. Budget and Room to lend can still drop a level. |
| Hackathon judges (out of 70) | `judges.md` | 39 | 45 | Home tells one story and harm paths are closed; the pitch overstated accuracy, harm and shared-phone safety. |

Average of the nine role scores: 5.2 in build 1, 6.4 in build 2.

## Fixed after the second pass

The panel's files describe the build before these changes. Each is small and tested where a test was possible.

| Finding | Change | Test |
| --- | --- | --- |
| SEC-A1 | Forgot PIN erase now signs out of the account and removes the sign-in keys, so account data cannot open without the PIN | `tests/account.spec.ts`, erasing after a forgotten PIN |
| TECH-A2 | Transactions are read from the server in pages of 1 000, so a long history is not cut at the first page | Typecheck only; the in-memory test server does not page (TECH-A3) |
| TECH-A1 (part) | Saves now write rows first and remove only rows that are gone, so a save that fails partway leaves the server copy whole. Saves are still not one transaction and have no conflict check | Typecheck only, same reason |
| RISK-11, BEH-A1 (part) | The one-tap "Use" amount on Room to lend shows only in Enough, never in Tight | `tests/flows.spec.ts`, Room to lend one-tap |
| A11Y-01 | Inbox message text now carries the language it is really in | Covered by the a11y scans |
| SEC-A4, LEGAL-A4 | The notice no longer claims logged staff access or a server purge that is not switched on. Notice version moved to draft 2 | i18n check |
| UX-A5 (part) | The landing page counts four statuses, including Not enough to tell | Screenshots |
| JUDGE-A1 to A12 | The demo script, judge Q&A, README and business case were rewritten to the reviewers' wording: matched accuracy with the baseline beside it, "built not to" in place of "never", late pay, cash, accounts as a demo path, lock is not encryption, offline in guest mode only | Read against each reviewer file |
| BEH-A5, BEH-08 | Research kit: neutral Q10 and Q11, a harder T2 asked on a balance-only screen and on Home, task order alternated, a design problem flagged at two scores of 0 | Read |
| Lighthouse SEO | `robots.txt` added, since the host returned the app page at that path | Lighthouse |

## Final QA

| Check | Result |
| --- | --- |
| Build, typecheck | Pass |
| Unit tests | 171 of 171 pass, 20 files |
| Lint, dash check, secrets check | Pass; no em or en dashes in tracked files or commit messages |
| i18n check | 11 locales, 1 040 keys each, placeholders and status valid |
| Fonts check | Pass |
| Contrast | 124 of 124 pairs pass in both themes |
| Bundle budget | 134.1 KB initial JavaScript gzipped, budget 142 KB |
| `npm audit --omit=dev` | 0 vulnerabilities |
| Row-level security (`npm run test:rls`) | Pass, on a local Postgres with a stub of Supabase auth (see SEC-A2) |
| Playwright, including axe in both themes and screenshots at 390, 768, 1280 and 1600 | 361 of 361 pass, no sideways overflow, zero axe violations in both themes |

Lighthouse mobile, on `vite preview` of the production build (`lighthouse/run.mjs`):

| Page | Performance | Accessibility | Best practices | SEO | FCP ms | LCP ms |
| --- | --- | --- | --- | --- | --- | --- |
| Landing `/` | 94 | 100 | 100 | 91 | 2 104 | 2 270 |
| Picker `/start` | 94 | 100 | 100 | 91 | 2 365 | 2 626 |
| Home `/app` (Thabo) | 93 | 100 | 100 | 91 | 2 254 | 2 254 |
| Onboarding `/welcome` | 92 | 100 | 100 | 91 | 2 514 | 2 919 |

SEO was 91 only because `robots.txt` was missing; it was added. For the pilot deployment it now disallows all crawling and pages send `noindex`, so Lighthouse SEO will score lower on purpose. Lighthouse accessibility of 100 is an automated score and does not cover the manual issues in `accessibility.md`.

## New findings from the second pass

The panel raised 57 new findings. They are not in `findings.csv`, which keeps the 151 from build 1; this table is their record.

| Id | Severity | Finding | Status |
| --- | --- | --- | --- |
| PROD-A1 | High | Summed bank, cash and wallet balances hide an overdrawn bank account | Open |
| PROD-A2 | High | On outflows only, the engine does not beat a plain baseline | Open (needs real data) |
| PROD-A3 | Medium | Standalone accounts pull against the bank-embedded story | Open, a founder decision |
| PROD-A4 | Low | "Not advised" sits beside the "not advice" line | Open |
| PROD-A5 | Medium | Weekly and new bills are not detected | Open |
| TECH-A1 | High | Account saves are not atomic | Partly fixed |
| TECH-A2 | High | Transactions past the first server page were lost | Fixed, untested against a real server |
| TECH-A3 | Medium | The in-memory test server hides real failure modes and ships in the bundle | Open |
| TECH-A4 | Medium | Signed-in accounts have no offline or failed-save path | Open |
| TECH-A5 | Medium | Tabs open on an old build break after a deploy | Fixed: versioned sw.js, 404 for missing build files, one reload on a missing chunk |
| SEC-A1 | High | Forgot PIN erase left a signed-in user signed in | Fixed |
| SEC-A2 | Medium | The local RLS harness does not copy Supabase's default grants | Open |
| SEC-A3 | Medium | Consent and audit times can be set by the browser | Open |
| SEC-A4 | Medium | The notice stated controls that do not exist | Fixed |
| SEC-A5 | Medium | Wrong-PIN counter resets on reload; hash beside plaintext data | Open |
| LEGAL-A1 | Medium | The notice says it will ask again on change; the app does not check the version | Open |
| LEGAL-A2 | Medium | Account sign-up does not link the notice or terms | Open |
| LEGAL-A3 | Low | The 18 or older declaration covers accounts only | Open |
| LEGAL-A4 | Medium | Notice claims ahead of the code | Fixed |
| LEGAL-A5 | Low | Protection rests on English bill names; help numbers unsourced | Open |
| RISK-A1 | High | Late pay is invisible until two full gaps pass | Open |
| RISK-A2 | High | Stopped daily income is not detected | Open |
| RISK-A3 | Medium | The reserve ignores spending in the week after payday | Open |
| RISK-A4 | Medium | With no money expected, the budget spends the balance in 30 days | Open |
| RISK-A5 | Medium | Estimated history earns Enough on day one | Open |
| DATA-A1 | High | Before and after are not matched on starting balances | Open; COMPARISON.md and the pitch now cite matched figures |
| DATA-A2 | High | The band is tuned in-sample and scored against the outflows-only actual | Open |
| DATA-A3 | Medium | The regression guard is loose | Open |
| DATA-A4 | Medium | The baseline row in COMPARISON.md is mismatched | Open |
| DATA-A5 | Low | The day 0 convention flatters the fix | Open |
| UX-A1 | Medium | Home shows two different "today" balances | Open |
| UX-A2 | Medium | Quick exit is an unlabelled icon on phones; the exit page links back | Open |
| UX-A3 | Medium | Notices stack above the date with no limit | Open |
| UX-A4 | Low | The Money page is very long on phones | Open |
| UX-A5 | Low | Onboarding friction and a stale landing count | Partly fixed |
| A11Y-A1 | High | Focus is lost on onboarding steps and notice actions | Open |
| A11Y-A2 | Medium | The discreet reveal timer remounts the page | Open |
| A11Y-A3 | Medium | Lock screen countdown is noisy; erase is one tap | Open |
| A11Y-A4 | Medium | Selected segmented option is about 1.1 to 1 | Open |
| A11Y-A5 | Low | Disabled buttons and invalid fields give no reason | Open |
| BEH-A1 | High | Room to lend in Tight leaves too little to live on | Partly fixed (no one-tap amount in Tight; no cap) |
| BEH-A2 | High | Cash is double counted after an ATM withdrawal | Open |
| BEH-A3 | Medium | Estimated history can show Enough | Open |
| BEH-A4 | Medium | Quick exit is not discreet | Open |
| BEH-A5 | High | The research kit led answers and could not test the claim | Fixed in the kit; not yet run |
| JUDGE-A1 to A12 | High to Low | Pitch lines that overstated the build | Fixed in the pitch files |

## What still blocks a real pilot

Grouped from the ten files. None of these is done.

1. **Money safety rules.** Late pay and stopped daily takings can show Enough with room to lend (RISK-A1, RISK-A2). The budget and Room to lend are not capped, so following them can drop a level (BEH-01, BEH-A1, RISK-A3, RISK-A4). ATM cash is counted twice (BEH-A2). Summed balances hide an overdraft (PROD-A1). These are engine work and need the stress tests extended first.
2. **Evidence.** No real statements and no real people. The band needs a matched, held-out test on consented real data, and the six comprehension sessions need running with the fixed kit (DATA-01, DATA-A1, DATA-A2, INV-01, JUDGE-07).
3. **Accounts before any real data.** One-transaction saves with a conflict check, tests against a real Supabase project with its real grants, server-set log times, an offline path, and the server retention job switched on (TECH-A1, TECH-A3, TECH-A4, SEC-A2, SEC-A3, SEC-01). Until then the account is a demo path.
4. **Legal and governance.** A named responsible party and registered Information Officer, attorney review of the notice, terms and the FAIS and NCA position, operator agreements, a data region and any section 72 basis, a notice re-prompt on change, and the notice linked at sign-up (LEGAL-04, LEGAL-A1, LEGAL-A2; `docs/HUMAN-ACTIONS.md`).
5. **A bank sponsor and feed.** Per-account balances and debit orders from a bank, and a buyer for the pilot; one bank at base adoption does not break even (PROD-06, COMM-02).
6. **Accessibility and shared phones in practice.** Focus management in onboarding, quick exit that clears the way back, and testing with TalkBack, low-end Android at 200 percent text and people who share phones (A11Y-A1, A11Y-06, BEH-A4).

## Final status of every finding

Counts: 57 fixed, 67 partly fixed, 22 prepared for human action, 5 not fixing, 151 in all. "Partly fixed" includes every finding a reviewer judged overstated, with the reviewer's evidence added to its resolution in `findings.csv`. Where a reviewer disagreed with "Not fixing" (UX-12), the status stays and the disagreement is recorded there.

| Prefix | Fixed | Partly fixed | Prepared for human action | Not fixing |
| --- | --- | --- | --- | --- |
| PROD | 1 | 5 | 1 | 1 |
| TECH | 7 | 5 | 0 | 0 |
| SEC | 4 | 7 | 3 | 0 |
| LEGAL | 4 | 2 | 3 | 0 |
| RISK | 5 | 7 | 0 | 0 |
| DATA | 0 | 7 | 2 | 1 |
| UX | 6 | 5 | 0 | 2 |
| A11Y | 7 | 7 | 1 | 0 |
| BEH | 2 | 5 | 2 | 0 |
| L10N | 7 | 3 | 3 | 1 |
| COMM | 5 | 4 | 2 | 0 |
| INV | 7 | 2 | 3 | 0 |
| JUDGE | 2 | 8 | 2 | 0 |

| Id | Severity | Title | Status |
| --- | --- | --- | --- |
| PROD-01 | High | Engine ignores overdraft, debit orders, holds and multiple accounts | Partly fixed |
| PROD-02 | High | Overlap with existing bank budgeting and forecast tools not addressed | Partly fixed |
| PROD-03 | High | Headline signals conflict (Enough until with Tight; Short with R310 safe to spend) | Fixed |
| PROD-04 | Medium | Credit-adjacent and advice-like copy would fail bank compliance review | Partly fixed |
| PROD-05 | Medium | No USSD or low-data channel; WhatsApp carries financial figures | Not fixing |
| PROD-06 | Medium | No realistic external data path; pilot depends on a bank sponsor | Prepared for human action |
| PROD-07 | Medium | Segment fit asserted not shown; cash-heavy persona fits bank data worst | Partly fixed |
| PROD-08 | Low | Standalone onboarding, English-only locales and placeholder brand do not fit a bank app | Partly fixed |
| TECH-01 | High | Imported or edited data never ages, so the forecast drifts towards Enough | Fixed |
| TECH-02 | High | No observability: errors, performance and forecast quality are invisible | Partly fixed |
| TECH-03 | High | The repository contract is not ready for a real backend | Partly fixed |
| TECH-04 | Medium | localStorage writes are unguarded and the storage is fragile | Partly fixed |
| TECH-05 | Medium | The service worker caching strategy is naive | Partly fixed |
| TECH-06 | Medium | One 696 KB bundle with every locale loaded at start | Fixed |
| TECH-07 | Medium | Test strategy leaves the UI, data layer and failure paths unproven | Partly fixed |
| TECH-08 | Medium | Known advisories in shipped and build dependencies | Fixed |
| TECH-09 | Low | Engine runs on the main thread and is repeated many times per render | Fixed |
| TECH-10 | Low | The fake 140 ms latency ships to production and is applied unevenly | Fixed |
| TECH-11 | Low | "Today" is fixed when the app opens | Fixed |
| TECH-12 | Low | No security or caching headers in the hosting config | Fixed |
| SEC-01 | High | Retention rule displayed as fact but never enforced | Partly fixed |
| SEC-02 | High | On-screen wording reads as real security and compliance claims | Partly fixed |
| SEC-03 | High | "Never uses names or account numbers" false for real statements | Fixed |
| SEC-04 | High | No auth, plaintext financial data in localStorage, no security headers | Partly fixed |
| SEC-05 | Medium | Deletion is local only and the receipt proves nothing | Partly fixed |
| SEC-06 | Medium | Consent bundled, messages pre-ticked, not provable | Partly fixed |
| SEC-07 | Medium | Audit log stores descriptions incl. pre-correction values; not tamper-evident | Partly fixed |
| SEC-08 | Medium | Collection notice misses section 18 items; Information Officer placeholder | Prepared for human action |
| SEC-09 | Medium | Service worker would cache personal API responses | Fixed |
| SEC-10 | Medium | No plan for operators and cross-border transfer | Prepared for human action |
| SEC-11 | Medium | Children and vulnerable users not considered | Partly fixed |
| SEC-12 | Medium | No breach response behind the sample notice | Prepared for human action |
| SEC-13 | Low | Withdrawn consent does not stop processing | Fixed |
| SEC-14 | Low | Export and import edge cases (CSV injection, unprotected files, no size cap) | Fixed |
| LEGAL-01 | High | What helps most tells users to pay credit instalments and insurance premiums late | Fixed |
| LEGAL-02 | High | Safe is an unqualified promise and the disclaimer is hidden | Fixed |
| LEGAL-03 | High | Daily messages default on and lack POPIA s69 elements | Partly fixed |
| LEGAL-04 | Medium | No responsible party, terms of use or complaints route | Prepared for human action |
| LEGAL-05 | Medium | Regulatory perimeter not documented; FAIS position depends on product links | Prepared for human action |
| LEGAL-06 | Medium | Bring in more can steer people to costly or informal credit | Fixed |
| LEGAL-07 | Medium | Cross-border transfer and sensitive inference in WhatsApp messages | Partly fixed |
| LEGAL-08 | Low | State label contradicts itself on Home | Fixed |
| LEGAL-09 | Low | Future bank use could trigger POPIA s71 and purpose creep | Prepared for human action |
| RISK-01 | High | Stopped or paused income still treated as coming | Partly fixed |
| RISK-02 | High | Safe figures leave R0 on payday and state ignores bills just after payday | Partly fixed |
| RISK-03 | High | No income can show Enough and Short refers to a non-existent next money | Fixed |
| RISK-04 | High | Safe to spend contradicts Short and is not a safe amount | Fixed |
| RISK-05 | High | One-offs, windfalls and loans distort rates and income detection | Partly fixed |
| RISK-06 | Medium | Bill detection breaks on price rise or skipped month; arrears invisible | Partly fixed |
| RISK-07 | Medium | Month-end spikes averaged away | Fixed |
| RISK-08 | Medium | Confidence and band do not reflect real uncertainty | Partly fixed |
| RISK-09 | Medium | What helps most can suggest deferring rent or credit and cutting stock | Fixed |
| RISK-10 | Medium | Payday morning shows Short and pushes next money a week | Partly fixed |
| RISK-11 | Medium | Safe to lend wording implies safety and ignores non-repayment | Partly fixed |
| RISK-12 | Low | Small daily income ignored in headline, skewing states and conflicting with chart | Fixed |
| DATA-01 | High | Validation is circular and the evidence base is thin | Prepared for human action |
| DATA-02 | High | Tight and Enough give false reassurance for lumpy earners | Partly fixed |
| DATA-03 | High | Band too narrow near run-out and too wide far out | Partly fixed |
| DATA-04 | High | Short histories hide bills and lose to a naive baseline | Partly fixed |
| DATA-05 | Medium | Errors grow fast under unmodelled shocks | Partly fixed |
| DATA-06 | Medium | Next money weak for interval income | Partly fixed |
| DATA-07 | Medium | Headline date is a counterfactual users will misread | Prepared for human action |
| DATA-08 | Medium | Short over-warns, especially for Ayanda | Partly fixed |
| DATA-09 | Low | No accuracy regression test or field measurement | Partly fixed |
| DATA-10 | Low | Day 0 treated inconsistently | Not fixing |
| UX-01 | High | Short state sits next to R310 safe to spend and R0 safe to lend | Fixed |
| UX-02 | High | Chart readout says Enough while hero says Short or Tight | Fixed |
| UX-03 | High | Headline label says Enough until when state is Tight | Partly fixed |
| UX-04 | Medium | Three different next-money dates on one screen | Fixed |
| UX-05 | Medium | Tight and Short nearly identical colour in light theme | Fixed |
| UX-06 | Medium | Plan opens with pre-filled R500 what-if and R300 loan | Partly fixed |
| UX-07 | Medium | Range band marker unlabelled and headline at edge of likely range | Fixed |
| UX-08 | Medium | Chart scale driven by optimistic band, line hugs zero, shading below R0 | Partly fixed |
| UX-09 | Medium | Daily messages on by default at consent | Fixed |
| UX-10 | Low | Import step 2 dense and summary tiles ambiguous | Not fixing |
| UX-11 | Low | Microcopy and date format inconsistencies | Partly fixed |
| UX-12 | Low | Phone first fold cuts safe to spend; tablet uses stretched phone stack; Privacy is an unlabelled icon | Not fixing |
| UX-13 | Low | Persona lists truncate role and show fixed start state | Partly fixed |
| A11Y-01 | High | Page language says Tshivenda or Sepedi while text is English (3.1.1) | Fixed |
| A11Y-02 | High | Blank page offline after a first visit | Fixed |
| A11Y-03 | High | Chart slider says Enough while headline says Short and hides bills and income | Fixed |
| A11Y-04 | Medium | Keyboard focus hidden behind fixed bottom tab bar (2.4.11) | Fixed |
| A11Y-05 | Medium | Home too dense in numbers with contradictory signals | Partly fixed |
| A11Y-06 | Medium | No privacy protection on a shared phone | Partly fixed |
| A11Y-07 | Medium | Form field borders and chart band below 3:1 (1.4.11) | Partly fixed |
| A11Y-08 | Medium | Chart data table not keyboard scrollable (2.1.1) | Fixed |
| A11Y-09 | Medium | Multilingual, low-literacy audience gets English only | Prepared for human action |
| A11Y-10 | Low | Import errors not explained or announced (3.3.1, 3.3.3, 4.1.3) | Partly fixed |
| A11Y-11 | Low | Negative amounts may be read without minus (Assumption) | Partly fixed |
| A11Y-12 | Low | Truncated descriptions and roles lose meaning | Partly fixed |
| A11Y-13 | Low | Command menu keyboard-only with unannounced groups | Fixed |
| A11Y-14 | Low | Low-end Android parses 337 KB of untranslated locale JSON | Fixed |
| A11Y-15 | Low | No plan yet for accessible login, consistent help or testing with disabled users | Partly fixed |
| BEH-01 | High | Safe to spend can license overspending and hides the next big bill | Partly fixed |
| BEH-02 | High | Model sees one bank account while users live in cash, wallets and several accounts | Partly fixed |
| BEH-03 | High | Safe to lend anchors a default and double counts the same buffer | Partly fixed |
| BEH-04 | Medium | Conflicting signals undermine comprehension and trust | Fixed |
| BEH-05 | Medium | Business inputs treated as household spending to cut | Fixed |
| BEH-06 | Medium | Daily bad news risks avoidance, anxiety and exposure on shared phones | Partly fixed |
| BEH-07 | Medium | Stokvels, burial societies, family transfers and informal credit absent | Partly fixed |
| BEH-08 | Low | Date-first behavioural claim is unproven | Prepared for human action |
| BEH-09 | Low | Account-level view can be gamed or used strategically | Prepared for human action |
| L10N-01 | High | Ten of 11 languages are English | Prepared for human action |
| L10N-02 | High | Tshivenda not in Cloud Translation; a full run would leave files inconsistent | Fixed |
| L10N-03 | High | MT money messages without glossary, context or in-message caveat | Partly fixed |
| L10N-04 | Medium | Review status is per language, not per string | Fixed |
| L10N-05 | Medium | html lang declares a language the text is not in | Fixed |
| L10N-06 | Medium | Word order and agreement fixed in code | Partly fixed |
| L10N-07 | Medium | SMS limit check only works for English and GSM | Fixed |
| L10N-08 | Medium | Layout clips expanded text | Not fixing |
| L10N-09 | Medium | Quality gates do not check translations | Fixed |
| L10N-10 | Low | Plural rules need briefing and tests | Partly fixed |
| L10N-11 | Low | Decomposed Tshivenda characters use a fallback font | Fixed |
| L10N-12 | Low | Name origin unconfirmed, may mean price not value | Prepared for human action |
| L10N-13 | Low | Demo safety label English in every language | Prepared for human action |
| L10N-14 | Low | All locales bundled eagerly | Fixed |
| COMM-01 | High | No defensible moat against the bank building it | Partly fixed |
| COMM-02 | High | Single-bank unit economics do not break even | Partly fixed |
| COMM-03 | High | Daily paid messaging costs more than the licence fee | Fixed |
| COMM-04 | High | The segment's cash income is invisible to the product | Fixed |
| COMM-05 | Medium | No evidence of outcomes for a bank buyer | Prepared for human action |
| COMM-06 | Medium | A consumer subscription does not fit the segment | Fixed |
| COMM-07 | Medium | The distribution story conflicts with the product as shown | Partly fixed |
| COMM-08 | Medium | The pitch overclaims languages | Fixed |
| COMM-09 | Low | One buyer, one channel | Partly fixed |
| COMM-10 | Low | Brand assets are not commercially cleared | Prepared for human action |
| COMM-11 | Low | No written business case in the repository | Fixed |
| INV-01 | High | Zero evidence of demand or behaviour change | Prepared for human action |
| INV-02 | High | Core insight easy to copy and partly exists | Partly fixed |
| INV-03 | High | Headline, safe to spend and chart contradict | Fixed |
| INV-04 | High | No path to real data | Prepared for human action |
| INV-05 | High | Overclaiming 11 languages | Fixed |
| INV-06 | High | Accuracy unproven, demo tuned to states | Partly fixed |
| INV-07 | Medium | Who pays is undefined | Fixed |
| INV-08 | Medium | Headline date ignores income | Fixed |
| INV-09 | Medium | Advice-like outputs raise harm exposure | Fixed |
| INV-10 | Medium | Cash and informal flows invisible | Fixed |
| INV-11 | Low | Placeholder brand and unconfirmed name | Prepared for human action |
| INV-12 | Low | Dependency vulnerabilities and one large bundle | Fixed |
| JUDGE-01 | High | Make one rule drive the Home screen | Fixed |
| JUDGE-02 | High | Replace the 11-languages claim and fix page language | Partly fixed |
| JUDGE-03 | High | Remove outputs that could cause harm | Partly fixed |
| JUDGE-04 | High | Engine does not notice when the pattern breaks | Partly fixed |
| JUDGE-05 | Medium | Put the backtest in the pitch with its limits | Partly fixed |
| JUDGE-06 | Medium | No business case or single distribution story | Partly fixed |
| JUDGE-07 | Medium | No user evidence | Prepared for human action |
| JUDGE-08 | Medium | Cash income invisible | Partly fixed |
| JUDGE-09 | Medium | Offline fails on first visit | Fixed |
| JUDGE-10 | Low | First-impression issues on Plan, consent, privacy and colour | Partly fixed |
| JUDGE-11 | Low | Name meaning and brand assets unconfirmed | Prepared for human action |
| JUDGE-12 | Low | No demo script built on the strongest screens | Partly fixed |

The full resolution text for each finding is in `docs/review/findings.csv`, columns status and resolution.
