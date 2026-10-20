# Investor and sceptic

## Verdict

Tengo is a well built demo of a sensible idea, but nothing in it would yet convince me to fund it. The product has no users, no real data, no data access path beyond a manual CSV, no buyer, and an engine of about 370 lines of percentile arithmetic (`src/engine/forecast.ts`) that any bank with transaction data could rebuild in weeks. The one thing it claims as its edge, a date instead of a balance, is a framing, not an asset: FNB has shown "what's left after scheduled payments and debit orders" since 2018, and several consumer apps already sell "safe to spend until payday". Worse, the demo contradicts itself on the screen that matters most (Ayanda is "Short" while being told R310 is "safe to spend today" and the chart below says "Enough"), and the landing page advertises 11 languages that are all English. The honest pitch today is "a credible prototype of a feature a bank could adopt", not "a company". That is fine for a hackathon. It is a no for an investment until there is evidence that real irregular earners understand, trust and act on the date.

## What works

- The question is sharp and easy to say. "A balance tells you what you have. Tengo tells you until when." Evidence: `docs/review/screens/landing-light-1280.png`, `BRIEF.md` section 1.
- The engine is transparent and explainable, which is a real asset for a bank pitch. Every number has a simple rule a compliance team can read: median and percentiles of rolling 7 day spend (`src/engine/forecast.ts:59-88`), recurring bill rule (`src/engine/classify.ts:16-22`), state rule (`src/engine/forecast.ts:217-221`). There is no black box to defend.
- Engine quality is high for a prototype: 97.6 percent statement coverage in `src/engine`, 66 unit tests passing. Evidence: `docs/review/prep/fact-sheet.md` (Quality signals).
- Help is computed with the same engine as the date, so suggestions are internally consistent with the headline. Evidence: `src/engine/help.ts:45-76`.
- Privacy posture is a selling point for a bank: no third party requests, data stays in the browser, and simulated controls are labelled as such. Evidence: `docs/review/prep/fact-sheet.md` (What is simulated), `BRIEF.md` section 2.
- Front end performance and accessibility scores are strong: Lighthouse mobile landing 94 performance and 100 accessibility. Evidence: `docs/review/prep/fact-sheet.md`, `docs/review/prep/lighthouse/`.

## What to improve

**INV-01. Zero evidence of demand or behaviour change**
- **Severity:** High
- **Evidence:** No users, no interviews, no test sessions recorded anywhere in the repo. The personas are fictional composites (`README.md:11`, `src/data/seed/personas.ts`). The whole thesis, that a date changes behaviour more than a balance, is untested.
- **Recommendation:** Run 5 to 8 sessions with real e-hailing drivers, hairdressers or spaza owners before submission. Show the Home screen, ask "what does this tell you", "what would you do today", and record whether they read the date correctly. Quote them in the pitch.
- **Effort:** M

**INV-02. The core insight is easy to copy and partly exists already**
- **Severity:** High
- **Evidence:** The forecast is 368 lines (`src/engine/forecast.ts`) using median and 20th and 80th percentiles. FNB's nav Money "My available funds" has shown what remains after scheduled payments and debit orders since 2018 (BusinessTech, 11 June 2018). Standalone apps already market "safe to spend before your next paycheck" and day by day balance to payday (Product Hunt listing for Pocket Runway; 11:FS payday article).
- **Recommendation:** Stop pitching the algorithm as the moat. Pitch the irregular income specific parts (income rhythm detection without a payday, range band, Short and Tight states, loan to family check) and the design and language work as the asset, and position Tengo as a feature a bank licenses or acquires, not a standalone company.
- **Effort:** S

