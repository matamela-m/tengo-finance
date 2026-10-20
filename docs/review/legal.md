# Legal and regulatory advisor (South Africa)

## Verdict

**This is not legal advice.** It is a simulated professional perspective for a hackathon review, based on public sources accessed on 2026-10-20 and the code at commit d114497; it does not replace an opinion from a South African attorney or a ruling from the FSCA, the NCR or the Information Regulator, and it does not claim knowledge of FNB's internal policy or licences. As a demo with fictional data and nothing sent, Tengo carries little legal risk today, and its "Simulated" labels are honest and well placed on the consent, Privacy and Inbox screens. As a real product the picture changes. Most of what Tengo says ("Enough until", "Safe to spend today", "Spend about R250 less a day") is cash flow guidance that does not relate to a financial product, so on the most likely reading it falls outside the FAIS definition of "advice" and needs no FSP licence. Three things break that comfort. First, "What helps most" can tell a user to pay a bill late, and the engine picks the bill by size alone, so it already tells Thabo to pay his car instalment after its due date (`src/engine/help.ts:62`, `docs/review/screens/thabo-home-light-768.png`). Pushing a credit instalment into arrears is the most harmful thing the app says, and the same logic would pick an insurance or funeral premium, which edges into FAIS advice on the "variation" or "termination" of a financial product. Second, the word "safe" is used as an unqualified promise ("Safe to spend", "Safe to lend up to") while the only "not financial advice" line sits at the bottom of a drawer most people will never open. Third, the daily WhatsApp and SMS messages default to on, carry no opt-out instruction or sender details, and would send a person's financial state through a foreign platform. None of this is fatal, and all of it is fixable in wording and engine rules before a pilot. The cheapest compliant route is to ship inside a licensed bank, under its FAIS licence, conduct standards and POPIA programme, rather than as a standalone fintech.

## What works

- **Honest simulation labels.** "Simulated privacy controls. Not a compliance certification." appears on the consent screen and the Privacy overview (`src/pages/Consent.tsx:65`, `src/pages/privacy/Overview.tsx:56`, `docs/review/screens/thabo-consent-light-768.png`). The Inbox says "Simulated. No message is sent." (`src/pages/Inbox.tsx:55`, `docs/review/screens/thabo-inbox-dark-390.png`). A judge or a user cannot reasonably mistake these for compliance claims.
- **Purpose limitation stated up front.** The consent notice says data is used "Not for marketing or credit scoring" (`src/i18n/locales/en.json:144`). This aligns with POPIA section 18 notice duties and, if kept true, keeps Tengo away from POPIA section 71 automated decision rules and the section 69 direct marketing rules.
- **Granular consent with the right default for analytics.** Forecast, messages and analytics are separate toggles; analytics is off by default (`src/pages/Consent.tsx:27-28`). Withdrawal pauses the forecast rather than silently continuing (`src/i18n/locales/en.json:167`, `paused` keys).
- **Explainability exists.** The Why drawer shows the inputs, the method and the rules for Enough, Tight and Short in plain language (`src/i18n/locales/en.json:403-439`, `docs/review/screens/thabo-why-drawer-dark-390.png`). That is the kind of logic disclosure POPIA section 71(3) expects where automated decisions apply, and it supports CPA section 22 plain language.
- **Message content minimisation.** Messages carry "Only your date, cover and safe to spend figure" and "Never your balance or transactions" (`src/i18n/locales/en.json:657-658`), which limits exposure on a lock screen.
- **Loan check is about the user's own money.** It answers "what does lending to family do to my cover", it does not arrange, broker or price credit (`src/engine/forecast.ts:346-367`). Tengo is not a credit provider or intermediary on this design.

## What to improve

### LEGAL-01: "What helps most" tells users to pay credit instalments and insurance premiums late
- **Severity:** High
- **Evidence:** `src/engine/help.ts:55-71` picks the smallest bill before next money that, moved to after it, lifts the state; candidates are sorted by amount only (line 62) with no check of what the bill is. For Thabo it outputs "Pay Car instalment (R3 450) after Tue 27 Oct instead of before." (`docs/review/prep/persona-snapshot.json`, help.billToMove; `docs/review/screens/thabo-home-light-768.png`). Missing a vehicle finance instalment is a default under a credit agreement; it can lead to a section 129 notice, enforcement, repossession by court order and an adverse credit listing (cars.co.za and Moonstone summaries of NCA s129 and s130). Ayanda's recurring bills include a funeral policy and Thabo's include car insurance (`persona-snapshot.json`). Insurance policies are "financial products" under FAIS, and "advice" includes a recommendation "on the variation of any term or condition applying to a financial product ... or on the termination" of it (FAIS s1(1)(d)). A prompt to pay a premium late, which risks a lapse, is arguably such a recommendation. Tengo also cannot know whether the payee will accept a later date; most of these are debit orders.
- **Recommendation:** (1) Classify bills into credit repayments, insurance and other, using description keywords plus a user confirmation step, and never suggest moving credit or insurance payments. (2) Reword the remaining suggestion to a question that keeps the decision with the user and states the risk: "Rent is due before your next money. If your landlord agrees to a later date, you would reach Tight. Ask first, and do not skip debit orders for loans or insurance." (3) Add a one-line inline note on the card: "Ideas, not advice. Check fees and penalties before changing a payment." (4) Add a unit test that a bill described as instalment, loan, finance, insurance, policy or premium is never returned as `billToMove`.
- **Effort:** M

