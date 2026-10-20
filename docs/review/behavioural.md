# Behavioural economist and financial inclusion researcher

## Verdict

Tengo asks the right question for people paid in lumps, and its date-first answer, daily figure and loan check are a credible attempt to turn a balance into a decision. The behavioural case is weaker than the pitch suggests. No published study shows that a runway date changes behaviour more than a balance does, so that claim is a hypothesis to test, not a finding. Three frames also carry real risk of harm. "Safe to spend today" can license spending well above a person's normal rate and drop them a level (Lerato: R330 a day against a usual R120, with rent of R2 800 due a week later and not mentioned). "Safe to lend up to" turns a ceiling into a default with a one-tap button and ignores the money already promised to safe to spend and to "set aside". The model only sees one bank account, while the people it targets live largely in cash, stokvels, family transfers and several wallets, none of which appear in the seed data or the engine. The product is promising as a prompt for reflection and not yet safe as a guide to action. It needs the frames fixed and a small field test with real earners in Tshwane, Mamelodi and Tembisa before anyone claims it builds money confidence.

## What works

- **The question matches lived reality.** Irregular, lumpy income is the defining feature of low-income household finance in South Africa (Collins, Morduch, Rutherford and Ruthven, Portfolios of the Poor, which included South African financial diaries). The tagline "is my money enough until the next money" names that problem in plain words. Evidence: `README.md` lines 1 to 9, `src/i18n/locales/en.json:346-368`.
- **Daily framing is well chosen for adoption.** Framing a recurring amount per day rather than per month quadrupled enrolment in a savings programme and removed the income gap in take-up (Hershfield, Shu and Benartzi 2020). "Safe to spend today" uses the same unit as the day-to-day decisions of a driver, hairdresser or shop owner. Evidence: `src/engine/forecast.ts` (`safeToSpendToday`), `docs/review/screens/thabo-home-light-390.png`.
- **Salience of a specific upcoming cost.** Reminders work best when they name a specific future lumpy expense (Karlan, McConnell, Mullainathan and Zinman 2016), and salience of overdraft fees reduced overdrafts, most among less financially literate customers (Stango and Zinman 2014). Tengo's date, "Bills before next money" and the Why this date drawer make future costs salient in the same way. Evidence: `docs/review/screens/ayanda-why-drawer-light-390.png`.
- **Transparent, conservative headline.** The headline counts only money already in the account and says so ("Money you have not received yet is not counted"), and Enough requires the heavy week path to reach the latest likely next money. This avoids the most common reassurance error of income forecasts. Evidence: `README.md:302`, `src/engine/forecast.ts:217`, `ayanda-why-drawer-light-390.png`.
- **Short is paired with an action, not only a warning.** Short states show "What helps most" with a concrete daily cut and a "Try it in Plan" link, and the daily message ends with "Check Plan in Tengo to see what helps most". Action-first messages reduce the chance that bad news leads to avoidance (see BEH-06). Evidence: `ayanda-home-light-390.png`, `src/i18n/locales/en.json:674-676`.
- **The loan check exists at all.** Lending and giving to family is a core behaviour that most budgeting tools ignore. Showing "days less cover" before lending gives people a concrete, shareable reason for a smaller amount. Evidence: `docs/review/screens/thabo-plan-dark-1280.png`.
- **Privacy-aware message content.** The daily message promises "Never your balance or transactions", which matters on shared phones. Evidence: `docs/review/screens/ayanda-inbox-light-390.png`.

## What to improve

### BEH-01 "Safe to spend today" can license overspending and hides the next big bill
**Severity:** High
**Evidence:** Safe to spend is balance minus bills before the latest next money, divided by days to it (`src/engine/forecast.ts`, `perDay`). It is not tied to the person's spending rate or to the cover state. For Lerato it is R330 while her usual daily spend is R120 and her heavy week rate is R276 (`docs/review/prep/persona-snapshot.json`). My probe with the real engine (`docs/review/tools/behavioural/frames.ts`) shows that if Lerato spends the R330 every day until next money, she drops from Enough to Tight and her date moves from 1 Nov to 25 Oct. Her rent of R2 800 on 1 Nov is the reason her headline date is 1 Nov, yet neither the safe to spend card nor "You are covered" mentions it (`lerato-home-dark-1280.png`). Daily framing makes amounts feel small and acceptable (Atlas and Bartels, periodic pricing; Hershfield, Shu and Benartzi), so a daily figure framed as "safe" will be read as an allowance. A preliminary conference poster also suggests budget feedback can speed up spending towards the limit (Huang and Liang, UBC poster, treat as preliminary).
**Recommendation:** Make safe to spend the largest daily amount that keeps the current state (the same search already used for safe to lend), never above the heavy week rate when Enough. Rename it "Spend up to R… a day to stay Enough". Always show the next large bill after next money ("Rent R2 800 on Sun 1 Nov"). Test the wording in the user study (questions C4 and C5).
**Effort:** S