**INV-03. Headline, safe to spend and chart contradict each other**
- **Severity:** High
- **Evidence:** Ayanda: hero "Short from Fri 23 Oct", stats card "Safe to spend today R310 until Mon 26 Oct", chart readout for today "Enough" (`docs/review/screens/ayanda-home-dark-390.png`; `persona-snapshot.json`). Her usual daily spend is R623. Safe to spend divides the balance over days to the latest next money (`src/engine/forecast.ts:291-296`) while the date uses the spend rate (`forecast.ts:282-288`) and the chart adds expected income (`forecast.ts:234-267`). Also, the label "Enough until" is shown for the Tight state (`src/components/forecast/DateHero.tsx:9`), visible on the landing hero: "Enough until Tue 27 Oct" next to a "Tight" chip (`landing-light-1280.png`).
- **Recommendation:** One source of truth per screen. When Short, replace safe to spend with "Spend at most R X a day to reach Sun 25 Oct" derived from the same path, label Tight as "Tight until", and make the chart's today state match the hero or remove it.
- **Effort:** S

**INV-04. No path to real data**
- **Severity:** High
- **Evidence:** No bank connection, no open banking, CSV upload only, PDF import "coming next" and not built (`docs/review/prep/fact-sheet.md`, Data). South Africa's open finance framework is still being worked on by the IFWG and FSCA, with formal adoption not yet confirmed (Moonstone, 2026; Stitch, 10 July 2026).
- **Recommendation:** Name the data route explicitly: embedded in a bank app using the bank's own transaction feed is the only route that works this year. Show a mock integration contract (inputs Tengo needs: balance, 60 days of transactions, scheduled debit orders).
- **Effort:** M

**INV-05. Overclaiming languages**
- **Severity:** High (credibility)
- **Evidence:** Landing stat "11 Official languages" (`landing-light-1280.png`). All 10 non-English locales contain English text (`src/i18n/status.json`, `npm run i18n:check` in `docs/review/prep/checks.md`). The About copy says translations are "machine made or on the way" (`src/i18n/locales/en.json:475`) when none has been machine translated.
- **Recommendation:** Change the stat to "English now, 10 languages planned" or ship and get first-language review for at least isiZulu and Sepedi or Setswana before submission. A judge who taps isiZulu and sees English will discount everything else.
- **Effort:** S (copy) to M (two reviewed languages)

**INV-06. Accuracy is unproven and the demo is tuned to look right**
- **Severity:** High
- **Evidence:** The seed balance is chosen by the engine so each persona starts in Tight, Enough and Short (`docs/review/prep/fact-sheet.md`, Data; `src/data/seed/generate.ts`). The synthetic history was generated by the same team that wrote the detector, so a correct forecast on it proves internal consistency, not accuracy.
- **Recommendation:** Backtest on at least a handful of real, consented, anonymised statements from irregular earners and publish error in days and band coverage. Until then, say "accuracy not yet measured on real data" in the pitch.
- **Effort:** M

**INV-07. Who pays is undefined**
- **Severity:** Medium
- **Evidence:** No pricing, no business model in `README.md` or `BRIEF.md`. The intended users are, by definition, short of money, which rules out a meaningful consumer subscription. **Assumption:** the only realistic payer is a bank or a funder, at a per active user fee in the low single rands per month (plausible range R1 to R10), because banks already give budgeting tools away free (nav Money is described as free, Engineering News, 28 March 2022).
- **Recommendation:** Pick one model (B2B2C licence to a bank) and state the bank's benefit as a hypothesis to test: fewer failed debit orders and unpaid fees among irregular earners.
- **Effort:** S

**INV-08. The headline date ignores income, so it means different things to different people**
- **Severity:** Medium
- **Evidence:** Runway runs the balance down with no future income (`src/engine/forecast.ts:195-211`). Lerato is "Enough until 1 Nov" because rent of R2 800 lands on 1 Nov (`persona-snapshot.json`), even though she is paid on 24 Oct and again before 1 Nov. For a weekly earner like Thabo the date is almost always about a week out, so it adds little over "next payout".
- **Recommendation:** Test with users which question they think the date answers. Consider phrasing as "Your money now lasts until" and making the state, not the date, the primary signal when next money comes first.
- **Effort:** S

**INV-09. Advice-like outputs raise regulatory and harm exposure**
- **Severity:** Medium
- **Evidence:** "Safe to spend", "safe to lend" (`src/engine/forecast.ts:357-368`) and a suggestion to move Thabo's car instalment (`persona-snapshot.json`, help.billToMove; `src/engine/help.ts:58-73`). Moving a vehicle finance payment can trigger penalties or arrears. **Assumption:** a bank's legal team would require disclaimers and possibly reframing before a pilot; see the legal reviewer for the regulatory analysis.
- **Recommendation:** Exclude credit agreement instalments from "bill to move", rename "safe to lend" to "you could lend up to and stay Tight", and add a one line "estimate, not advice" under every figure.
- **Effort:** S

