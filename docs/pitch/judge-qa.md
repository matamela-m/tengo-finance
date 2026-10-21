# Judge Q&A (build 2)

Prepared 2026-10-21. Replaces `docs/review/judge-qa.md`. Answers say only what is true of build 2. Finding ids point to `docs/review/findings.csv`; numbers to `docs/review/after/COMPARISON.md` and `docs/review/model.xlsx`.

**1. How many real people have used this?**
None yet. Anyone can now try it with their own money or pretend numbers, on their own phone, without signing up. The next step is a six-person comprehension test; a draft kit is in `docs/research/`.

**2. How accurate is the date?**
On real data, unknown. On our synthetic backtest, counting small income, the date is off by 3.2 days on average against 5.9 for a simple baseline. Counting outflows only, the simple baseline wins, 3.3 against 4.6. When money runs out within six days, the stated range held about half the time on the balances both builds share. The range was tuned on the same synthetic data, so these numbers show consistency, not real-world accuracy (`docs/review/after/data-scientist.md`).

**3. What happens when someone's income stops?**
After two usual gaps with nothing coming in, Tengo says Income looks paused, stops counting on next money, judges cover over the next 30 days, lowers confidence and offers nothing to lend. The review's case of income stopped 35 days ago used to show Enough; it now shows Short with a paused notice. Before two gaps have passed, late pay can still show Enough, and stopped daily takings are not yet detected. Both are open (RISK-A1, RISK-A2).

**4. And with no income, or very little history?**
It says Not enough to tell. No date, no budget, no next money, and it says what to add.

**5. Ayanda is Short. What does she see now?**
"Short from" with the gap to her next money, Daily budget Not advised with her usual spend, and a chart labelled "If money lands as usual". One rule drives the whole screen, tested on every persona across 60 days.

**6. Is "daily budget" or "room to lend" financial advice?**
They are estimates from the person's own history, labelled as not advice beside the figure. Room to lend keeps money back for the next bill and says Tengo cannot tell whether a loan comes back. Neither is capped yet: following the budget every day or lending the full amount can drop a person a level, which the review found and we have not fixed. Inside a bank, the bank's compliance team classifies it. This is not a legal opinion.

**7. Could it tell someone to do something harmful?**
What helps most is built not to. It offers only three kinds of idea: earn or receive more (with a borrowing caution), trim spending the person marked flexible, or move a bill they marked movable. Bills named as credit, insurance, rent, school fees or funeral cover are not offered as moves, and stock and fuel are not cut; unit tests check this. It rests on English bill names, and a stokvel can still be marked movable. The budget and Room to lend still need caps.

**8. Your users live on cash and stokvels. Does Tengo see that?**
Partly. Cash in, cash out and cash on hand in one tap; bank, cash and wallet balances summed; stokvel, burial society, family support and informal loans as recurring items that count like bills. Daily earners get their own rhythm. An ATM withdrawal is not yet linked to cash, so cash can be counted twice, and summing balances can hide an overdrawn bank account.

**9. People without a bank statement?**
Answer a few questions (how money arrives, usual amounts, regular bills). Tengo builds an estimated history, labelled as such and kept at low confidence until real entries replace it. The estimate can still show Enough from answers alone; capping it is open (RISK-A5).

**10. Can I see isiZulu?**
Not yet. Built for 11 languages, English today. Each language shows its status; Tshivenda needs a human translator because machine translation does not support it, and nothing is marked reviewed until a first-language speaker checks it.

**11. Where is the data and who can see it?**
As a guest, on the phone only, and nothing is sent. The optional account is a demo path, not for real data yet: it stores data in Supabase with row-level security on every table, tested with two users on a local test database that does not copy every Supabase default, and the forecast still runs on the phone. Only the public key is in the app.

**12. Do you comply with POPIA?**
No claim is made. There is a draft privacy notice and terms for a lawyer to review, a server consent log with notice versions, export and real deletion with a receipt. The responsible party and Information Officer still have to be named.

**13. What about a shared phone?**
A PIN lock (stored only as a salted hash), discreet mode that hides amounts until tapped, and a quick exit to a plain page. A written safety policy covers adults only and coercion. The lock hides the screen; it does not encrypt the data. Back after quick exit can still return to the app, and none of it has been tested with people.

**14. Does it work offline during loadshedding?**
In guest mode, yes, straight after the first visit, with no reload. A test goes offline on a cold profile. Signed-in accounts do not yet work offline.

**15. Is it accessible?**
Zero automated WCAG 2.1 AA violations across every screen in both themes at phone and desktop width, page language set correctly, focus clear of the sticky bars, and negative amounts spoken in words. A manual review still found issues, such as focus lost between onboarding steps and faint selected states. No TalkBack or disabled-user testing yet.

**16. Who pays?**
A bank, per active user: R5 a month in the base model, with a R400 000 pilot fee and a R1.2 million annual minimum. Users never pay. In-app notifications instead of paid WhatsApp keep cost per user low.

**17. Does it make money?**
Not with one bank at base adoption: the base model needs about 81 000 active users against about 44 000 at one bank. The pilot fee, the minimum and a second bank or sponsor close the gap. The bank's value (about R30 per user a year against R60 of licence) is an assumption the pilot measures with a control group.

**18. Why would a bank not build this itself?**
It could. Tengo offers rules tested on synthetic cases, careful copy, shared-phone design and, after a pilot, evidence for this segment, faster than an internal build. It is a partner capability, not a moat.

**19. What would make you stop?**
If people read the date as a deadline and make worse decisions, if real-data accuracy is far below the stated range, or if no bank or funder will host it.

**20. What does the name mean?**
We do not tell the name story until two first-language Tshivenda speakers confirm it. It is switched off in the app.