### BEH-02 The model sees one bank account; the target users live in cash, wallets and several accounts
**Severity:** High
**Evidence:** There is no cash ledger, no manual income or spend entry, no detection of transfers between own accounts, and no handling of cash withdrawals (grep of `src/engine` and `src/lib` finds no `ATM`, `transfer` or `withdraw` rule except the CSV debit column name at `src/lib/csv.ts:50`). A withdrawal to cash is counted as everyday spend, a transfer to an e-wallet or savings pocket as spend, and money moved in from another own account as income that can become "next money". FinScope SA Consumer 2023 reports that 94 percent withdraw cash monthly, and the SARB Payments Study found cash is 56 percent of payments by volume. The seed data understates this: Thabo's "Cash fares" are deposited into the bank most days (`src/data/seed/generate.ts`), which few drivers would do in practice (Assumption: from the FinScope cash withdrawal pattern, most daily cash is spent from the pocket). The persona copy says "Cash fares most days" and "Cash takings come in lumps" (`src/i18n/locales/en.json:122,130`), but the engine only sees cash that reaches the bank.
**Recommendation:** Add a "Cash in hand" figure the user updates in one tap, a quick "money in" and "money out" entry, a transfer rule (same amount out and in within two days, or a user tag "my other account or wallet"), and a prompt on large deposits: "Is this your income, a stokvel payout, or your own money moved?". Show "Based on your bank account only" under the date until cash is added.
**Effort:** M

### BEH-03 "Safe to lend up to" anchors a default and double counts the same money
**Severity:** High
**Evidence:** The loan check shows a large "Safe to lend up to R320" and a one-tap "Use R320" chip (`src/pages/Plan.tsx:204-238`, `thabo-plan-dark-1280.png`). A displayed maximum with a button to apply it acts as an anchor and a default. Safe to lend is computed independently of safe to spend and of "set aside": Lerato is told she can set aside R280 (Home) and lend R280 (Plan), and spend R330 today, all from the same buffer (`src/engine/help.ts:49` reuses `safeToLend` for `canSetAside`). My probe shows that lending R280 and spending R330 on the same day drops Lerato to Tight, and Thabo lending R320 plus spending R295 moves his date a day earlier (`frames.ts` output). The loan is modelled as gone, with no option for an expected repayment date or partial repayment, and the Short message "no amount is safe to lend" is a moral verdict that people facing family obligations will override (Mangoma and Wilson-Prangley 2019 find transfers to family are substantial and usually monthly; Magubane 2017 finds black tax can crowd out savings). Positively, a number from a neutral tool can be a socially acceptable reason to give less, which is worth keeping.
**Recommendation:** Reframe as "Give or lend without dropping a level", show one shared budget ("Today you can spend R… or lend R…, not both"), remove the "Use" chip or relabel it "Show me the most", add "Expect it back on" with a date that feeds the what-if, and in Short show the cost in days ("Lending R200 brings your date forward 1 day") instead of "no amount is safe". Add a short, optional script the user can share ("I can do R… this week, more after the 25th").
**Effort:** M

### BEH-04 Conflicting signals undermine comprehension and trust
**Severity:** Medium
**Evidence:** (1) Thabo's hero reads "Enough until Tue 27 Oct" with a "Tight" chip (`src/components/forecast/DateHero.tsx:9` uses "Enough until" for every non-Short state; `thabo-home-light-390.png`). (2) Ayanda's hero says Short while the 30 day chart says Enough for today (`ayanda-home-light-390.png`, `walkthrough.md` item 3). (3) Ayanda gets two daily targets: safe to spend R310 and "Spend about R250 less a day", which implies about R373 against her R623 usual rate, with different end dates (26 Oct and 25 Oct) (`frames.ts` output, `src/engine/help.ts`). (4) Lerato's headline date equals the end of her range (band 26 Oct to 1 Nov, headline 1 Nov), so the "likely" date sits at the edge rather than the middle (`persona-snapshot.json`). People under financial strain have less attention to reconcile mixed messages (Mani, Mullainathan, Shafir and Zhao 2013; note Carvalho, Meier and Wang 2016 found no cognitive effect around payday, so the size of this effect is contested).
**Recommendation:** Use a state-neutral label ("Money lasts until"). Give one daily number per state and make "What helps most" express its cut as that number. Reconcile the chart and hero with a visible line ("If your money lands as usual on Sun 25 Oct, you are back to Enough"). Test comprehension of the range with question C3.
**Effort:** S