**INV-10. Cash and informal money flows are invisible**
- **Severity:** Medium
- **Evidence:** The engine sees only bank transactions (`src/engine/forecast.ts:105-191`). Ayanda's income is "Cash deposit, shop takings" and card machine sales (`ayanda-home-dark-390.png`). **Assumption:** a spaza owner pays suppliers and family partly in cash before banking, so the bank balance understates both income and spend; the effect size is unknown and could be large.
- **Recommendation:** Add a manual "cash in hand" and "money I owe or am owed" entry, and test with a cash heavy user.
- **Effort:** M

**INV-11. Placeholder brand and unconfirmed name**
- **Severity:** Low
- **Evidence:** Logo and icons are placeholders, and the name's Tshivenda meaning is "to be confirmed by a Venda speaker" (`BRIEF.md` section 1; `docs/review/prep/fact-sheet.md`).
- **Recommendation:** Confirm the name with a first-language speaker and make a simple wordmark before submission.
- **Effort:** S

**INV-12. Dependency vulnerabilities and one large bundle**
- **Severity:** Low
- **Evidence:** npm audit shows 2 critical and 5 high (mostly dev), 2 moderate in production (react-router); one 696 KB JavaScript file including all locales (`docs/review/prep/fact-sheet.md`, `docs/review/prep/audit.md`).
- **Recommendation:** Update react-router and split locale files so a judge's due diligence checklist comes back clean.
- **Effort:** S

## Top three risks

1. **The bank builds it.** The feature is a few hundred lines on top of data the bank already owns, and FNB has had a forward looking "available funds" view since 2018. If the idea is good, the cheapest path for a bank is to copy the framing, not to buy Tengo (INV-02).
2. **Users do not trust or understand the date.** No one has used it. On the demo's own Short persona, three numbers on one screen disagree. A wrong "safe to spend" for someone already short is the exact harm the product claims to prevent (INV-01, INV-03, INV-06).
3. **No data, no product.** Without a bank feed the product depends on users exporting CSV statements, which this segment is unlikely to do repeatedly. **Assumption:** repeat manual import rates below 10 percent of users per month (INV-04).

## Ten hardest questions

1. **Question:** How many real irregular earners have used this, and what did they do differently?
   **Best honest answer today:** None. It is a demo with fictional data. The design is based on three composite personas and published research on income volatility, not on sessions with users.
   **What would strengthen it:** Five to eight recorded sessions with drivers, hairdressers or spaza owners, with quotes and a simple measure such as "read the date correctly" and "said they would change a spend today".

2. **Question:** How accurate is the date?
   **Best honest answer today:** We do not know on real data. On synthetic data the engine is consistent with its own rules, and it shows a range band and a confidence level instead of pretending to be exact.
   **What would strengthen it:** A backtest on real, consented statements reporting mean error in days, how often the actual run-out date falls inside the band, and how often the state was right in hindsight.

3. **Question:** FNB already shows money left after scheduled debits, and budgeting apps show "safe to spend until payday". What is new?
   **Best honest answer today:** The framing and the segment. Those tools assume a payday; Tengo infers next money from irregular deposits (weekday rhythm or gap percentiles), shows a range, and turns it into Enough, Tight or Short. The arithmetic is not new.
   **What would strengthen it:** Evidence that irregular earners misread existing tools and read Tengo correctly, from a side by side test.

4. **Question:** Why would a bank buy this instead of building it in a sprint?
   **Best honest answer today:** It probably would build it. Tengo's value is a tested design, copy and explanation layer that is ready to drop in, plus the irregular income detection rules. That is a licence or acqui-hire case, not a moat.
   **What would strengthen it:** A named bank sponsor, a pilot letter of intent, or a design that has been through user testing in several languages that the bank has not done.

