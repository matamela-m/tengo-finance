# Judge Q&A and demo script

Prepared 2026-10-20 from the 13 reviewer files. Answers are what the founder can honestly say today, based on what exists: a working demo with synthetic data, no users, no bank data, no backend. Finding ids point to the evidence in `findings.csv`. Where an answer depends on a fix from `ROADMAP.md`, it says so.

## Twenty likely questions

**1. How many real irregular earners have used this?**
None yet. It is a demo built on three fictional composites. Our next step is a six-person comprehension test with drivers, hairdressers and spaza owners (BEH user-testing plan; INV-01).

**2. How accurate is the date?**
On real data, unknown. On synthetic data the forecast date is off by 2.1 days on average with 90 days of history, against 3.4 days for a naive baseline, and the actual date falls inside our range 72 percent of the time. The test data comes from the same assumptions as the engine, so this is a consistency check, not proof (DATA-01, `backtest/results/summary_headline.csv`).

**3. Banks already show money left after debit orders. What is new?**
Those tools assume a payday. Tengo infers when the next money usually lands from irregular deposits, shows a range rather than a single figure, and turns it into Enough, Tight or Short in plain words. The arithmetic is simple; the design for people without a payday is the contribution (INV-02, PROD-02, COMM-01).

**4. Why would a bank not just build it?**
It could. We pitch Tengo as a tested, explainable layer a bank can switch on for irregular earners quickly, licensed per active user, with the rules, copy and explanations already worked out. The moat is evidence and design for this segment, not code (COMM-01).

**5. Where does the data come from?**
Today, a CSV statement read in the browser. In a pilot, the host bank's own transaction data. We do not rely on open finance, which South Africa has not adopted at scale (PROD-06, INV-04).

**6. Who pays?**
A bank, per active user, with a pilot fee and an annual minimum. Users in this segment should not pay. Our base model needs about 81 000 active users at R5 a month to break even, so one bank alone is not enough at base adoption; a second bank or a sponsor programme closes the gap (COMM-02, `model.xlsx` Scenarios).

**7. Ayanda is Short but told R310 is safe to spend, and the chart says Enough. Which is it?**
If fixed (roadmap item 2): "We fixed that. One rule now drives the screen: when Short, the daily budget is marked not advised, and the chart is labelled as what happens if money lands as usual." If not fixed: "That is a real inconsistency. The three figures answer different questions, and we are merging them so the screen says one thing" (UX-01, UX-02, RISK-04, INV-03).

**8. Is "safe to spend" or "safe to lend" financial advice?**
We present factual estimates, not recommendations, and the reviewers' view is that most of this is likely outside the FAIS meaning of advice. The wording "safe" is too strong, so we are renaming it to describe consequences, and the disclaimer moves next to the figures. Inside a bank it would go through the bank's compliance review. This is not a legal opinion (LEGAL-02, LEGAL-05).

**9. Could it tell someone to do something harmful?**
In the demo, "What helps most" could suggest paying a car instalment later. We are removing bill-move suggestions for credit, insurance and rent, and never suggesting borrowing or cutting business stock (LEGAL-01, RISK-09, roadmap item 7).

**10. Your users run on cash and stokvels. How does a bank statement see that?**
It does not, today. Cash in hand and quick manual entries are the next feature; until then the screen should say it covers this account only (BEH-02, COMM-04, INV-10).

**11. What happens if someone's income stops?**
In the demo the engine still expects it, which is wrong. The fix treats overdue income as late and lowers confidence, so a stopped income cannot show Enough (RISK-01, RISK-03, roadmap item 8).

**12. You claim 11 languages. Can I see isiZulu?**
Not yet. All 11 are wired in, but only English is written. Google's translation API does not support Tshivenda, so that language needs a human translator. Once roadmap item 1 is done, the landing page says "built for 11, English today"; until then, say it out loud before a judge finds it (L10N-01, L10N-02, INV-05).

**13. Where is the data stored and who can see it?**
In this demo, only in the browser on the device. Nothing is sent anywhere. A real service would need an authenticated backend, encryption and a data protection impact assessment before any real data is used (SEC-04).

**14. Do your privacy controls meet POPIA?**
No claim is made. They are labelled "Simulated privacy controls. Not a compliance certification." Some screens describe rules the demo does not enforce, such as 12 month retention; we are rewording those as demo statements (SEC-01, SEC-02).

**15. Does it work offline during loadshedding?**
Yes from the second visit, because the app caches itself after it loads. A first visit followed by going offline shows a blank page today; precaching at install fixes that (A11Y-02, roadmap item 9).

**16. Is it accessible?**
Automated WCAG 2.2 checks find almost nothing across 15 pages in both themes, it reflows at 320 pixels and respects reduced motion. Manual review found real gaps: focus can hide behind the tab bar on phones and the page language was set wrongly for untranslated languages (A11Y-01, A11Y-04).

**17. How much does it cost to run per user?**
About R1.19 a month per active user inside a bank app in the base case, mostly support; paid daily WhatsApp messages would cost more than the licence leaves, so we use in-app notifications (`model.xlsx` Model sheet; COMM-03).

**18. What does a bank get out of it?**
Unproven. Our base assumptions give about R30 of value per active user a year against a R60 licence, driven by retention and balances, which are assumptions. A pilot with a control group would measure unpaid debit orders, balances and retention (`model.xlsx` Sensitivity; COMM-05).

**19. What would make you stop?**
If users read the date as a deadline and make worse decisions, if real-data accuracy is far below the stated range, or if no bank or funder will host it (investor deal breakers).

**20. What does the name mean?**
"Mutengo" is understood by the founder to mean value in Tshivenda. One reviewer notes it may mean price; we are confirming with first-language speakers before telling the story (L10N-12).

## Three-minute demo script

Assumes roadmap items 1 to 8 are done. Timing in brackets.

1. **Hook (0:00 to 0:20).** "A balance tells you what you have. Tengo tells you until when." One sentence on who it is for: people paid by the trip, the client or the till, not on the 25th.
2. **Home for Thabo (0:20 to 0:55).** Open Home as Thabo, Tight. Point to the date, the likely range and the next money. "He is covered on a normal week, not on a heavy one." Open "Why this date" and show the inputs in plain words.
3. **The hard case, Ayanda (0:55 to 1:30).** Switch to Ayanda, Short. Show that the screen says one consistent thing: Short from a date, two days before her next money, the daily budget marked not advised, and "What helps most" offering a spending change, not a late bill.
4. **Plan and the family loan (1:30 to 2:00).** Open Plan, enter that her cousin asks for R300. Show the days of cover lost and the state change. "Lending is normal here; Tengo shows the cost before she says yes."
5. **Trust (2:00 to 2:30).** Privacy centre: consent per purpose, see and delete my data, "simulated" label visible. One line on offline after first load and data cost. Name the honest limits: synthetic data, English today, bank account only.
6. **Evidence and model (2:30 to 3:00).** One slide: backtest MAE 2.1 days, 72 percent in range, on synthetic data with the caveat. Business: bank licence per active user with a pilot fee; next step a six-person test and a bank pilot with a control group.

**Handling weak spots if they come up.** If items are not fixed in time, do not demo Ayanda's Home (use Thabo only), avoid the language selector, and say plainly that the safe figures are being renamed. Never claim real users, real accuracy or compliance.