### BEH-05 Business inputs are treated as household spending to cut
**Severity:** Medium
**Evidence:** Ayanda's top spend is stock (R15 137 over 90 days) and "What helps most" tells her to spend R250 less a day (`persona-snapshot.json`, `ayanda-home-light-390.png`). For a spaza owner, cutting stock cuts future takings. Thabo's fuel is the input to his income. The bill-move suggestion for Thabo names his car instalment (`walkthrough.md` item 10), which for an e-hailing driver is the asset that earns the income. A Short state that appears every restock cycle risks alert fatigue for a shop owner whose business normally runs that way (Assumption: wholesale runs are periodic, so Short may recur every cycle).
**Recommendation:** Add a "business stock and fuel" group, keep it out of the daily cut, and phrase help for business users as timing ("Restock after Sun 25 Oct if you can"). Exclude vehicle finance and funeral policies from bill-move suggestions, or warn that moving them may cost fees or cover.
**Effort:** M

### BEH-06 Daily bad news risks avoidance, anxiety and exposure on shared phones
**Severity:** Medium
**Evidence:** The Inbox design sends a message every morning at 07:00 that reads "Your money may run out on Fri 23 Oct... Cover: Short" (`ayanda-inbox-light-390.png`, `src/i18n/locales/en.json:666-682`). Investors look at accounts less after bad news (Karlsson, Loewenstein and Seppi 2009, the ostrich effect), so a daily Short message may lead to muting rather than action. Nudges can also have side effects: payment reminders cut late fees but raised overdraft fees for some users (Medina 2021). The message preview on a lock screen shows state and safe to spend, which on a shared or family phone can invite requests (if not Short) or shame (if Short). The privacy promise covers balance and transactions only.
**Recommendation:** Default to messages on change of state or two days before a Short date, not daily. Offer a neutral lock-screen preview ("Your Tengo update is ready"). Lead with the next action and a specific upcoming cost, which Karlan et al. found more effective. Track opt-out rates by state in any pilot.
**Effort:** S

### BEH-07 Stokvels, burial societies, family transfers and informal credit are absent
**Severity:** Medium
**Evidence:** The seed descriptions contain no stokvel, burial society, family transfer, mashonisa or airtime advance entries (`src/data/seed/generate.ts`). FinScope SA Consumer 2023 reports informal savings at 30 percent of adults (10 percent in 2003), burial societies at 29 percent and borrowing to buy food at 40 percent. NASASA estimates are reported as over 11 million stokvel members (Cape Argus 2024). A rotating stokvel payout is a large, infrequent deposit that can pass the 10 percent "next money" threshold and distort the income pattern (`src/engine/forecast.ts:24`, Assumption: payout sizes of one to several months of contributions). Contributions are only treated as bills if the amount and gap fit the monthly rule (`src/engine/classify.ts:16`), so weekly contributions become everyday spend.
**Recommendation:** Add a stokvel contribution and payout, a family transfer and an informal loan repayment to at least one persona. Let users mark a deposit "one-off or stokvel payout" so it is excluded from the next money pattern, and mark a regular contribution as a commitment rather than spend.
**Effort:** M

### BEH-08 The date-first behavioural claim is unproven
**Severity:** Low
**Evidence:** The pitch line "A balance tells you what you have. Tengo tells you until when" (`README.md:5`) implies a date changes behaviour more than a balance. I found no published experiment comparing a runway date with a plain balance. The nearest evidence is adjacent (daily framing, salience of costs, reminders). Monzo shows a "left to spend" estimate, which suggests the idea is in use but not that it works better (Monzo help page).
**Recommendation:** Present the date-first claim as a hypothesis in the pitch and run the comparison in the user study (task T2).
**Effort:** S

### BEH-09 Account-level view can be gamed or used strategically
**Severity:** Low
**Evidence:** The state depends only on the balance of the imported account (`src/engine/forecast.ts`, `forecast`). A user can move money to another account or wallet to make the state look Short, for example to show a relative, or keep income elsewhere so the app looks better than reality. Assumption: strategic display is plausible where requests from family are frequent; there is no data on how often it would occur.
**Recommendation:** Treat this as a design input, not a flaw to police. Ask in testing how people would show or hide the screen (question F3), and keep the shared message free of amounts if users prefer.
**Effort:** S