5. **Question:** Where does the data come from?
   **Best honest answer today:** Today, a CSV upload parsed in the browser. In production, from the host bank's own transaction feed. Open finance in South Africa is not yet a reliable third party route.
   **What would strengthen it:** A one page integration spec and a working import of a real bank's CSV and PDF statement formats.

6. **Question:** Who pays, and how much?
   **Best honest answer today:** Not decided. The users cannot be the payers. The likely model is a per active user licence to a bank or a funder for financial inclusion. Any price is an assumption.
   **What would strengthen it:** A bank value hypothesis with numbers from public sources, for example fee and failed debit order costs for this segment, and a pilot to measure it.

7. **Question:** Your Short persona is told R310 is safe to spend today and the chart says Enough. Which number should she believe?
   **Best honest answer today:** That is a real inconsistency in the demo. The figures come from three rules: run-out without income, balance spread to the latest next money, and a 30 day path that includes income. It should be fixed so one rule drives the screen.
   **What would strengthen it:** Fix it before submission and show the fixed screen in the demo.

8. **Question:** Is "safe to spend" or "safe to lend" financial advice, and who is liable if it is wrong?
   **Best honest answer today:** It is presented as an estimate, not advice, but the wording is close to advice and has not had legal review. Inside a bank it would sit under the bank's own disclosure and compliance process.
   **What would strengthen it:** A legal opinion on the wording, and renamed outputs that describe consequences ("you would stay Tight") rather than permissions ("safe").

9. **Question:** Your users run on cash, stokvels and family transfers. How does a bank statement capture that?
   **Best honest answer today:** It does not. The engine only sees bank transactions, so cash income and cash spend are invisible.
   **What would strengthen it:** A manual cash entry, and data from user sessions on what share of money moves outside the account.

10. **Question:** You say 11 official languages. Can I see isiZulu?
    **Best honest answer today:** No. The structure for 11 languages exists and every key is in place, but all 10 non-English files are still English. Translation has not been run or reviewed.
    **What would strengthen it:** Two languages translated and checked by first-language speakers, and an honest stat on the landing page until the rest are done.

## Deal breakers

- Evidence after testing that users read the date as a payday or a deadline and make worse decisions because of it, or that a Short user acts on "safe to spend".
- Backtest on real statements showing the actual run-out date falls inside the band much less often than the band implies, with no fix in sight.
- No bank or funder willing to host it, since there is no viable consumer revenue in this segment and no third party data route.
- A bank shipping the same view inside its own app before a pilot, which removes the only distribution path.
- Continued public claims that are not true (11 languages, "machine made") after being flagged.

## What would change my mind

- Recorded sessions with 5 to 8 real irregular earners where most read the date correctly and describe a specific decision they would change.
- A backtest on real, consented data with error in days and band coverage that is reported honestly, even if modest.
- A letter of intent or named sponsor at a bank for a small pilot, with an agreed success measure (for example fewer failed debit orders or unpaid fees in the pilot group).
- The three contradictions on Home fixed and at least two languages properly translated.

## Is the core insight defensible

As a technology, no. The date is balance divided by a spend rate, minus known bills, which any bank with transaction history can compute, and FNB already computes the after-debits figure (BusinessTech, 11 June 2018). As a product decision for irregular earners, it is partly defensible: detecting next money without a payday, showing a range, and saying Enough, Tight or Short in plain language in many languages is real design work that a bank may not prioritise for this segment. Defensibility would come from user evidence, tested copy in 11 languages, and a bank relationship, not from code. The likely outcome if the idea proves out is that a bank copies or licenses it. The founder should pitch for that outcome openly.

## Score

4 out of 10. A careful, honest prototype of an easily copied feature, with no users, no data route, no buyer and visible contradictions on its key screen.

## Sources

