# Tengo expert review brief

You are running a structured, independent review of the Tengo app as it exists now. Tengo is a money app for people with irregular income that answers one question: is my money enough until the next money? It is entered in the FNB App of the Year hackathon (track: Financial inclusion and money confidence). The goal is an honest assessment of what works, what does not, and what to fix, plus the commercial and impact case. The founder wants candour, not praise.

## 1. Ground rules

- This is a read-only review. Do not change application code, tests or configuration. Write only into `docs/review/`. Anything you would fix goes in the findings, not in the code.
- Evidence over opinion. Run the app, click through every page, read the code, run the tests and the forecast engine. Every finding cites evidence: a file and line, a screenshot path, a test output or a source URL.
- No invented numbers. Any external fact (market size, prices, regulation, competitor details) must come from a source you looked up, with the URL and date accessed. Anything you cannot source is labelled "Assumption" with the reasoning and a plausible range. Never present an assumption as a fact.
- Reviewers are simulated professional perspectives. Do not claim to be real FNB staff or to know FNB's internal policy, systems or pricing. Reason from public information and say so.
- Be critical. Each reviewer must name at least three real weaknesses. A review with only strengths is rejected and redone.
- Copy rules for everything you write: no em dashes or en dashes, no exclamation marks, no filler, tight sentences. Plain English.
- Run each reviewer as an independent subagent so they do not anchor on each other. Give each the app, the codebase and this brief, and ask for their own findings file before any synthesis.

## 2. Preparation (do once, share with all reviewers)

1. Read the README, `docs/BRIEF.md` and `docs/REDESIGN.md` for intent and known decisions.
2. Run `npm run build`, `npm run test`, `npm run lint`, `npm run i18n:check` and the Playwright suite. Record results.
3. Start the app. Capture screenshots of every page, both themes, at 390, 768 and 1280px, for all three personas, into `docs/review/screens/`.
4. Walk each persona through the full flow (landing, picker, consent, Home, Plan, Money, import with the sample CSV, Inbox, Privacy, Me). Note every friction point.
5. Produce a one-page "what the product does today" fact sheet from the code, so reviewers argue from what exists rather than what the pitch says.

## 3. The review panel

Each reviewer writes `docs/review/<role>.md` with: a one-paragraph verdict, what works (with evidence), what to improve (ranked, each with severity High/Medium/Low, evidence, recommendation, effort S/M/L), top three risks, and a score from 1 to 10 with a one-line reason.