## User-testing plan (5 to 8 participants, hackathon budget)

**Aim.** Check comprehension of the date, range, states and safe to spend; whether a date prompts different decisions than a balance; and how the loan check fits family obligations. This is qualitative, not a statistical test.

**Participants.** Six, with two optional extras if time allows.
- Two e-hailing or minibus taxi drivers (Tshwane), two hairdressers or salon workers (Mamelodi), two spaza or informal traders (Tembisa).
- Screener: aged 18 or over; income varies week to week; uses a smartphone with WhatsApp; has a bank account or wallet; at least three of six include someone in a stokvel and someone who regularly sends money to family. Mix of gender and age. Exclude anyone who works in banking or fintech.
- Recruitment: through a community organisation, a salon or taxi rank contact, or a stokvel chairperson, with a short spoken explanation in the person's preferred language. Avoid friends of the team.

**Setting.** At the participant's place of work or a nearby quiet spot, outside peak trading hours, 40 to 45 minutes. Use a mid-range Android phone provided by the team with the demo installed and offline-capable, so no participant data is used and no data cost falls on them. One facilitator, one note taker who speaks the participant's language. Use the fictional personas only. Do not ask for real balances.

**Consent.** Plain-language verbal and written consent in the participant's language: what the study is, that the app is a demo with fictional data, that nothing they say is linked to their bank, that they can stop at any time and still receive the incentive, whether audio is recorded (ask separately), and that notes are anonymised and deleted after the hackathon. No photos of faces.

**Incentive.** Cash or a data or airtime voucher of about R200 to R300 per person plus transport if they travel (Assumption: a common range for short community interviews in Gauteng; confirm locally). Total for six: about R1 500 to R2 000, plus about R500 for refreshments and printing (Assumption).

**Tasks and exact questions.**

Warm-up (5 min)
- W1. "How do you know if your money will last until the next money comes in?"
- W2. "Which accounts, wallets, cash or groups does your money go through in a normal week?"
- W3. "When family asks to borrow, how do you decide how much?"

T1. First look at Home (Ayanda's or Lerato's screen, 2 minutes, no help)
- C1. "What does this date mean?" Success: says the money already there runs out around that day, before new money is counted.
- C2. "What does Short (or Enough) mean here?" Success: links the word to next money, not to a general judgement.
- C3. "The screen says likely between Thu 22 and Sun 25 Oct. What does that mean for you?" Success: understands it is uncertain, could be earlier.
- C4. "What does Safe to spend today R330 mean? If you spent R330 every day this week, what would happen?" Success: says it might not be safe every day or that rent comes later. Failure: treats it as a daily allowance.
- C5. "Is anything big coming after your next money?" (Lerato) Success: spots rent without opening drawers. Expected failure today, by design of BEH-01.

T2. Date versus balance (paper cards, order alternated between participants)
- Card A shows only "Balance R1 877". Card B shows "Short from Fri 23 Oct, safe to spend R310". Same situation.
- Q: "A friend asks you for R300 today. With this card, what would you do?" then "Would the other card change your answer? Why?" Record the amount each card leads to. Success for the hypothesis: Card B leads to a smaller or delayed amount for at least four of six, with reasons tied to the date.