- BusinessTech, "FNB launches new Nav Money tool", 11 June 2018, https://businesstech.co.za/news/banking/250773/fnb-launches-new-nav-money-tool/ (accessed 2026-10-20)
- ITWeb, FNB nav smart budget, 9 November 2020, https://www.itweb.co.za/content/DZQ58MVPaJOvzXy2 (accessed 2026-10-20)
- Engineering News, "Individuals who use nav Money on the FNB App more likely to improve credit status and savings", 28 March 2022, https://www.engineeringnews.co.za/article/individuals-who-use-nav-money-on-the-fnb-app-more-likely-to-improve-credit-status-and-savings-2022-03-28 (accessed 2026-10-20)
- Product Hunt, Pocket Runway, "Know what's safe to spend before your next paycheck", https://www.producthunt.com/products/pocket-runway (accessed 2026-10-20)
- 11:FS, "The payday playbook: designing around the moment money lands", https://www.11fs.com/article/the-payday-playbook-designing-around-the-moment-money-lands (accessed 2026-10-20)
- Moonstone, "Key fintech policy developments to watch in 2026", https://www.moonstone.co.za/key-fintech-policy-developments-to-watch-in-2026/ (accessed 2026-10-20)
- Stitch, payments readiness checklist, 10 July 2026, https://stitch.money/blog/the-enterprise-cfos-2026-payments-readiness-checklist-pem-vision-2030-open-finance-and-ai-in-one-map (accessed 2026-10-20)
- BusinessTech, "One silver lining for unemployment in South Africa", 12 August 2026 (QLFS Q2 2026: about 3.57 million in the informal sector), https://businesstech.co.za/news/business-opinion/869804/one-silver-lining-for-unemployment-in-south-africa/ (accessed 2026-10-20)

## Findings table

| id | severity | title | evidence | recommendation | effort |
| --- | --- | --- | --- | --- | --- |
| INV-01 | High | Zero evidence of demand or behaviour change | No users or sessions in repo; personas fictional (README.md:11, src/data/seed/personas.ts) | Run 5 to 8 sessions with real irregular earners and quote them | M |
| INV-02 | High | Core insight easy to copy and partly exists | src/engine/forecast.ts is 368 lines of percentiles; FNB My available funds since 2018 (BusinessTech); Pocket Runway | Pitch design, segment and language work as the asset; position as bank licence | S |
| INV-03 | High | Headline, safe to spend and chart contradict | ayanda-home-dark-390.png Short plus R310 safe plus chart Enough; forecast.ts:282-296; DateHero.tsx:9 shows Enough until for Tight | One rule per screen; Tight until label; daily cap when Short | S |
| INV-04 | High | No path to real data | CSV only, PDF not built (fact-sheet.md); open finance not finalised (Moonstone, Stitch) | Name bank-embedded data route and write integration spec | M |
| INV-05 | High | Overclaiming 11 languages | landing-light-1280.png stat; src/i18n/status.json all pending; en.json:475 says machine made | Honest stat now; two reviewed languages before submission | S |
| INV-06 | High | Accuracy unproven, demo tuned to states | Seed balance chosen to hit Tight, Enough, Short (src/data/seed/generate.ts, fact-sheet.md) | Backtest on real consented statements and report error and band coverage | M |
| INV-07 | Medium | Who pays is undefined | No pricing in README.md or BRIEF.md; nav Money is free (Engineering News 2022) | Choose B2B2C bank licence and state bank value hypothesis | S |
| INV-08 | Medium | Headline date ignores income | forecast.ts:195-211; Lerato Enough until 1 Nov driven by rent though paid 24 Oct | Test what users think the date means; lead with state when income comes first | S |
| INV-09 | Medium | Advice-like outputs raise harm exposure | safeToLend forecast.ts:357-368; help.ts:58-73 suggests moving car instalment | Exclude credit instalments; reword safe to lend; add estimate not advice line | S |
| INV-10 | Medium | Cash and informal flows invisible | Engine reads bank rows only (forecast.ts:105-191); Ayanda cash takings | Add cash in hand and owed entries; test with cash heavy user | M |
| INV-11 | Low | Placeholder brand and unconfirmed name | BRIEF.md section 1; fact-sheet.md placeholders | Confirm name with Venda speaker; simple wordmark | S |
| INV-12 | Low | Dependency vulnerabilities and one large bundle | audit.md: 2 critical, 5 high, react-router moderate; 696 KB single JS file | Update react-router; split locale files | S |
