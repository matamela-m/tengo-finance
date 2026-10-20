# Retail banking product lead (FNB-style)

Simulated perspective. I am not FNB staff and know nothing of FNB's internal policy, systems, roadmap or pricing. Everything about banks below comes from public pages cited in Sources.

## Verdict

Tengo has one idea a bank app does not clearly offer today: a date-first answer ("Enough until Tue 27 Oct") built on how irregular income actually arrives, with a range and a plain state. That is a real gap next to what is public: FNB's nav» Money does categorised spend, smart budgets and alerts and reports five million users; Standard Bank's Future Payments add-on already forecasts debits 14 and 30 days ahead; Standard Bank's Budget Manager pre-fills a budget; Capitec auto-categorises spend; Absa publicises a Savings Coach. None of those, as publicly described, predicts when income lands or turns that into a run-out date. But as a bank product it is not pilot-ready. The engine ignores the things a bank knows best and that matter most to this segment (overdraft and credit limits, scheduled debit orders, multiple accounts, pending card holds), the headline mixes signals ("Enough until" next to a Tight chip), the Plan page uses credit-adjacent language ("Safe to lend up to") that a bank's compliance team would not ship as is, and there is no USSD or low-data path for the customers it claims to serve. The best route is not a separate app but a single "until when" card inside an existing money-management area, fed by internal transaction data, piloted with a narrow segment whose income is paid into the account (e-hailing and platform earners) before anyone whose income is mostly cash.

## What works

- **A crisp, distinct core answer.** The Home hero leads with one date, a state word, an icon and a three-segment gauge, then a range and "Next money around". Evidence: `docs/review/screens/thabo-home-dark-1280.png`, `docs/review/screens/ayanda-home-dark-390.png`, `src/components/forecast/DateHero.tsx:9`.
- **Income cadence is modelled, not assumed monthly.** Weekday patterns for daily earners and gap percentiles for lumpy earners give an earliest, typical and latest next money. That is the piece salaried-oriented bank budgeting tools do not publicly describe. Evidence: `docs/review/prep/fact-sheet.md` (Forecast engine), `src/engine/forecast.ts:103`, `docs/review/prep/persona-snapshot.json` (`pattern`: weekday versus interval).
- **Transparent and explainable.** The "Why this date" drawer lists every input, which suits a bank's need to explain automated outputs to customers and complaints teams. Evidence: `docs/review/screens/thabo-why-drawer-dark-1280.png`, README "How the forecast works, in plain words".
- **Integration-friendly seams.** All data access sits behind `TengoRepository` and messages behind `MessageWriter`, so a bank could swap in an internal data feed and its own notification service without touching UI. Evidence: `src/data/repository.ts`, `src/data/index.ts`, README "What is simulated".
- **Engine is small, pure and tested.** 97.6 percent statement coverage in `src/engine`, which lowers the cost of a bank team re-implementing or validating it server side. Evidence: `docs/review/prep/fact-sheet.md` (Quality signals), `docs/review/prep/coverage.txt`.
- **Daily message is privacy-aware by design.** The preview promises only the date, cover and safe-to-spend figure, never balance or transactions. Evidence: `docs/review/screens/thabo-inbox-dark-390.png`.

## What to improve

**PROD-01. The engine ignores the bank data that defines this customer's real position.**
- **Severity:** High
- **Evidence:** `zeroDate` treats zero as the end of money (`src/engine/forecast.ts:196` to `210`, "if (bal <= 0) return date"). There is no input for an overdraft or credit facility limit, scheduled debit orders or future-dated payments, pending card authorisations, or more than one account. Bills are inferred from history only (same description, within 20 percent, 24 to 36 days apart, at least twice: `src/engine/classify.ts:16`), so a new debit order or an annual premium is invisible. FNB publicly offers app-based overdraft applications (fnb.co.za overdraft page), and Standard Bank's Future Payments already predicts upcoming debits from recurring payments. A bank customer with a R2 000 overdraft who is at R0 is not "out of money" in the bank's view, and a customer with a debit order next week that has only run once is at risk Tengo cannot see.
- **Recommendation:** Define a bank data contract for the engine: available balance versus ledger balance, facility limit and whether to count it (default off, shown separately as "then you would be using your overdraft"), scheduled debit orders and future-dated payments as known bills, and an account set. Keep inferred bills as a fallback.
- **Effort:** M