### LEGAL-02: "Safe" is an unqualified promise and the disclaimer is hidden
- **Severity:** High
- **Evidence:** "Safe to spend today", "Safe to lend up to", "Use R320" (`src/i18n/locales/en.json:359,523`; `docs/review/screens/thabo-plan-dark-390.png`). "Safe to lend" for Thabo keeps him only at Tight, meaning a heavy week does not last (`src/i18n/locales/en.json:435,524`). Ayanda is Short yet sees "Safe to spend today R310" (`docs/review/screens/ayanda-home-light-390.png`); the figure assumes income lands by the latest likely date (`src/engine/forecast.ts:295-296`). The only "not financial advice" text is `why.notAdvice`, rendered once at the foot of the Why drawer (`src/components/forecast/WhyDrawer.tsx:145`) and below the fold at 390px (`docs/review/screens/thabo-why-drawer-dark-390.png`). It is absent from Home, Plan, What helps most and every message. Where the CPA applies, a supplier must not use "exaggeration, innuendo or ambiguity" about a material fact (CPA s41(1)(b)) and notices must be understandable by an ordinary consumer with average literacy (s22(2)). A disclaimer also cannot turn advice into non-advice; the FAIS test looks at the substance of the recommendation (FAIS s1(1) and s1(3)(a); FIA commentary). **Unclear law:** whether the CPA covers a free app, or a service supplied by a bank that is regulated under financial sector laws, needs an attorney's view; treat CPA standards as the floor either way.
- **Recommendation:** Rename to estimates: "Spend up to about R295 today" with sub-line "Based on past spending. Assumes your money lands by Tue 27 Oct." Rename "Safe to lend up to" to "You could lend up to" with "and stay at Tight. A heavy week would still run short." When Short, hide the spend figure or show "To last until your next money, keep to about R310 a day" in the Short colour. Put a short persistent line under the Home hero, the Plan cards and the Help card: "An estimate from your past patterns. Not financial advice." Keep the drawer text too.
- **Effort:** S

### LEGAL-03: Daily messages are opt-out by default and lack POPIA s69 elements
- **Severity:** High (for any real send), Low (for the demo)
- **Evidence:** The messages toggle starts on (`src/pages/Consent.tsx:27`, `docs/review/screens/thabo-consent-light-768.png`). POPIA defines consent as "any voluntary, specific and informed expression of will" (s1); a pre-set toggle bundled behind "Agree and continue" is weak evidence of that. Templates have no sender contact or opt-out route inside the message (`src/i18n/locales/en.json:664-684`, `src/messages/templates.ts:21-35`); "Turn off any time in Privacy" sits only in the app. The tips "A good week to put a little aside" are service guidance today, but the moment a bank partner adds a product nudge ("open a savings pocket") the message becomes direct marketing by electronic communication, which needs opt-in consent or the customer exception, plus sender identity and a cease address in every message (POPIA s69(1), (3), (4)). The Information Regulator's December 2024 Guidance Note on direct marketing says opting out is not consent. Meta requires opt-in that names the business before business-initiated WhatsApp messages, using approved templates. WASPA's Code has a "Reply STOP" requirement for SMS marketing.
- **Recommendation:** Default messages to off and ask on the Inbox with a separate, named opt-in: "Send me a daily Tengo update on WhatsApp at 07:00. I can reply STOP at any time." Record channel, phone, wording version and timestamp in the consent log. Add "Reply STOP to end. Tengo, [contact]" to every SMS and WhatsApp template (SMS budget: the current SMS fits in one segment, so check the 160 character limit in `templates.test.ts`). Keep service messages free of any product promotion; if a partner wants promotional content, collect a separate marketing consent.
- **Effort:** S