T3. Loan check (Thabo's Plan screen)
- Q: "Your sister needs R500 for school shoes. Use the app to decide." Observe whether they tap "Use R320".
- Q: "What does Safe to lend up to R320 mean to you?" "Would you show this screen to your sister?" "If it said no amount is safe, what would you do?"
- Success: understands it as a limit, not a recommendation; finds a way to give less without shame.

T4. What helps most (Ayanda)
- Q: "It says spend about R250 less a day. What would you cut?" Success: does not cut stock or fuel; if they do, record as BEH-05 evidence.

T5. Message (Inbox)
- Q: "If this came every morning at 7, how would you feel? Would you keep it on?" "Who else sees your phone?"

Wrap-up (5 min)
- F1. "Would you trust this date? What would make you trust it more?"
- F2. "What does it miss about how your money really works?" (probe cash, stokvel, family, airtime)
- F3. "Would you ever want this to look better or worse than it is? When?"
- F4. "On a scale of 1 to 5, how sure do you feel about your money until next week after using this?" Ask the same item before T1 to see direction only.

**What counts as success or failure.**
- Pass to proceed: at least five of six answer C1 and C2 correctly, at least four of six answer C3 correctly, and no one describes Safe to spend as a daily allowance in C4.
- Red flags that stop a pilot until fixed: two or more treat safe to spend or safe to lend as permission; two or more cut stock or fuel in T4; two or more say they would turn messages off in T5 because they feel judged.
- Record cash, stokvel, family and wallet flows in W2 for each participant to size BEH-02 and BEH-07.

**Running it on a hackathon budget.** Two team members, one afternoon per area across two days, six sessions. Paper cards and the offline demo, no recording equipment beyond a phone if consent is given. Write up a one-page table of answers per question and three quotes per finding within 24 hours. Total cost about R2 000 to R2 500 plus transport (Assumption).

## Top three risks

1. **Harmful action on a "safe" figure.** People treat safe to spend or safe to lend as permission and drop a level or miss rent, while the app said "safe" (BEH-01, BEH-03).
2. **False precision from a partial view.** Cash, wallets, stokvels and family transfers make the single-account date wrong in ways the user cannot see, which damages trust after the first miss (BEH-02, BEH-07).
3. **Disengagement of the people who need it most.** Daily Short messages and advice that cuts business inputs push the most stretched users to mute or abandon the app (BEH-05, BEH-06).

## Score

5 out of 10. The question, daily framing and transparency are strong, but the "safe" frames can mislead, the single-account view misses how the personas actually handle money, and the core behavioural claim is untested.

## Sources

All accessed 2026-10-20.

- FinScope SA Consumer 2023 survey launch deck, FinMark Trust: https://finmark.org.za/Publications/FinScope_SA_Consumer_2023.pdf (94 percent withdraw cash monthly; informal savings 30 percent in 2023 versus 10 percent in 2003; burial society 29 percent; borrowing money to buy food 40 percent; informal sector 8.5 million in 2023 on FinScope's measure)
- SARB Payments Study results as reported by The Herald, 6 Sep 2024: https://www.theherald.co.za/news/2024-09-06-cash-remains-king-in-sa-bank-study-shows/ (cash 56 percent of payments by volume, 21 percent by value)
- SARB Deputy Governor Rashad Cassim, Payments Study Report launch speech: https://bis.org/review/r240910a.htm
- Cape Argus, stokvels opinion piece citing NASASA estimates, 2 Apr 2024: https://capeargus.co.za/personal-finance/financial-planning/2024-04-02-stokvels-and-societys-success-is-all-about-relationships-support-and-understanding
- Matuku and Kaseke 2014, The role of stokvels in improving people's lives, Social Work/Maatskaplike Werk: https://socialwork.journals.ac.za/pub/article/view/388/368
- Mangoma and Wilson-Prangley 2019, Black Tax: understanding the financial transfers of the emerging black middle class, Development Southern Africa (catalogue entry): https://library.au.int/node/522206
- Magubane 2017, Black tax: the emerging middle class reality, University of Pretoria: https://repository.up.ac.za/handle/2263/59861
- Collins, Morduch, Rutherford and Ruthven, Portfolios of the Poor, summary: https://nextbillion.net/portfolios-of-the-poor-financial-diaries-of-the-bottom-billion
- Thaler 1999, Mental accounting matters, Journal of Behavioral Decision Making: https://people.bath.ac.uk/mnsrf/Teaching%202011/Thaler-99.pdf
- Hershfield, Shu and Benartzi 2020, Temporal reframing and participation in a savings program, Marketing Science: https://pubsonline.informs.org/doi/epdf/10.1287/mksc.2019.1177 and https://www.informs.org/News-Room/INFORMS-Releases/News-Releases/New-Research-Exposes-the-Mindset-Required-to-Save-Money
- Atlas and Bartels, Periodic pricing and perceived contract benefits, summary by Chicago Booth Review: https://www.chicagobooth.edu/review/why-dollars-day-pitch-works
- Huang and Liang 2018, budget feedback and spending, SJDM poster (preliminary): https://dlab.sauder.ubc.ca/sjdm/presentations/2018-Poster-Huang-Liang-Budget-Feedback-Spending~.pdf
- Karlan, McConnell, Mullainathan and Zinman 2016, Getting to the top of mind: how reminders increase saving, Management Science: https://img.nber.org/papers/w16205
- Stango and Zinman 2014, Limited and varying consumer attention, Review of Financial Studies: https://www.nber.org/papers/w17028
- Karlsson, Loewenstein and Seppi 2009, The ostrich effect, Journal of Risk and Uncertainty: https://www.cmu.edu/tepper/faculty-and-research/assets/docs/ppaper-61264983153898-ostrich-effect-1.pdf
- Medina 2021, Side effects of nudging, Review of Financial Studies: https://ideas.repec.org/a/oup/rfinst/v34y2021i5p2580-2607..html
- Mani, Mullainathan, Shafir and Zhao 2013, Poverty impedes cognitive function, Science: https://princeton.edu/news/2013/08/29/poor-concentration-poverty-reduces-brainpower-needed-navigating-other-areas-life
- Carvalho, Meier and Wang 2016, Poverty and economic decision-making, American Economic Review: https://business.columbia.edu/faculty/research/poverty-and-economic-decision-making-evidence-changes-financial-resources-payday
- Monzo help, What is left to spend: https://monzo.com/help/budgeting-overdrafts-savings/what-is-left-to-spend

## Findings table

| id | severity | title | evidence | recommendation | effort |
| --- | --- | --- | --- | --- | --- |
| BEH-01 | High | Safe to spend can license overspending and hides the next big bill | Lerato R330 safe vs R120 usual; following it daily drops Enough to Tight, date 1 Nov to 25 Oct (docs/review/tools/behavioural/frames.ts); rent R2 800 on 1 Nov not shown (lerato-home-dark-1280.png); src/engine/forecast.ts perDay | Cap at the amount that keeps the current state, rename "Spend up to R… a day to stay Enough", always show the next large bill after next money | S |
| BEH-02 | High | Model sees one bank account while users live in cash, wallets and several accounts | No cash ledger, manual entry or transfer rule in src/engine or src/lib; FinScope 2023 94 percent withdraw cash monthly; SARB cash 56 percent of payments by volume; seed deposits cash fares daily (src/data/seed/generate.ts) | Add cash in hand, quick entries, transfer detection and a prompt on large deposits; label the date "bank account only" until cash is added | M |
| BEH-03 | High | Safe to lend anchors a default and double counts the same buffer | "Use R320" chip (src/pages/Plan.tsx:204-238); canSetAside reuses safeToLend (src/engine/help.ts:49); lend R280 plus spend R330 drops Lerato to Tight (frames.ts); no repayment option | Reframe as give or lend without dropping a level, show one shared budget, remove or relabel the chip, add expected repayment date, show days lost instead of "no amount is safe" | M |
| BEH-04 | Medium | Conflicting signals undermine comprehension and trust | "Enough until" with Tight chip (src/components/forecast/DateHero.tsx:9); hero Short vs chart Enough (ayanda-home-light-390.png); two daily targets R310 and about R373 for Ayanda; headline at band edge for Lerato (persona-snapshot.json) | State-neutral label, one daily number per state, explicit hero and chart reconciliation line, test range comprehension | S |
| BEH-05 | Medium | Business inputs treated as household spending to cut | Ayanda top spend stock R15 137 and advice to spend R250 less a day (persona-snapshot.json); Thabo told to move car instalment (walkthrough.md item 10) | Add a business stock and fuel group excluded from cuts, timing-based advice, exclude vehicle finance and funeral cover from bill moves | M |
| BEH-06 | Medium | Daily bad news risks avoidance, anxiety and exposure on shared phones | Daily 07:00 Short message (ayanda-inbox-light-390.png, en.json:666-682); ostrich effect (Karlsson et al. 2009); nudge side effects (Medina 2021) | Change-based messages, neutral lock-screen preview, action-first copy naming a specific cost, track opt-out by state | S |
| BEH-07 | Medium | Stokvels, burial societies, family transfers and informal credit absent | No such entries in src/data/seed/generate.ts; FinScope 2023 informal savings 30 percent, burial society 29 percent; stokvel payout can pass the 10 percent next money threshold (src/engine/forecast.ts:24) | Add these flows to a persona, let users tag deposits as one-off or stokvel payout and contributions as commitments | M |
| BEH-08 | Low | Date-first behavioural claim is unproven | No published runway vs balance experiment found; README.md:5 implies it; nearest evidence is adjacent (Hershfield et al., Karlan et al.) | Present as a hypothesis and test it in task T2 of the user study | S |
| BEH-09 | Low | Account-level view can be gamed or used strategically | State depends only on the imported account balance (src/engine/forecast.ts forecast); Assumption on frequency | Treat as a design input, ask about showing or hiding the screen in testing, keep shared messages free of amounts | S |