1. **Retail banking product lead (FNB-style).** Would this fit a bank's app and customer base? Where does it sit relative to existing features such as budgeting, balance alerts and overdraft tools? What would a bank need before piloting it? Data access (open banking, internal data), brand and compliance fit, internal sponsor, channel fit, customer segments.
2. **Head of technology / solution architect.** Architecture, code quality, state and data layer, the repository abstraction, forecast engine design, test strategy and coverage, performance on low-end phones and slow networks, offline behaviour, dependency and licence audit, scalability to a real backend, observability, what breaks first at 100 000 users. Run `npm audit`, a bundle size report, and a Lighthouse run with mobile throttling.
3. **Security and privacy lead (POPIA).** Review the simulated privacy controls against what a real implementation would need. Threat model for a real deployment: authentication, data at rest and in transit, row-level security, key management, logging without personal data, consent records, retention and deletion that actually delete, breach response, processor agreements, cross-border transfer, children and vulnerable users. Identify anything in the demo that could be mistaken for a real compliance claim. List what must exist before real user data is touched.
4. **Legal and regulatory advisor (South Africa).** Whether giving "safe to spend" figures, lending checks and savings suggestions could amount to regulated financial advice or credit activity, and what registration or disclaimers that implies. Consumer protection, disclosure and plain-language obligations, data protection, electronic communications and messaging consent. Everything sourced, with a plain statement that this is not legal advice.
5. **Credit and finance risk analyst.** Does the forecast logic hold for irregular earners? Check the assumptions (spend estimation, income cadence, bills, confidence, state thresholds, safe-to-spend rounding). Stress-test with edge cases: zero income, negative balance, a single large windfall, a missed bill, month-end spikes, very thin data, outliers, holidays. Judge whether the states Enough, Tight and Short could mislead someone into a harmful decision, and whether the wording is safe.
6. **Data scientist (forecast validation).** Backtest the engine. For each persona and for several cut-off dates, hold out the next 14 to 30 days, run the engine on the history before the cut-off, and compare. Report: error in days between forecast and actual cover date, how often the actual outcome falls inside the stated range band (calibration, and whether the band is too narrow or too wide), how often the state shown was right in hindsight, and performance with 14, 28 and 60 days of history. Be explicit that seeded data is synthetic and what that does and does not prove. Save the script in `docs/review/backtest/` and the results as CSV and charts.
7. **UI/UX designer.** Visual hierarchy, clarity of the date-first headline, typography and spacing, colour and contrast in both themes, dark and light parity, state communication beyond colour, motion, empty and error states, microcopy, consistency across pages, desktop versus mobile layout. Heuristic evaluation (Nielsen) with a score per heuristic, plus a cognitive walkthrough of the first two minutes for each persona.
8. **Accessibility and inclusive design specialist.** WCAG 2.2 AA review: keyboard, screen reader, focus order, contrast, touch targets, zoom and reflow, reduced motion, language attributes, error handling. Also inclusion beyond WCAG: low literacy, numeracy anxiety, low-end Android, data cost, shared phones, loadshedding and offline, multilingual reading level. Run axe in both themes and report manual findings the tools miss.
9. **Behavioural economist and financial inclusion researcher.** Will people understand and trust it? Does a date change behaviour more than a balance does? Risks of false reassurance, anxiety, or gaming. Fit with the lived reality of the three personas (e-hailing driver, hairdresser, spaza owner), including cash income, stokvels, informal lending and family obligations. Propose a small, realistic user-testing plan with 5 to 8 participants and the questions to ask.
10. **Localisation and language reviewer.** State of the 11 languages, the machine translation caveat, text expansion, Tshivenda glyph handling, date and number formats, tone for money messages, what a first-language review process should check, and which languages carry the most risk.
11. **Product strategist and commercial lead.** Business model, pricing, channel strategy, partners, competitive landscape in South Africa (banking app features, budgeting and money-management apps, informal-income tools, wallet apps), differentiation, defensibility, go-to-market, and the strongest and weakest parts of the pitch. Source every competitor claim.
12. **Investor and sceptic.** Argue against the product. Ten hardest questions a judge or investor would ask, and the best honest answer to each. What would make this a no.
13. **Hackathon judge panel.** Score the product 0 to 10 on each official criterion (Product, Creativity, Usability, Sustainability, Impact, Presentation, Intelligence) with a justification for each score, the biggest gap per criterion, and the single change that would raise the score most. Use the evidence from the other reviewers.

## 4. Metrics and financial model

Build `docs/review/model.xlsx` with live formulas (not pasted values), a clearly marked Assumptions sheet, and three scenarios (conservative, base, ambitious). Every input has a source or an "Assumption" label with a range. Include:

- **Market sizing.** Sourced figures for South African irregular and informal earners, banked adults and digital banking adoption. Show the funnel from total market to a realistic serviceable segment.
- **Unit economics per active user per month.** Revenue by model (see below), and costs: cloud and database, forecasting compute, LLM message generation, SMS and WhatsApp messaging (sourced from current public price lists, or assumption), support, compliance, payment fees if any. Contribution margin, payback period, LTV, CAC, LTV to CAC, churn.
- **Business models to compare.** (a) B2B2C licence or per-active-user fee to a bank, embedded in its app. (b) Revenue share on bank outcomes. (c) Freemium consumer subscription. (d) Sponsored or partner-funded for financial inclusion. State which fits best and why.
- **Value to a bank.** Model, with explicit assumptions, the possible benefits: lower overdraft and arrears distress, retention and deposit balances, engagement, cross-sell, cost to serve. Do not state outcomes as fact. Show sensitivity to the key assumptions.
- **Impact metrics.** Number of people reached, days of cover gained or shortfalls avoided, fees avoided per user per year, financial confidence change measured by a proposed survey item. Separate output metrics from outcome metrics.
- **Product metrics to track.** Activation, weekly active use, retention at day 7 and day 30, statement imports completed, messages opted in, forecast accuracy, state transitions acted on.
- **Forecast quality metrics.** From the backtest: mean absolute error in days, range coverage, state accuracy.
- **Technical metrics.** Test counts and coverage, Lighthouse scores, bundle size, time to interactive on throttled mobile, accessibility violations, vulnerabilities, licence summary.
- **Break-even and runway.** Monthly costs against revenue, users needed to break even in each scenario, and a simple 24 month projection. Add a sensitivity table and a tornado-style summary of which assumptions matter most.

## 5. Synthesis deliverables

All in `docs/review/`:

1. `REPORT.pdf`, the full report. There is no page limit. Write it as a complete professional document with a cover page, contents page and numbered sections, and let it run as long as the evidence needs (expect 40 to 80 pages). The executive summary stays to one page at the front (verdict, scores table, top five strengths, top five risks, top three fixes), but everything behind it is in full. Structure:
   1. Executive summary.
   2. Scope, method, what was reviewed and what could not be established.
   3. What the product does today (the fact sheet, with screenshots).
   4. One full chapter per reviewer (all 13), each with verdict, what works, every finding with evidence, risks and score. Do not shorten or merge reviewers.
   5. Forecast backtest: method, tables, calibration charts, edge-case results, limits of synthetic data.
   6. Financial model: assumptions, market sizing, unit economics, business model comparison, bank value case, break-even, scenarios and sensitivity, with the charts.
   7. Impact case and measurement plan.
   8. Cross-cutting themes and conflicts between reviewers, and how you resolved them.
   9. Risk register.
   10. Prioritised roadmap.
   11. Judge Q&A and demo script.
   12. Appendices: full findings table, test and audit outputs, Lighthouse results, licence summary, source list with URLs and access dates, glossary.
   Use the PDF skill or a local tool, include real charts and the screenshots that support each point, and render every page to an image and inspect it for layout, clipping and unreadable charts before calling it done.
2. `findings.csv`, every finding from every reviewer with id, role, severity, evidence, recommendation, effort and status, so it can be sorted and filtered.
3. `ROADMAP.md`, split into: fix before hackathon submission (ranked by score impact per hour), fix before any real pilot, and later. Each item is linked to a finding id and an estimated effort.
4. `risk-register.md`, with likelihood, impact, owner suggestion and mitigation.
5. `judge-qa.md`, the likely 20 judge questions with short honest answers, and a recommended three-minute demo script that shows the strongest parts and handles the weakest ones.
6. `model.xlsx` and the backtest folder described above.
7. Individual reviewer files, as described in section 3.

## 6. Quality gate

Before finishing, check your own work:
- Every number in the report traces to a cell in the model, a test output or a source URL.
- Every external claim has a source and an access date.
- No reviewer is only positive, and the scores are not all the same.
- The model recalculates without errors and the scenarios differ in sensible ways.
- Grep all written files for em dashes, en dashes and exclamation marks, and fix any hits.
- Open the PDF pages as images and check layout, readable charts and no clipped text.
- State plainly at the top of the report what the review could not establish (for example real user behaviour, real bank data, legal sign-off).

Finish with a short message in chat: the verdict, the three most important fixes, the page count, and where the files are. The report itself is the full deliverable, not the chat message.