### LEGAL-04: No responsible party, terms of use or complaints route for a real launch
- **Severity:** Medium
- **Evidence:** The Information Officer is a placeholder (`src/i18n/locales/en.json:239-244`); there is no operator name, address, terms of use or complaints process anywhere in the locale file (grep for "terms" returns nothing). POPIA s18(1) requires the name and address of the responsible party, the purpose, whether supply is voluntary, cross-border plans and the right to complain. ECTA s43(1) requires suppliers transacting electronically to show full name, legal status, physical address, contact details and privacy policy on the site. **Unclear law:** ECTA s43 is framed around goods or services offered by electronic transaction; a free app may fall outside, but a paid tier or a bank-embedded service likely does not.
- **Recommendation:** Before any pilot, publish: operator legal name, registration number and address; terms of use (estimate only, no guarantee, no liability for decisions taken, how to complain); a POPIA privacy notice; and the Information Officer registered with the Information Regulator. If embedded in a bank, use the bank's existing notices and complaints process instead.
- **Effort:** M

### LEGAL-05: Regulatory perimeter not documented; FAIS position depends on product links
- **Severity:** Medium
- **Evidence:** FAIS "advice" means a recommendation, guidance or proposal of a financial nature "in respect of" the purchase of, investment in, transactions on, or variation or termination of a financial product (FAIS s1(1)). Financial products include insurance policies and deposits as defined in the Banks Act (FAIS s1(1), paragraph (f) of "financial product"). Daily spend figures and "spend less" suggestions do not name a product, so the **likely interpretation** is that they are not advice. The **alternative interpretation** is that guidance on drawing down a bank deposit, or on setting money aside ("You could set aside up to R280", `src/i18n/locales/en.json:702`), is guidance in respect of a deposit; FAIS s1(4) limits FAIS for short-term bank deposits to what the code of conduct regulates, which reduces but does not remove this risk. Once a bank links Tengo's "set aside" to a named savings product, it is automated advice and falls under the bank's FAIS licence and the FSCA's fit and proper rules for automated advice (key individual who understands the algorithm, ongoing monitoring; Profile summary of FSCA requirements). The COFI Bill was introduced to the National Assembly on 17 April 2026 (Clyde & Co); I could not source its final advice definitions, so treat activity-based conduct regulation and "fair customer outcomes" as the direction of travel, not settled law.
- **Recommendation:** Write a one-page perimeter memo, reviewed by an attorney, covering FAIS, NCA, CPA and POPIA, with a rule: Tengo never names, compares or links to a financial product unless operated inside a licensed FSP. Keep "set aside" generic. If a bank pilots it, the bank's compliance function should classify it as either factual information (FAIS s1(3)(a)) or automated advice, and test it against the bank's Conduct Standard obligations (FSCA Conduct Standard 3 of 2020 requires banks to prioritise fair treatment of financial customers).
- **Effort:** S (memo), L (bank onboarding)

### LEGAL-06: "Bring in R380 more" can steer people towards expensive or informal credit
- **Severity:** Medium
- **Evidence:** `help.extra`: "Bring in {{amount}} more before {{date}}." (`src/i18n/locales/en.json:699`; `src/components/forecast/HelpCard.tsx:45`). For a Short user the fastest way to "bring in" money is often a loan. Tengo would not be giving credit advice in the regulated sense (there is no NCA licence category for general money tips, and debt counselling is the specific section 86 process run by a registered natural person), but the wording invites borrowing without a warning.
- **Recommendation:** Reword to "Earn or receive R380 more before Sun 25 Oct, for example an extra shift or money owed to you. Borrowing to cover a gap usually costs more later." Add a link to the NCR's consumer information and, for Short users, a neutral line pointing to free help such as the NCR's debt counselling information, without recommending any provider.
- **Effort:** S

### LEGAL-07: Cross-border transfer and sensitive inference in WhatsApp messages
- **Severity:** Medium
- **Evidence:** WhatsApp is operated by Meta outside South Africa. A message saying "Your money may run out on Fri 23 Oct ... Cover: Short" (`src/i18n/locales/en.json:668-669`) discloses financial distress to a foreign processor and to anyone who sees a shared or locked phone. POPIA s72(1) permits transfer abroad only with adequate protection, consent, contractual necessity or similar grounds. The Privacy centre's cross-border card is simulated.
- **Recommendation:** Name WhatsApp and Meta in the message opt-in and the privacy notice as a cross-border recipient, rely on explicit consent under s72(1)(b), offer SMS as the alternative, and offer a "discreet" template that omits the state word ("Tengo: your update is ready. Open the app.").
- **Effort:** S