**PROD-02. Overlap with existing bank tools is not addressed, so the proposition reads as "another budgeting screen".**
- **Severity:** High
- **Evidence:** FNB nav» Money: auto-categorised spend, smart budgets with alerts, credit status, saving goals, five million users and 1.1 million smart budgets (ITWeb, March 2025). Standard Bank: Budget Manager, Money Movements and Future Payments with 14 and 30 day predicted debits (Standard Bank pages). Capitec: automatic spend categorisation (Capitec blog). Tengo's Money page repeats categorisation and a recurring bills list (`docs/review/screens/lerato-money-dark-1280.png`), and the spending breakdown is keyword-based (`src/engine/spending.ts`), which is weaker than a bank's merchant-coded categories. Nothing in the app or README positions it against these.
- **Recommendation:** Narrow the bank pitch to the one thing that is new: an income-aware run-out date and safe-to-spend figure for irregular earners. Drop or de-emphasise categorisation in the bank version and show how the date card would sit beside an existing budgeting tool. Add a one-page "what a bank already has versus what Tengo adds" slide.
- **Effort:** S

**PROD-03. Headline signals conflict, which in a bank app means complaints and call-centre volume.**
- **Severity:** High
- **Evidence:** Thabo shows "Enough until Tue 27 Oct" with a Tight chip: the label is "Enough until" for every non-Short state (`src/components/forecast/DateHero.tsx:9`, `docs/review/screens/thabo-home-dark-1280.png`). Ayanda is Short from Fri 23 Oct yet "Safe to spend today R310", while her usual daily spend is R623, and the 30 day chart readout for today says Enough (`docs/review/screens/ayanda-home-dark-390.png`, `docs/review/prep/persona-snapshot.json`). The same "Enough until" plus Tight pairing appears in Plan (`docs/review/screens/thabo-plan-dark-1280.png`, `src/pages/Plan.tsx:44`).
- **Recommendation:** Use a neutral label ("Lasts until" or "Covered until") for all states, and make the safe-to-spend figure obey the state (for Short, show the gap or the cut needed rather than a positive spend figure). Make the chart readout say "if money lands as usual" next to the state, not in small print.
- **Effort:** S

**PROD-04. Credit-adjacent and advice-like copy would not pass a bank's brand and compliance review as written.**
- **Severity:** Medium
- **Evidence:** Loan check headline "Safe to lend up to R320" (`src/i18n/locales/en.json:523`, `docs/review/screens/thabo-plan-dark-1280.png`). "What helps most" suggests paying the car instalment after its due date (`docs/review/screens/thabo-home-dark-1280.png`, persona snapshot `help.billToMove`: "Car instalment"), which for a bank that may hold that very loan is a direct conflict. "You could set aside up to" (`en.json:702`) edges towards a savings recommendation. Whether any of this is regulated advice is for the legal reviewer; my point is that a bank's own compliance and brand teams would block it by default.
- **Recommendation:** Reword to descriptive outcomes ("If you lend R300, your date moves to Mon 26 Oct"), remove "safe" from lending, never suggest delaying a credit repayment, and add a short "This is an estimate, not advice" line on Plan. Prepare the copy set for a compliance review before any pilot.
- **Effort:** S

**PROD-05. No channel fit for the lowest-data customers it claims to serve.**
- **Severity:** Medium
- **Evidence:** Tengo is a web PWA only (`docs/review/prep/fact-sheet.md`, Form). The daily message is previewed as WhatsApp or SMS but nothing is sent (`docs/review/screens/thabo-inbox-dark-390.png`), and the SMS text is the same six-line message, which is long for a single SMS. FNB already serves cellphone banking over USSD on *120*321# with balances and mini statements (FNB cellphone banking page). Sending a safe-to-spend figure over WhatsApp also puts financial information on a third-party channel, which a bank would need to approve.
- **Recommendation:** Design three bank channel formats: an in-app card (primary), a one-line USSD answer ("Lasts until Tue 27 Oct. Tight. Safe today R295") on an existing USSD menu, and a short push or SMS under 160 characters. Treat WhatsApp as optional and subject to the bank's channel policy.
- **Effort:** M

