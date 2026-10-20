# Product strategist and commercial lead

## Verdict

Tengo asks a sharp question that South African bank apps do not answer today: not "what is my balance" but "until when does it last, given how I actually get paid". I found no verified South African bank or app feature that shows a run-out date against an irregular income cadence. The nearest are FNB nav» Money's "available funds after known upcoming payments" and Standard Bank's "Future Payments" 14 to 30 day estimate. That gap is real, but it is narrow and cheap for a bank to close. The engine is a 368 line file of transparent percentile maths (`src/engine/forecast.ts`), it has no proprietary data, and every bank already holds the transaction history it needs. The only business model that fits is a B2B2C licence embedded in a bank app, paid as a pilot fee and then a per-active-user fee with a platform floor, with sponsor funding as a secondary track for users outside the partner bank. On my sourced inputs (`docs/review/model-inputs.md`), one bank at base adoption gives about 44 000 monthly active users. At R5 per user that does not cover a lean team and compliance. Daily paid WhatsApp or SMS messages would cost more per user than the bank is likely to pay. The consumer subscription model does not fit this segment. The pitch is strong as a feature concept for FNB and weak as a standalone company today.

## What works

- **A question no verified competitor answers.** Home leads with a date, a range and a state (Enough, Tight, Short), with the next money date estimated from weekday or interval patterns (`src/engine/forecast.ts`, fact sheet "Forecast engine"). Of the competitor features I could verify, FNB nav» Money shows funds left after scheduled payments, with no income projection ([BusinessTech, 2018](https://businesstech.co.za/news/banking/250773/fnb-launches-new-nav-money-tool/)). Standard Bank's Future Payments estimates upcoming payments and spending for 14 to 30 days ([Standard Bank](https://www.standardbank.co.za/southafrica/personal/learn/do-more-with-our-banking-app-part-1)). Nedbank MoneyTracker and Discovery's Financial Analyser are budget and category tools with no stated balance forecast ([Nedbank](https://personal.nedbank.co.za/bank/digital-banking/needs/manage/money-tracker.html), [Discovery](https://www.discovery.co.za/bank/blog-budgeting-solutions-with-financial-analyser)). The date-first framing for irregular earners is a real point of difference.
- **The segment is large and under-served on resilience.** Informal sector employment is 3.6 million and private household employment 1.1 million in Q2 2026 ([Stats SA QLFS Q2 2026 presentation, slide 18](https://www.statssa.gov.za/publications/P0211/Presentation%20QLFS%20Q2%202026.pdf)). Only 30.8 percent of South African adults say it is not difficult to raise extra money within 30 days, and 18.3 percent in the poorest 40 percent ([World Bank Little Data Book on Financial Inclusion 2025, South Africa](https://thedocs.worldbank.org/en/doc/be6615202d1f08a25855c8ac2d615122-0050012025/related/Little-Data-Book-2025-Web.pdf)). Account ownership is 81.1 percent, so most of the segment is reachable through a bank.
- **Built to be embedded.** All data access goes through `TengoRepository` (`src/data/repository.ts:75`), and messages go through a `MessageWriter` interface (`src/messages/templates.ts`). That is the right shape for a bank licence, where the bank supplies data and channel.
- **Cheap to run, apart from messaging.** The forecast is local, deterministic statistics with no model inference. Messages are fixed templates today, and even an LLM rewrite would cost about R0.002 per message on Claude Haiku 5.5 at USD 0.10 and 0.50 per million tokens ([Claude pricing](https://claude.com/pricing)) with my assumed 600 input and 120 output tokens.
- **Culturally specific features.** The loan check ("safe to lend up to") answers a common real question about lending to family. The 11 language plumbing exists (`npm run i18n:check`, fact sheet "Languages"). No verified bank feature offers either.
- **A privacy posture that fits bank procurement.** Consent, export, deletion with receipt, an audit log and data minimisation all work against the local store and are clearly labelled as simulated (fact sheet "What is simulated"). This shortens the conversation with a bank's privacy team, even though none of it is production grade.

## What to improve

**COMM-01. No defensible moat against the bank building it**
- **Severity:** High
- **Evidence:** The engine is transparent percentile maths over date, amount and description (`src/engine/forecast.ts`, `src/engine/classify.ts:16`). It uses no proprietary data. Banks already ship adjacent features: FNB nav» Money "My available funds" since 2018 ([BusinessTech](https://businesstech.co.za/news/banking/250773/fnb-launches-new-nav-money-tool/)), Standard Bank Future Payments ([Standard Bank](https://www.standardbank.co.za/southafrica/personal/learn/do-more-with-our-banking-app-part-1)), Discovery's AI budget tool ([Discovery](https://www.discovery.co.za/bank/blog-budgeting-solutions-with-financial-analyser)). FNB reports 8.16 million digitally active customers and its own large digital build ([BusinessDay, 2026-09-16](https://www.businessday.co.za/companies/2026-09-16-fnb-ceo-bullish-as-deposits-top-r1-trillion-and-private-banking-nears-2-million-clients/)).
- **Recommendation:** Present the defensible assets honestly: (1) backtested forecast accuracy on irregular income, which no competitor publishes; (2) a tested, plain-language, multilingual content set for money states; (3) a pilot playbook with outcome measurement. Offer the engine under licence with the bank owning the deployment, so "build versus buy" becomes "buy and adapt now". Do not claim a technology moat.
- **Effort:** M

**COMM-02. Single-bank unit economics do not break even**
- **Severity:** High
- **Evidence:** Base funnel in `model-inputs.md` section 2: 8.16m digitally active x 15 percent irregular x 60 percent shown x 15 percent activate x 40 percent stay active = about 44 000 MAU (range 6 000 to 220 000). At R5 per MAU (Assumption, R2 to R12) revenue is about R220 000 a month. Variable cost with in-app push is about R1.23 per MAU (hosting R0.15, compute R0.02, LLM R0.06, support R1.00), so contribution is about R166 000 a month against assumed fixed costs of R310 000 (team R250 000, compliance R60 000). Break-even needs about 82 000 MAU at R5. No public per-user prices exist for bank money-insight vendors to anchor a higher fee, and Capitec's entire main account costs R7.50 a month ([Capitec 2026 fees](https://www.capitecbank.co.za/globalassets/pages/documents-library/transact/personal-banking-fees-2026.pdf)).
- **Recommendation:** Price as pilot fee (R150 000 to R1m) plus per-MAU fee plus an annual platform floor (R0.6m to R3m), and plan for a second bank or a white-label channel within 18 months. Model break-even per scenario in `model.xlsx` with the floor switched on and off.
- **Effort:** M

**COMM-03. Daily paid messaging costs more than the licence fee**
- **Severity:** High
- **Evidence:** The brief and Inbox describe a daily WhatsApp or SMS message (`src/messages/templates.ts`, fact sheet "Screens"). A WhatsApp utility template in South Africa is USD 0.0095 per delivered message from 1 October 2026 ([ChatMaxima, quoting Meta list rate](https://chatmaxima.com/whatsapp-api-pricing/south-africa/); Meta confirms a South African utility increase on that date at [Meta pricing docs](https://developers.facebook.com/docs/whatsapp/pricing)). 30 messages x USD 0.0095 x R16.13 ([valutafx](https://www.valutafx.com/history/usd-zar-2026-08-20)) = R4.60 per user per month before BSP fees. If Meta classed the nudges as marketing (USD 0.0379), it would be R18.34. Daily SMS at R0.24 ([Panacea Mobile](https://www.panaceamobile.com/gateways/bulk-sms-gateway/)) is R7.20. Each exceeds the base licence fee of R5.
- **Recommendation:** Make in-app push inside the bank app the default channel (no per-message cost). Send WhatsApp only on state changes and at most weekly, and design replies that open the free 24 hour service window. Keep templates rather than an LLM for routine messages. Put message frequency in the model as a top tornado driver.
- **Effort:** S

**COMM-04. The segment's cash income is invisible to the product**
- **Severity:** High
- **Evidence:** Two of three personas earn cash: Thabo "Cash fares most days", Ayanda "Cash takings come in lumps" (`src/i18n/locales/en.json`, `personas`). The repository has no way to add a transaction, only replace history or edit one (`src/data/repository.ts:75` to `96`). A what-if is temporary. The seed treats cash as bank deposits (`src/data/seed/generate.ts:52`), which real cash earners often do not make. 19.6 percent of adults save through clubs or people outside the family (Little Data Book 2025), which Tengo also does not model. A bank-data-only forecast will read cash earners as Short when they are not, which damages trust and the commercial case.
- **Recommendation:** Add a quick "cash in" and "cash out" entry and a "cash on hand" figure that feeds the forecast, plus a stokvel contribution as a recurring bill type. Pitch this as the reason Tengo is different from bank budgeting tools.
- **Effort:** M

**COMM-05. No evidence of outcomes for a bank buyer**
- **Severity:** Medium
- **Evidence:** All data is synthetic and fictional (fact sheet "Data"). There are no users, no test sessions and no measured behaviour change. Every bank value input in `model-inputs.md` section 5 beyond published fees is an Assumption (unpaid reduction 0 to 30 percent, deposit uplift R0 to R1 000).
- **Recommendation:** Before pitching a pilot, run 5 to 8 user sessions with real irregular earners, and publish the backtest. Offer a pilot design with a control group and four pre-agreed KPIs: activation, 30 day retention, unpaid debit orders per user, and a confidence survey item.
- **Effort:** M

**COMM-06. A consumer subscription does not fit the segment**
- **Severity:** Medium
- **Evidence:** The target pays R7.50 a month for a whole Capitec account (Capitec 2026 fees). Free budgeting tools exist inside FNB, Standard Bank, Nedbank and Discovery apps (sources above), and Vault22, the platform behind 22seven, offers a free tier ([Vault22](https://vault22.com/)). Card collection costs 3.2 percent plus R2 ([PayFast fees](https://payfast.io/fees), via search index), about 10 percent of a R29 subscription. Public finance app day 30 retention figures are 4.2 to 15 percent ([Panto, weak source](https://www.getpanto.ai/blog/mobile-app-retention-statistics)). At 2 percent conversion, revenue is about R0.44 per MAU against R1.23 cost and an assumed R120 acquisition cost.
- **Recommendation:** Keep Tengo free to the user. Drop the consumer subscription from the pitch except as a later premium for small business owners such as spaza shops (stock planning), tested separately.
- **Effort:** S

**COMM-07. The distribution story conflicts with the product as shown**
- **Severity:** Medium
- **Evidence:** The landing page counts "Bank logins needed" as a selling point (`src/i18n/locales/en.json` `landing.stats.logins`) and onboarding depends on a CSV statement export (`src/pages/Import.tsx`). Few informal earners will export a CSV, so this does not scale. Open banking in South Africa is still being designed: trackers give expected dates, but I found no SARB or IFWG document confirming a 2026 start ([Open Banking Tracker](https://openbankingtracker.com/regulation/south-africa-open-banking), weak). The realistic channel is inside the bank app, using the bank's own data.
- **Recommendation:** Tell one distribution story: "inside your bank app, using data the bank already has, with consent". Keep CSV as the demo path and say so. Treat open finance as later upside, not the plan.
- **Effort:** S

**COMM-08. The pitch overclaims languages**
- **Severity:** Medium
- **Evidence:** The landing page shows an "Official languages" stat (`src/i18n/locales/en.json` `landing.stats.languages`). All 10 non-English locales contain English text (fact sheet "Languages", `src/i18n/status.json`). A judge who picks isiZulu sees English (`docs/review/prep/walkthrough.md` item 5).
- **Recommendation:** Before submission, show one or two human-reviewed languages and change the stat to "11 languages ready for translation", or remove it.
- **Effort:** S

**COMM-09. One buyer, one channel**
- **Severity:** Low
- **Evidence:** The product is built for an FNB competition (README line 9). There is no second channel in the code or README. Comparable digital bases exist at Capitec (15.3m active app clients, [Capitec FY2026 summary](https://www.capitecbank.co.za/globalassets/pages/investor-relations/financial-results/2026/audited-results/cpify26_summary.pdf)), Absa (5.4m active digital, [BusinessDay](https://www.businessday.co.za/companies/2026-08-18-absas-digital-users-rise-14-as-it-pushes-technology-adoption/)) and Nedbank (3.2m Money app active, [TechFinancials](https://techfinancials.co.za/?p=4061055)).
- **Recommendation:** Keep FNB as the lead, and prepare a white-label variant and a platform-partner track (for example e-hailing driver programmes; Bolt reports about 500 000 drivers onboarded since 2016, [ITWeb](https://www.itweb.co.za/videos/category/APero3qZydGMQb6m)).
- **Effort:** M

**COMM-10. Brand assets are not commercially cleared**
- **Severity:** Low
- **Evidence:** The README notes that the Public Stunt font is free for personal use only and needs a commercial licence, and the name origin is still to be confirmed by a Venda speaker (`BRIEF.md` sections 1 and 5). The fact sheet lists the logo and icons as placeholders.
- **Recommendation:** Clear the font licence, confirm the name and run a trademark search before any pilot or public launch.
- **Effort:** S

**COMM-11. No written business case in the repository**
- **Severity:** Low
- **Evidence:** The README and BRIEF cover product and build only, with no section on the buyer, pricing or metrics (`README.md`, `BRIEF.md`).
- **Recommendation:** Add a one-page business case: buyer, model (a) with pricing, pilot KPIs, unit cost per MAU and break-even, linked to `model.xlsx`.
- **Effort:** S

### Business model comparison

| Model | Fit | Why |
| --- | --- | --- |
| (a) B2B2C licence, per active user, embedded in a bank app | **Best** | The bank has the data, the trust, the channel (free push) and the cost of the problem (unpaid items, arrears, contact centre). No CAC for Tengo. Weakness: small per-user fee, long procurement, build versus buy (COMM-01, COMM-02). |
| (b) Revenue share on bank outcomes | Later add-on | Aligns incentives, but attribution needs a control group and agreed baselines. Unpaid fees are small per user (R6 at Capitec, R25 pay as you transact and R130 in a bundle after 3 free at Standard Bank, [Standard Bank Access 2026](https://www.standardbank.co.za/static_file/South%20Africa/PDF/Personal%20Pricing/2026/Access_Account_Pricing_Guide_2026.pdf)), so the share alone will not fund the company. Use as a bonus on top of (a). |
| (c) Freemium consumer subscription | Poor | Price sensitive segment, free alternatives, payment fees about 10 percent, weak retention, high CAC (COMM-06). |
| (d) Sponsored or partner funded for inclusion | Secondary | Fits users outside the partner bank (cash earners, platform workers). Grants found are small (USD 5 000 per startup in the 2023 SAIB fintech challenge, [Engineering News](https://engineeringnews.co.za/print-version/world-bank-awards-ten-southern-african-fintech-startups-with-solution-growing-capital-2023-07-17)). Useful for research and impact evidence, not as the core revenue. |

### Pricing

- Bank: pilot fee R150 000 to R1m for 6 months; then R2 to R12 per MAU per month (base R5) with an annual platform floor of R0.6m to R3m. All Assumption, reasoned in `model-inputs.md` section 4.
- Outcome bonus: 10 to 30 percent of measured, control-group-verified benefit (Assumption).
- Consumer: free. No paid tier until a small business variant is tested.
- Sponsor: R20 to R150 per reached user per year to cover messaging and support (Assumption).

### Channel strategy and partners

1. Bank app embed (lead): in-app card on the home screen for customers whose deposits look irregular, push notifications, the bank's own consent flow. FNB is the natural first buyer because of the competition; FNB also reports R5.7bn in stokvel deposits, which shows it already serves informal money practices ([BusinessDay](https://www.businessday.co.za/companies/2026-09-16-fnb-ceo-bullish-as-deposits-top-r1-trillion-and-private-banking-nears-2-million-clients/)).
2. WhatsApp as a light secondary channel, on state change only (COMM-03).
3. Platform partners: e-hailing and delivery platforms (payout data is regular and digital), and card acceptance providers for small traders such as Yoco, whose settlement data shows trader takings ([Yoco fees](https://www.yoco.com/za/fees)). No partnership exists; these are targets.
4. Earned wage access providers such as Paymenow, which serves nearly 500 000 users per [BusinessDay 2025](https://www.businessday.co.za/bt/business-and-economy/2025-04-06-its-your-money-claim-it-now/) (from search snippet), as a possible partner: a "until when" forecast could reduce over-drawing.
5. NGOs and inclusion funders for cash earners outside banks (model d).

### Competitive landscape (South Africa)

All accessed 2026-10-20. "Not verified" means I could not confirm the feature from a primary or reliable source.

| Competitor | Type | Relevant features | Forecasts run-out date for irregular income? | Source |
| --- | --- | --- | --- | --- |
| FNB app (nav» Money) | Bank | Smart budget with auto-sorted spend and alerts at halfway, near limit and at limit (2020); "My available funds" after known upcoming payments and debit orders (2018). Current 2026 menu not verified. | No (scheduled payments only, no income projection) | [Sunday World 2020](https://sundayworld.co.za/news/fnbs-smart-budgeting-reveals-top-spend-from-customers/), [BusinessTech 2018](https://businesstech.co.za/news/banking/250773/fnb-launches-new-nav-money-tool/) |
| Capitec | Bank | Automatic spend categorisation, money in and out notifications, up to 10 savings accounts. Official page blocked by a bot check; seen only through search snippets. Budget limits not verified. | Not verified | [Capitec blog](https://www.capitecbank.co.za/blog/articles/best-way-to-bank/how-to-use-our-app-to-manage-your-money/) (snippet only) |
| Absa | Bank | Savings Coach: goals, automatic "auto savers", tips, up to 7.75 percent interest. No budgeting or forecasting tool found for the South African app. | No evidence found | [Absa Savings Coach](https://www.absa.co.za/offers/absa-savings-coach/) |
| Standard Bank | Bank | Budget Manager (pre-populated budget from past spend, goals, category limits); Future Payments estimates upcoming payments and expected spend for the next 14 to 30 days; Money Movements; Money Reels recap (Dec 2025). | Partly: near-term spend estimate, no stated run-out date or income cadence | [Standard Bank app guide](https://www.standardbank.co.za/southafrica/personal/learn/do-more-with-our-banking-app-part-1), [BusinessTech Money Reels](https://businesstech.co.za/news/industry-news/843969/introducing-standard-bank-money-reels-see-what-your-money-habits-say-about-you/) |
| Nedbank | Bank | MoneyTracker: free, category budgets, up to 8 dashboards incl. side hustle, invoicing. | No (page does not mention forecasting) | [Nedbank MoneyTracker](https://personal.nedbank.co.za/bank/digital-banking/needs/manage/money-tracker.html) |
| TymeBank (GoTyme Bank) | Digital bank | GoalSave up to 10 goals, up to 10 percent interest with conditions; about 12 million customers (date unclear); old app retired 31 Aug 2026 (search snippet). | No evidence found | [GoTyme GoalSave](https://gotyme.co.za/personal/media/money-skills-landing/how-can-i-earn-10percent-interest-with-goalsave), [Daily Investor](https://dailyinvestor.com/banking/112501/billionaire-patrice-motsepe-backed-bank-hits-12-million-clients/) |
| Discovery Bank | Bank | Vitality Money Financial Analyser: 160+ categories, automated or manual budgets, smart alerts, points for budget goals (2023); AI spending insights on WhatsApp (2025). About 1.6m clients. | No (article does not mention forecasting) | [Discovery](https://www.discovery.co.za/bank/blog-budgeting-solutions-with-financial-analyser), [News24 2025](https://www.news24.com/news24/partnercontent/discovery-bank-launches-ai-tech-that-allows-clients-to-see-spending-habits-on-whatsapp-20250327) |
| Vault22 (22seven) | Budgeting app | 22seven.com now redirects to Vault22: account linking, budgeting, free, Basic and Premium tiers (prices not shown); shareholders include Old Mutual and SC Ventures. | No evidence found | [Vault22](https://vault22.com/) |
| Paymenow | Earned wage access (formal employees) | Salary advances; nearly 500 000 users (2025 report). Not built for informal earners. | No | [BusinessDay 2025](https://www.businessday.co.za/bt/business-and-economy/2025-04-06-its-your-money-claim-it-now/) (snippet), [tech.africa](https://tech.africa/earned-wage-access-south-africa/) |
| Yoco | Card acceptance for small traders | Card machines and online payments; in-person debit rates from 2.30 percent up to R50k turnover (Core). Money-management features for traders not verified. | Not verified | [Yoco fees](https://www.yoco.com/za/fees) |
| MTN MoMo | Wallet | Relaunched in SA in 2020; card top-ups added with Mastercard (Oct 2025). Current SA user count not verified. | No evidence found | [ITWeb 2020](https://itweb.africa/article/mtn-ozow-lock-in-momo-partnership/WnxpE74g9OJvV8XL), [Engineering News 2025](https://www.engineeringnews.co.za/article/mtn-momo-mastercard-expand-digital-financial-inclusion-collaboration-2025-10-30) |
| Vodacom VodaPay | Wallet and super app | Wallet with Bidvest Bank; 1.6m registered users in May 2022. Current users not verified. | No evidence found | [Telecom Review Africa](https://www.telecomreviewafrica.com/articles/telecom-operators/3780-vodapay-wallet-teams-up-with-bidvest-bank/), [Connecting Africa](https://connectingafrica.com/financial-inclusion/vodacom-launches-vodapay-super-app-) |
| Personetics, Meniga (B2B vendors) | Bank insight engines | Entered SA through local partners (2014, 2016). Current SA bank clients not verified. These are the real "buy" alternatives a bank will compare Tengo with. | Not verified for SA | [Personetics 2014](https://personetics.com/test-post-title/), [Meniga 2016](https://meniga.com/news/meniga-and-mdm-technologies-bring-next-generation-digital-banking-solutions-to-south-african) |

Other informal-income tools (for example Kazang, spaza ordering apps) were not checked and are not claimed.

### Differentiation and defensibility

- Differentiation: a date, not a balance; irregular income cadence (weekday or interval); three plain states; safe to spend and safe to lend; multilingual messaging. Verified competitors offer budgets, categories and near-term payment views instead.
- Defensibility: low. The method is published in the README and is easy to copy. What can become defensible is accuracy evidence from real pilots, tested copy in 11 languages, and a cash-entry habit loop (COMM-04) that bank tools ignore.

### Go-to-market

1. Now to submission: fix COMM-07 and COMM-08 copy, add cash entry if time allows, and pitch model (a).
2. Next 3 months: 5 to 8 user tests with drivers, hairdressers and spaza owners; publish backtest; one-page business case (COMM-11).
3. Months 3 to 9: one bank pilot with 5 000 to 20 000 invited customers, push only, control group, four KPIs.
4. Months 9 to 24: commercial licence with platform floor; second bank or white-label; sponsor-funded track for cash earners.

### Strongest and weakest parts of the pitch

- Strongest: "A balance tells you what you have. Tengo tells you until when." It names a gap no verified competitor fills, for a large, low-resilience segment, in a form that fits inside a bank app.
- Weakest: there is no reason a bank cannot build it, the per-user economics at one bank are thin, the product ignores cash, and there is no user evidence yet.

## Top three risks

1. **Build instead of buy.** A bank with FNB's digital scale can reproduce the engine quickly. Tengo is then a hackathon idea, not a supplier (COMM-01).
2. **Thin economics.** A low per-user fee, a long procurement cycle and messaging costs can leave the company loss-making even after a successful pilot (COMM-02, COMM-03).
3. **Trust failure with cash earners.** Forecasts that ignore cash will say Short to people who are fine, and they will stop using it. Activation and retention will then miss the pilot KPIs (COMM-04, COMM-05).

## Score

4 out of 10: a clear, differentiated feature concept with the right embed architecture, but no moat, no user evidence, a blind spot for cash income, and unit economics that only work with a platform floor or more than one bank.

## Sources

All accessed 2026-10-20.

- https://www.statssa.gov.za/publications/P0211/Presentation%20QLFS%20Q2%202026.pdf
- https://www.statssa.gov.za/publications/P0211/Media%20Release%20QLFS%20Q2%202026.pdf
- https://www.sanews.gov.za/south-africa/sa-official-unemployment-rate-rises-336
- https://www.statssa.gov.za/publications/P0302/P03022026.pdf
- https://thedocs.worldbank.org/en/doc/be6615202d1f08a25855c8ac2d615122-0050012025/related/Little-Data-Book-2025-Web.pdf
- https://datareportal.com/reports/digital-2026-south-africa
- https://www.businessday.co.za/companies/2026-09-16-fnb-ceo-bullish-as-deposits-top-r1-trillion-and-private-banking-nears-2-million-clients/
- https://www.capitecbank.co.za/globalassets/pages/investor-relations/financial-results/2026/audited-results/cpify26_summary.pdf
- https://www.capitecbank.co.za/globalassets/pages/documents-library/transact/personal-banking-fees-2026.pdf
- https://www.capitecbank.co.za/blog/articles/best-way-to-bank/how-to-use-our-app-to-manage-your-money/ (search snippet only, page blocked)
- https://www.businessday.co.za/companies/2026-08-18-absas-digital-users-rise-14-as-it-pushes-technology-adoption/
- https://techfinancials.co.za/?p=4061055
- https://www.standardbank.co.za/static_file/South%20Africa/PDF/Personal%20Pricing/2026/Access_Account_Pricing_Guide_2026.pdf
- https://www.standardbank.co.za/southafrica/personal/learn/do-more-with-our-banking-app-part-1
- https://businesstech.co.za/news/industry-news/843969/introducing-standard-bank-money-reels-see-what-your-money-habits-say-about-you/
- https://businesstech.co.za/news/banking/250773/fnb-launches-new-nav-money-tool/
- https://sundayworld.co.za/news/fnbs-smart-budgeting-reveals-top-spend-from-customers/
- https://personal.nedbank.co.za/bank/digital-banking/needs/manage/money-tracker.html
- https://www.absa.co.za/offers/absa-savings-coach/
- https://www.discovery.co.za/bank/blog-budgeting-solutions-with-financial-analyser
- https://www.news24.com/news24/partnercontent/discovery-bank-launches-ai-tech-that-allows-clients-to-see-spending-habits-on-whatsapp-20250327
- https://gotyme.co.za/personal/media/money-skills-landing/how-can-i-earn-10percent-interest-with-goalsave
- https://dailyinvestor.com/banking/112501/billionaire-patrice-motsepe-backed-bank-hits-12-million-clients/
- https://vault22.com/
- https://www.businessday.co.za/bt/business-and-economy/2025-04-06-its-your-money-claim-it-now/ (search snippet)
- https://tech.africa/earned-wage-access-south-africa/
- https://www.yoco.com/za/fees
- https://itweb.africa/article/mtn-ozow-lock-in-momo-partnership/WnxpE74g9OJvV8XL
- https://www.engineeringnews.co.za/article/mtn-momo-mastercard-expand-digital-financial-inclusion-collaboration-2025-10-30
- https://www.telecomreviewafrica.com/articles/telecom-operators/3780-vodapay-wallet-teams-up-with-bidvest-bank/
- https://connectingafrica.com/financial-inclusion/vodacom-launches-vodapay-super-app-
- https://personetics.com/test-post-title/
- https://meniga.com/news/meniga-and-mdm-technologies-bring-next-generation-digital-banking-solutions-to-south-african
- https://www.itweb.co.za/videos/category/APero3qZydGMQb6m
- https://claude.com/pricing
- https://chatmaxima.com/whatsapp-api-pricing/south-africa/
- https://developers.facebook.com/docs/whatsapp/pricing
- https://www.panaceamobile.com/gateways/bulk-sms-gateway/
- https://www.valutafx.com/history/usd-zar-2026-08-20
- https://payfast.io/fees (search index; direct fetch failed)
- https://www.getpanto.ai/blog/mobile-app-retention-statistics
- https://openbankingtracker.com/regulation/south-africa-open-banking
- https://engineeringnews.co.za/print-version/world-bank-awards-ten-southern-african-fintech-startups-with-solution-growing-capital-2023-07-17
- Further sources for model inputs only are listed in `docs/review/model-inputs.md`.

## Findings table

| id | severity | title | evidence | recommendation | effort |
| --- | --- | --- | --- | --- | --- |
| COMM-01 | High | No defensible moat against the bank building it | src/engine/forecast.ts is simple percentile maths; FNB nav» Money available funds (BusinessTech 2018); Standard Bank Future Payments; FNB 8.16m digitally active (BusinessDay 2026-09-16) | Lead with backtested accuracy, tested multilingual content and a pilot playbook; license the engine; do not claim a tech moat | M |
| COMM-02 | High | Single-bank unit economics do not break even | model-inputs.md funnel gives about 44 000 MAU; R5 per MAU less R1.23 cost gives R166k contribution against R310k fixed; break-even about 82 000 MAU | Pilot fee plus per-MAU fee plus annual platform floor; plan a second bank or white-label within 18 months | M |
| COMM-03 | High | Daily paid messaging costs more than the licence fee | WhatsApp utility USD 0.0095 (ChatMaxima, Meta) x 30 x R16.13 = R4.60; marketing R18.34; SMS R0.24 x 30 = R7.20 (Panacea) | Default to in-app push; WhatsApp on state change, at most weekly; keep templates | S |
| COMM-04 | High | The segment's cash income is invisible to the product | Personas earn cash (en.json personas); TengoRepository has no add method (src/data/repository.ts:75 to 96); stokvels not modelled (Findex 19.6 percent) | Add cash in, cash out and cash on hand entry, plus stokvel contributions | M |
| COMM-05 | Medium | No evidence of outcomes for a bank buyer | Synthetic data only (fact sheet); bank value inputs are all Assumption (model-inputs.md section 5) | Run 5 to 8 user sessions, publish backtest, offer a control-group pilot with four KPIs | M |
| COMM-06 | Medium | A consumer subscription does not fit the segment | Capitec account R7.50 a month; free bank budgeting tools; PayFast 3.2 percent plus R2; finance app day 30 retention 4.2 to 15 percent (weak source) | Keep Tengo free; test a paid tier only for small business owners later | S |
| COMM-07 | Medium | The distribution story conflicts with the product as shown | Landing stat "Bank logins needed"; CSV-only onboarding (src/pages/Import.tsx); open banking start date unconfirmed | Pitch one channel: inside the bank app with bank data and consent; CSV is the demo path | S |
| COMM-08 | Medium | The pitch overclaims languages | Landing "Official languages" stat; all 10 non-English locales are English (fact sheet, src/i18n/status.json, walkthrough item 5) | Show one or two reviewed languages or reword the stat | S |
| COMM-09 | Low | One buyer, one channel | Built for an FNB competition (README line 9); Capitec 15.3m, Absa 5.4m, Nedbank 3.2m digital users exist | Prepare white-label and platform-partner tracks alongside FNB | M |
| COMM-10 | Low | Brand assets are not commercially cleared | Public Stunt personal-use licence and unconfirmed name origin (BRIEF.md sections 1 and 5); placeholder logo (fact sheet) | Clear the font licence, confirm the name, run a trademark search | S |
| COMM-11 | Low | No written business case in the repository | README.md and BRIEF.md have no buyer, pricing or metrics section | Add a one-page business case linked to model.xlsx | S |