### LEGAL-08: State label contradicts itself on Home
- **Severity:** Low
- **Evidence:** Thabo's hero reads "Enough until Tue 27 Oct" next to a "Tight" chip, and the 30 day chart header shows "Enough" (`docs/review/screens/thabo-home-light-768.png`; `src/i18n/locales/en.json:346`). "Enough" is used both as a state and as a date label. Under CPA s22(2) an ordinary consumer should understand the notice "without undue effort"; mixed signals about whether one is covered are a misrepresentation risk under s41(1)(b).
- **Recommendation:** Use "Lasts until Tue 27 Oct" for the hero in all non-Short states, and reserve "Enough" for the state chip only.
- **Effort:** S

### LEGAL-09: Future bank use could trigger POPIA s71 and purpose creep
- **Severity:** Low (today), Medium (in a bank)
- **Evidence:** POPIA s71 bars decisions with legal consequences based solely on automated profiling of, among other things, creditworthiness and reliability. Tengo's states are not used for any decision today, and the notice says "Not for marketing or credit scoring" (`src/i18n/locales/en.json:144`). A bank partner may want to reuse Enough, Tight and Short for limits, overdraft offers or collections timing.
- **Recommendation:** Put the purpose limit into any partner contract: Tengo outputs may not be used for credit decisions, pricing, collections or marketing without a fresh, separate consent and a s71 assessment. Keep the "Question this result" route and make it reach a human in production.
- **Effort:** S

## Top three risks

1. **Harm from late payment suggestions.** A user follows "Pay Car instalment after Tue 27 Oct" and falls into arrears, fees or repossession steps, or lets a funeral or car insurance policy lapse. This is the most likely route to a real complaint, a reputational incident for a bank partner, and an argument that Tengo gave FAIS advice on an insurance product (LEGAL-01).
2. **"Safe" read as a guarantee.** A Tight or Short user spends or lends the "safe" amount, income arrives late, and the user blames the app. The hidden disclaimer will not help, and CPA s41 standards on ambiguity apply where the CPA applies (LEGAL-02, LEGAL-08).
3. **Messaging consent failure at scale.** Default-on daily messages without in-message opt-out, and any later product nudges, breach POPIA s69 and Meta's opt-in rules, risking Information Regulator enforcement and WhatsApp account suspension (LEGAL-03, LEGAL-07).

## Score

5/10: honest demo labels and a sensible privacy posture, but the engine can recommend paying credit and insurance late, "safe" wording overpromises, and the messaging consent design would not survive a real launch.

## Sources

All accessed 2026-10-20.

- Financial Advisory and Intermediary Services Act 37 of 2002, as amended by Act 22 of 2008, s1(1) "advice", "financial product", s1(3)(a), s1(4): https://www.fscamymoney.co.za/Legislation%20Strategy%20and%20Policy/FINANCIAL%20ADVISORY%20AND%20INTERMEDIARY%20SERVICES%20ACT%2037%20OF%2020.pdf
- Official FAIS Act record: https://www.gov.za/documents/financial-advisory-and-intermediary-services-act
- FIA, "When does conduct constitute financial advice?": https://fia.org.za/2019/07/08/when-does-conduct-constitute-financial-advice/
- Moonstone, court on FAIS "advice" limited to financial products: https://www.moonstone.co.za/court-rules-on-fais-act-exception-argument-in-dispute-over-commission/
- Profile, FSCA fit and proper requirements on automated (robo) advice: https://www.fundsdata.co.za/ebook/2025-2U/files/basic-html/page35.html
- Clyde & Co, FSCA Regulation Plan 2026 to 2029 and COFI Bill introduction: https://www.clydeco.com/en/insights/2026/07/the-fsca-has-published-its-three-year-regulation-p
- Acts Online, COFI Bill status update 2025: https://acts.co.za/news/blog/2025/09/cofi-bill-status-update-2025
- FSCA Conduct Standard 3 of 2020 (Banks): https://lawlibrary.org.za/akn/za/act/standard/fsca/2020/3/eng@2020-07-03
- National Credit Regulations, reg 10, debt counsellor registration: https://source.acts.co.za/national-credit-act-2005/r489_10__further_criteria_for_registration_as_a_debt_counsellor.php
- University of the Free State, Journal for Juridical Science, debt counselling under s86: https://journals.ufs.ac.za/index.php/jjs/article/download/2943/2854/5612
- NCA s4(2)(b) family loans and arm's length (SchoemanLaw): https://lionessesofafrica.com/blog/2024/03/09/arms-length-under-the-national-credit-act
- cars.co.za, missed car finance payments and s129: https://www.cars.co.za/motoring-news/what-happens-when-you-miss-a-car-finance-payment-in-south-africa/355033/
- Moonstone, s129 notices: https://www.moonstone.co.za/high-court-credit-providers-must-get-section-129-notices-right/
- Consumer Protection Act s22: https://www.acts.co.za/consumer-protection/22_right_to_information_in_plain_and_understandable_language
- Consumer Protection Act s41: https://www.acts.co.za/consumer-protection/41_false_misleading_or_deceptive_representations
- POPIA s1 definitions: https://popia.co.za/section-1-definitions/
- POPIA s18: https://popia.co.za/section-18-notification-to-data-subject-when-collecting-personal-information/
- POPIA s69: https://popia.co.za/section-69-direct-marketing-by-means-of-unsolicited-electronic-communications/
- POPIA s71: https://popia.co.za/section-71-automated-decision-making/
- POPIA s72: https://popia.co.za/section-72-transfers-of-personal-information-outside-republic/
- Information Regulator, Guidance Note on direct marketing: https://inforegulator.org.za/?p=7427
- Cliffe Dekker Hofmeyr on the Guidance Note: https://www.cliffedekkerhofmeyr.com/en/news/publications/2025/Sectors/Technology-Communications/Technology-and-Communications-Alert-29-january-Navigating-the-Information-Regulators-guidance-note-on-direct-marketing
- ECTA s43: https://www.acts.co.za/electronic-communications-and-transactions-act-2002/43__information_to_be_provided
- Meta, Get opt-in for WhatsApp: https://developers.facebook.com/documentation/business-messaging/whatsapp/getting-opt-in
- WASPA Code of Conduct 17.10: https://waspa.org.za/wp-content/uploads/2025/01/WASPA-Code-of-Conduct-17.10-clean.pdf
- BulkSMS, South Africa SMS regulations (STOP reply): https://bulksms.com/resources/regulations/south-africa-sms-regulations.htm