**PROD-06. No realistic external data path, so a pilot depends entirely on a bank sponsor.**
- **Severity:** Medium
- **Evidence:** The only real data entry is CSV import (`src/lib/csv.ts`, `src/pages/Import.tsx`); PDF is "coming next" and there is no bank connection (`en.json:472`). Public commentary says South Africa's open finance framework had no formal developments in 2025 and adoption by the FSCA is "still on the cards" for 2026 (Moonstone). Asking an irregular earner to export and upload a CSV every week is not a viable retention loop.
- **Recommendation:** Make the pilot ask explicit: internal transaction data, run server side by the bank, with an internal sponsor in the digital money-management or financial inclusion team. Pilot prerequisites to list in the pitch: a data contract (PROD-01), a server-side engine with backtest results on real anonymised data, a copy set cleared by compliance (PROD-04), a channel plan (PROD-05), success metrics (for example arrears and unpaid debit orders in the pilot group versus a control), and a kill criterion.
- **Effort:** L

**PROD-07. Segment fit is asserted, not shown, and the cash-heavy persona is the weakest fit for bank data.**
- **Severity:** Medium
- **Evidence:** All three personas are synthetic composites (`src/data/seed/personas.ts`); there is no user research in the repo. Ayanda (spaza owner) earns "lumpy cash takings" (BRIEF.md section 11); cash spent before it is deposited never appears in a bank feed, so the forecast sees only net deposits. Thabo's "Ride app weekly payout" lands in the account (`docs/review/screens/thabo-home-dark-1280.png`), which is the case bank data handles best.
- **Recommendation:** Lead the bank pilot with platform and gig earners whose income is paid into the account, then hairdressers and small traders who deposit regularly. Treat cash-first traders as a later phase that needs a cash-entry feature. Run 5 to 8 interviews per segment before a pilot.
- **Effort:** M

**PROD-08. Standalone onboarding and placeholders do not fit inside a bank app.**
- **Severity:** Low
- **Evidence:** Three steps before value (landing, picker, consent with five cards and three switches) (`docs/review/prep/walkthrough.md` item 1, `docs/review/screens/thabo-consent-dark-390.png`). All 10 non-English locales are English text (`src/i18n/status.json`). Logo and icons are placeholders (README "Brand and type").
- **Recommendation:** For the bank version, design an in-app opt-in of one screen that reuses the bank's existing consent and terms, inherit the bank's design system, and get first-language review of at least isiZulu, Sesotho and Afrikaans before any customer sees them.
- **Effort:** M

## Top three risks

1. **Wrong date, real harm, bank's name on it.** Inside a bank app, a confident "Enough until" that misses an overdraft, a new debit order or a late payout becomes the bank's error, with complaints and reputational cost (PROD-01, PROD-03).
2. **Absorbed as a feature.** Banks already have budgeting, alerts and, at Standard Bank, a 14 and 30 day payment forecast. A bank could add income cadence to an existing tool without Tengo; the defensible part is small unless backed by proven accuracy on real data (PROD-02).
3. **No data, no pilot.** With open finance not yet adopted and CSV as the only input, Tengo has no route to real users except a bank sponsor, and the current copy and channel gaps would slow that sponsor's internal approvals (PROD-04, PROD-05, PROD-06).

## Score

5/10. A genuinely distinct date-first, income-aware answer with a clean explainable engine, but it ignores bank-side data like overdrafts and debit orders, mixes signals in the headline and is not yet shaped for a bank's compliance, channels or segments.

## Sources

- ITWeb, "FNB's nav» money tool notches up 5m users": https://itweb.co.za/article/fnbs-nav-money-tool-notches-up-5m-users/mQwkoq6Ywb3M3r9A (accessed 2026-10-20)
- ITWeb, "FNB adds more functionality to nav platform" (smart budget, from search index): https://itweb.co.za/article/fnb-adds-more-functionality-to-nav-platform/DZQ58MVPaJOvzXy2 (accessed 2026-10-20)
- FNB nav» Money page (Money Coach; direct fetch blocked by a browser check, content seen in search index only): https://www.fnb.co.za/ways-to-bank/digital/navMoney.html (accessed 2026-10-20)
- FNB overdraft page (app application; direct fetch blocked, content from search index): https://www.fnb.co.za/for-you/borrow/overdraft.html (accessed 2026-10-20)
- FNB cellphone banking (USSD *120*321#; content from search index): https://www.fnb.co.za/ways-to-bank/cellphone-banking-index.html (accessed 2026-10-20)
- Standard Bank, "Do more with our banking app" (Budget Manager, Future Payments 14 to 30 days, Money Movements, My360): https://www.standardbank.co.za/southafrica/personal/learn/do-more-with-our-banking-app-part-1 (accessed 2026-10-20)
- Standard Bank, Future Payments add-on help page: https://standardbank.co.za/southafrica/personal/products-and-services/ways-to-bank/help-centre/future-payments-add-on (accessed 2026-10-20)
- Capitec blog, "What if there was a simpler way to budget?" (automatic categorisation; direct fetch returned 403, content from search index): https://www.capitecbank.co.za/blog/articles/best-way-to-bank/what-if-there-was-a-simpler-way-to-budget/ (accessed 2026-10-20)
- Absa Savings Coach: https://www.absa.co.za/offers/absa-savings-coach/ (accessed 2026-10-20, content from search index)
- Moonstone, "Key fintech policy developments to watch in 2026" (open finance status): https://www.moonstone.co.za/key-fintech-policy-developments-to-watch-in-2026/ (accessed 2026-10-20)

## Findings table

| id | severity | title | evidence | recommendation | effort |
| --- | --- | --- | --- | --- | --- |
| PROD-01 | High | Engine ignores overdraft, debit orders, holds and multiple accounts | src/engine/forecast.ts:196-210 zero is the floor; src/engine/classify.ts:16 bills inferred only; FNB overdraft page; Standard Bank Future Payments | Define a bank data contract: available balance, facility limit shown separately, scheduled debit orders as known bills, account set | M |
| PROD-02 | High | Overlap with existing bank budgeting and forecast tools not addressed | ITWeb 2025 nav» Money 5m users; Standard Bank Budget Manager and Future Payments; Capitec categorisation; lerato-money-dark-1280.png | Narrow bank pitch to the income-aware run-out date; de-emphasise categorisation; add a "bank has versus Tengo adds" slide | S |
| PROD-03 | High | Headline signals conflict (Enough until with Tight; Short with R310 safe to spend) | src/components/forecast/DateHero.tsx:9; thabo-home-dark-1280.png; ayanda-home-dark-390.png; persona-snapshot.json | Neutral "Lasts until" label; safe to spend obeys state; chart readout states its income assumption clearly | S |
| PROD-04 | Medium | Credit-adjacent and advice-like copy would fail bank compliance review | src/i18n/locales/en.json:523 Safe to lend; help.billToMove Car instalment; en.json:702 | Descriptive outcomes, no "safe to lend", never suggest delaying a credit repayment, estimate-not-advice line | S |
| PROD-05 | Medium | No USSD or low-data channel; WhatsApp carries financial figures | fact-sheet Form (web PWA only); thabo-inbox-dark-390.png; FNB USSD *120*321# | In-app card first, one-line USSD answer, SMS under 160 characters, WhatsApp subject to bank policy | M |
| PROD-06 | Medium | No realistic external data path; pilot depends on a bank sponsor | src/lib/csv.ts CSV only; en.json:472 no bank connection; Moonstone 2026 open finance not adopted | Pilot on internal data with a named sponsor; list prerequisites, success metrics and kill criterion | L |
| PROD-07 | Medium | Segment fit asserted not shown; cash-heavy persona fits bank data worst | src/data/seed/personas.ts synthetic; BRIEF.md section 11 lumpy cash takings | Pilot platform and gig earners paid into account first; interviews per segment; cash entry later | M |
| PROD-08 | Low | Standalone onboarding, English-only locales and placeholder brand do not fit a bank app | walkthrough.md item 1; thabo-consent-dark-390.png; src/i18n/status.json; README Brand and type | One-screen in-app opt-in on bank consent; bank design system; first-language review of key locales | M |