## Findings table

| id | severity | title | evidence | recommendation | effort |
| --- | --- | --- | --- | --- | --- |
| LEGAL-01 | High | What helps most tells users to pay credit instalments and insurance premiums late | src/engine/help.ts:62 sorts by amount only; Thabo told to pay Car instalment after due date (thabo-home-light-768.png, persona-snapshot.json); FAIS s1(1)(d); NCA s129 | Never suggest moving credit or insurance payments; classify bills; reword as ask-first; add unit test | M |
| LEGAL-02 | High | Safe is an unqualified promise and the disclaimer is hidden | en.json:359,523; Ayanda Short shows Safe R310; why.notAdvice only at WhyDrawer.tsx:145 below the fold; CPA s22(2), s41(1)(b) | Rename to estimate wording; qualify Safe to lend at Tight; persistent not-advice line on Home, Plan, Help card | S |
| LEGAL-03 | High | Daily messages default on and lack POPIA s69 elements | Consent.tsx:27 useState(true); templates.ts and en.json:664-684 have no STOP or sender contact; POPIA s1 consent, s69; Meta opt-in; WASPA | Default off; separate named opt-in; Reply STOP and sender details in every message; log consent version | S |
| LEGAL-04 | Medium | No responsible party, terms of use or complaints route | Placeholder Information Officer en.json:239-244; no terms keys; POPIA s18(1); ECTA s43(1) | Publish operator identity, terms, privacy notice, registered Information Officer, complaints process, or use bank's | M |
| LEGAL-05 | Medium | Regulatory perimeter not documented; FAIS position depends on product links | FAIS s1(1) advice and financial product incl. deposits; s1(3)(a); s1(4); set aside copy en.json:702; COFI introduced 17 Apr 2026 | Attorney-reviewed perimeter memo; never name products outside a licensed FSP; bank to classify as factual info or automated advice | S |
| LEGAL-06 | Medium | Bring in more can steer people to costly or informal credit | en.json:699; HelpCard.tsx:45 | Reword to earn or receive with a borrowing caution; neutral link to NCR consumer help | S |
| LEGAL-07 | Medium | Cross-border transfer and sensitive inference in WhatsApp messages | Short state text en.json:668-669 via Meta; POPIA s72(1) | Name Meta in opt-in and notice; rely on explicit consent; SMS alternative; discreet template | S |
| LEGAL-08 | Low | State label contradicts itself on Home | Enough until next to Tight chip (thabo-home-light-768.png; en.json:346); CPA s22(2), s41(1)(b) | Use Lasts until in the hero; reserve Enough for the chip | S |
| LEGAL-09 | Low | Future bank use could trigger POPIA s71 and purpose creep | Not for marketing or credit scoring en.json:144; POPIA s71 | Contractual purpose limit for partners; s71 assessment before any decision use; human review route | S |
