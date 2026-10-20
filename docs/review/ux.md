# UI/UX designer

## Verdict

Tengo is visually one of the more finished hackathon builds I would expect to see: a calm, consistent card system, a date that genuinely leads the Home screen, state shown by colour, word, icon and bar count together, careful reduced-motion handling and good empty and error states. The weakness is not polish but coherence of the numbers. On a single Home screen a user can meet three different dates (cover date, next money, "safe to spend until") and two verdicts that disagree (the hero says Short, the chart says Enough), and a Short user is told R310 is "safe to spend today" while Plan says R0 is safe to lend. The headline label also says "Enough until" when the state is Tight, which is the first thing a judge sees on the landing page. These are design and copy problems that undercut the one promise the product makes, and they are cheap to fix. In the light theme Tight and Short use almost the same colour. Fix the number story on Home and Plan before adding anything else.

## What works

- **Date-first hierarchy is real.** The cover date is the largest element on Home at every width (56px phone, 72 to 88px desktop, `src/components/forecast/DateHero.tsx:22`), with state chip and plain sentence directly beneath. Evidence: `docs/review/screens/ux/ayanda-home-fold-light-390.png`, `thabo-home-light-1280.png`.
- **State is never colour alone.** `StateChip` renders icon plus word plus colour (`src/components/StateChip.tsx:13`), and `CoverBars` adds a 3, 2, 1 bar count. The 30 day chart caption explains line, shading and dot types in words, and "Show numbers" gives a table alternative (`src/components/forecast/TimelineScrubber.tsx:214`).
- **Motion is restrained and respects reduced motion.** Global override at `src/styles/index.css:123`, count-up skips under reduced motion (`src/lib/useCountUp.ts:8`), scroll reveal never hides above-the-fold content (`src/components/Reveal.tsx:15`).
- **Empty and error states are designed, not default.** Forecast paused has a clear cause and two actions (`docs/review/screens/ux/paused-dark-390.png`); a bad CSV shows a specific fix (`docs/review/screens/ux/thabo-import-badfile-light-1280.png`); a negative what-if amount gets inline help with an example (`docs/review/screens/ux/ayanda-plan-negative-light-1280.png`); render crashes have a branded fallback (`src/components/ErrorBoundary.tsx:22`); Home with no transactions routes to import (`src/pages/Home.tsx:97`).
- **Honest demo labelling is consistent.** "Demo | Fictional Data" chip on every app screen, simulated banners on Inbox, Privacy and Consent, a placeholder warning on the Information Officer card. Evidence: `thabo-inbox-dark-1280.png`, `ayanda-privacy-dark-1280.png`.
- **Dark and light parity in layout is complete.** Every page has identical structure across themes; tokens are defined once per theme (`src/styles/index.css:13` to `48`) and 116 of 116 contrast pairs pass (`docs/review/prep/checks.md`, `npm run contrast`). axe passes on all audited pages (`docs/review/prep/playwright.txt`, 221 passed).
- **Desktop layout earns its width.** At 1280 Home becomes a two-column dashboard with hero and chart left, stats, help and activity right (`src/pages/Home.tsx:116`); Plan puts What-if and Loan check side by side. The sidebar, persona switcher and Ctrl K menu are well placed.
- **The Why drawer explains the date in plain words** with the inputs listed (balance, usual daily spend, bills) and a route to question the result (`ayanda-why-drawer-light-390.png`).
- **Microcopy is mostly short and human**: "Covered on a normal week, not on a heavy one.", "Runs out 2 days before your next money.", "Test a change before you make it. Nothing is saved." (`src/i18n/locales/en.json` `stateCard`).

## What to improve

**UX-01. Short state sits next to "R310 safe to spend today" and "R0 safe to lend"**
- **Severity:** High
- **Evidence:** Ayanda Home: hero "Short from Fri 23 Oct", "Runs out 2 days before your next money", then card "SAFE TO SPEND TODAY R310. Until Mon 26 Oct. No bills due." (`docs/review/screens/ux/ayanda-home-fold-light-390.png`). Her usual daily spend is R623 (`ayanda-why-drawer-light-390.png`), and What helps most says "Spend about R250 less a day", which implies about R373, not R310. On Plan the same person sees "SAFE TO LEND UP TO R0. You are already short" (`ayanda-plan-light-390.png`). The figures come from different rules (`docs/review/prep/fact-sheet.md`, "Safe to spend today") and the screen does not reconcile them. A Short user can read R310 as permission.
- **Recommendation:** When state is Short, relabel the card ("Daily limit to reach your next money" or "To get through to Sun 25 Oct, keep to R310 a day"), show it beside usual spend ("You usually spend R623"), and use the same base in What helps most. Make Plan's lend wording consistent with that figure.
- **Effort:** S

**UX-02. The chart says Enough on the same screen where the hero says Short or Tight**
- **Severity:** High
- **Evidence:** Ayanda hero "Short" while the Next 30 days readout shows a green "Enough" for Today (`ayanda-home-light-390.png`, `ayanda-home-dark-1280.png`); Thabo hero "Tight", chart "Enough" (`thabo-home-dark-768.png`). The readout uses `day.state` from a projection that includes expected income (`src/components/forecast/TimelineScrubber.tsx:110`). The qualifier "If money lands as usual" is 12px subtle text in the card corner (`TimelineScrubber.tsx:95`).
- **Recommendation:** Do not show a state word on the chart readout for today. Show balance only, or label it "If your money lands as usual: Enough" in the readout itself. Better, show both paths on the chart (with and without the next income) so the hero's logic is visible.
- **Effort:** S

**UX-03. Headline label says "Enough until" when the state is Tight**
- **Severity:** High
- **Evidence:** `src/components/forecast/DateHero.tsx:9` uses `hero.enoughUntil` for every non-Short state. Thabo reads "Enough until Tue 27 Oct" beside an amber "Tight" chip (`thabo-home-light-1280.png`), and this is the product mock on the landing page hero (`landing-light-1280.png`, `landing-dark-390.png`). Plan repeats it in the Now and After cards (`thabo-plan-dark-1280.png`). The Inbox message already words it better: "should last until Tue 27 Oct on a normal week. Cover: Tight." (`thabo-inbox-dark-1280.png`).
- **Recommendation:** Use a state-specific label: Enough "Covered until", Tight "Lasts until (on a normal week)", Short "Short from". Keep the Inbox phrasing as the model.
- **Effort:** S

**UX-04. Three different dates for "next money" on one screen**
- **Severity:** Medium
- **Evidence:** Ayanda: hero "Short from Fri 23 Oct", band "Next money around Sun 25 Oct", safe to spend "Until Mon 26 Oct" (`ux/ayanda-home-fold-light-390.png`). Lerato: next money Sat 24 Oct, safe to spend "Until Sun 25 Oct" (`lerato-home-dark-390.png`). Cause: Stats uses `nextMoney.latest` for the safe-to-spend date and `nextMoney.typical` for the Next money figure (`src/pages/Home.tsx:56`, `74`).
- **Recommendation:** Pick one date the user sees (typical) and explain the buffer in words ("We plan to Mon 26 Oct in case your money is a day late"), or show next money as a range everywhere.
- **Effort:** S

**UX-05. Tight and Short are nearly the same colour in the light theme**
- **Severity:** Medium
- **Evidence:** Light tokens `--tight: 155 71 8` and `--short: 169 57 10` (`src/styles/index.css:47`, `48`): contrast ratio between them 1.01 (computed with the WCAG luminance formula), both read as rust brown. Compare picker chips (`picker-light-390.png`) and Me (`lerato-me-light-390.png`). In dark they are clearly amber versus coral. Icon, word and bar count still differ, so this is not a WCAG failure, but the colour signal for the most important distinction is lost in light.
- **Recommendation:** Move light Tight towards a true amber or ochre (for example a darker yellow-brown with higher luminance on the soft fill) and keep Short as a red. Re-run the contrast script for text on soft fills.
- **Effort:** S

**UX-06. Plan opens with a pre-filled R500 what-if and a R300 loan**
- **Severity:** Medium
- **Evidence:** `src/pages/Plan.tsx:59` (`amount: '500'`) and `:187` (`useState('300')`). The page loads already showing "2 days less" and "Short from Sun 25 Oct" for Thabo (`thabo-plan-dark-1280.png`) before he has done anything. For Ayanda the What-if says "1 day less" on arrival (`ayanda-plan-light-390.png`). A first-time user may think something has happened to their money. On Thabo's Loan check "Use R320" is styled as selected while the field holds 300.
- **Recommendation:** Start empty with a neutral result ("Add an amount to see your date move"), and keep the quick chips. If a demo needs a filled state, use the placeholder or a "Try R500" chip.
- **Effort:** S

**UX-07. The range band has no visible legend for its main marker, and the headline date can sit at the edge of "likely"**
- **Severity:** Medium
- **Evidence:** `src/components/forecast/RangeBand.tsx:29` to `48` draws band, a state-coloured dot (the headline date) and an accent pin (next money); only the pin has a legend line (`:49`). The whole graphic is `aria-hidden`. Lerato's date 1 Nov sits on the far right edge of "Likely between Mon 26 Oct and Sun 01 Nov" (`lerato-home-dark-390.png`), so "likely" and the headline look inconsistent to a lay reader.
- **Recommendation:** Label the dot ("Your date") and the band ("Likely range") directly on the track, and explain in the Why drawer why the headline can sit at one end of the range.
- **Effort:** S

**UX-08. The 30 day chart scale is driven by the optimistic band, so the balance line hugs zero**
- **Severity:** Medium
- **Evidence:** `TimelineScrubber.tsx:59`, `60`: y-axis max is the highest optimistic value. Ayanda's axis runs R30k to minus R10k while her balance is about R1.3k, so the expected line is squashed into the bottom fifth of the plot and the shading dips well below R0 (`ayanda-home-light-390.png`). Below-zero shading on a "money lasts" chart looks like debt.
- **Recommendation:** Scale to the central line plus a capped band (for example 80th percentile), clip shading at R0 or tint it differently, and mark the cover date on the chart so it ties back to the hero.
- **Effort:** M

**UX-09. Daily messages is switched on by default at consent**
- **Severity:** Medium
- **Evidence:** `src/pages/Consent.tsx:27` `useState(true)`; the toggle shows "On" before the user chooses (`thabo-consent-dark-390.png`). Analytics is off by default, so the pattern is inconsistent, and a pre-ticked optional choice reads as a nudge.
- **Recommendation:** Default Daily messages to off and offer it as a positive choice after the first Home view ("Want this date each morning on WhatsApp?").
- **Effort:** S

**UX-10. Import step 2 is dense and its summary tiles are ambiguous**
- **Severity:** Low
- **Evidence:** After "Use sample statement" the phone shows six column dropdowns, a preview table without an amount column, then tiles "DAYS 45, INCOME 14, SPEND 37, BILL 2" (`thabo-import-sample-light-390.png`). "INCOME 14" reads as R14, not 14 transactions. The column mapping is shown even when every guess is right.
- **Recommendation:** Collapse the mapping behind "Columns look wrong?" when detection succeeds, add the amount column to the preview, and relabel tiles ("14 money-in rows").
- **Effort:** S

**UX-11. Microcopy and format inconsistencies**
- **Severity:** Low
- **Evidence:** "Pay Car instalment (R3 450) after Tue 27 Oct instead of before." capitalises the bill mid-sentence (`thabo-home-light-1280.png`, `en.json:697` inserts the raw description). "To reach Tight" frames Tight as a goal (`ayanda-home-dark-1280.png`, `en.json:704`). Lerato sees "safe to spend R330" and "You could set aside up to R280 today" on the same screen (`lerato-home-dark-390.png`). Dates show "Sun 01 Nov" and "Sept" from the en-ZA locale, while the native date input shows "2026/10/21" (`thabo-plan-dark-1280.png`).
- **Recommendation:** Lower-case bill names in sentences, reword the help goal ("To avoid running short" or "To be covered on a heavy week"), explain the R330 versus R280 difference or show one figure, and format days without a leading zero.
- **Effort:** S

**UX-12. Phone first fold and tablet layout**
- **Severity:** Low
- **Evidence:** At 390x844 the hero fills the fold and the safe-to-spend card is cut by the bottom bar, with Next money and Confidence hidden (`ux/ayanda-home-fold-light-390.png`). At 768 the layout is the phone stack stretched wide, with a greeting banner taking prime space above the hero (`thabo-home-dark-768.png`). Privacy is only an unlabelled shield icon in the top bar on phones (`src/layouts/nav.ts`, any `*-390.png`).
- **Recommendation:** Tighten hero padding on phones so the safe-to-spend figure is visible without scrolling; fold the greeting into a single line on tablet; use the two-column layout from 768; give the shield a visible label or put Privacy under Me.
- **Effort:** M

**UX-13. Persona lists truncate key context and show a fixed starting state**
- **Severity:** Low
- **Evidence:** Me truncates "E-hailing driver, Tsh..." and "Spaza shop owner, ..." (`lerato-me-light-390.png`). Picker and Me chips show the designed `startState`, not the current one (`src/pages/Picker.tsx`, `docs/review/prep/walkthrough.md` item 6).
- **Recommendation:** Allow two lines for the role, and compute the chip from the current forecast or drop it.
- **Effort:** S

## Nielsen heuristic evaluation

Scale: 1 (serious problems) to 5 (excellent).

| # | Heuristic | Score | Evidence |
| --- | --- | --- | --- |
| 1 | Visibility of system status | 4 | Demo chip on every screen, "Last changed" on consent, Plan result badges ("2 days less", "No change"), import row counts and skipped-row warning (`thabo-import-sample-light-390.png`). Count-up and re-keyed date animate on change (`DateHero.tsx:19`). |
| 2 | Match with the real world | 3 | Plain language ("next money", "a heavy week") fits the personas. Undercut by "Enough until" for Tight (UX-03), "To reach Tight" (UX-11) and "Income 14" counts (UX-10). |
| 3 | User control and freedom | 4 | Remove what-if rows, Not now on consent, Resume forecast, Cancel on import, reset demo data, persona switch everywhere. Pre-filled Plan values add changes the user did not ask for (UX-06). |
| 4 | Consistency and standards | 2 | Same card system and chips across pages, but the numbers are inconsistent: three next-money dates (UX-04), chart state versus hero state (UX-02), R310 versus R0 versus R373 (UX-01), R330 versus R280 (UX-11), Tight and Short colours in light (UX-05). |
| 5 | Error prevention | 3 | Import refuses under 14 days and asks for column mapping; delete needs a checkbox. Consent pre-enables messages (UX-09); a Short user is shown a spendable figure without a caveat (UX-01). |
| 6 | Recognition rather than recall | 4 | Labelled bottom nav and sidebar, chart caption explains marks, Why drawer lists inputs. Range band marker unlabelled (UX-07); Privacy is an unlabelled icon on phones (UX-12). |
| 7 | Flexibility and efficiency | 4 | Ctrl or Cmd K menu, quick amount chips, filters and search on Money, chart scrubbing plus table view. |
| 8 | Aesthetic and minimalist design | 4 | Clean hierarchy and generous spacing. Import step 2 and the five-card consent screen are long on phones (`thabo-consent-dark-390.png`). |
| 9 | Help users recognise, diagnose and recover from errors | 4 | Specific inline messages with examples (`ux/ayanda-plan-negative-light-1280.png`, `ux/thabo-import-badfile-light-1280.png`), paused state with actions, crash fallback. |
| 10 | Help and documentation | 4 | Why this date drawer, "How the forecast works" in Me, "What the file needs" on import. No help for what Tight means beyond one sentence, and nothing explains why safe to spend differs from usual spend. |

Average 3.6 of 5. The low point is consistency of the numbers, which is the heuristic that matters most for a money app.

## Cognitive walkthrough: first two minutes

**Thabo (e-hailing driver, Tight).**
- 0 to 20 s: Landing shows "Money you can plan around" and a mock with his own figures. He must understand that the date is when money runs out. Risk: the mock says "Enough until Tue 27 Oct" next to "Tight" (UX-03); he may read Enough as the verdict.
- 20 to 50 s: Picker, then a consent page several screens tall on a phone (`thabo-consent-dark-390.png`). He must understand he can agree. Risk: Daily messages already on (UX-09); he may scroll past without reading.
- 50 to 90 s: Home. He sees Tue 27 Oct, Tight, "Covered on a normal week, not on a heavy one." This works. Next he sees R295 safe to spend "Until Tue 27 Oct" but Next money Mon 26 Oct (UX-04), then a chart saying Enough (UX-02). He must work out which one to believe.
- 90 to 120 s: What helps most says "Pay Car instalment after Tue 27 Oct". He may not know if this is allowed, and the bill shows as due Sun 25 Oct on Money (`thabo-money-light-1280.png`). Tapping Try it in Plan lands on a page already showing "2 days less" and Short (UX-06); he may think his position just got worse.

**Lerato (hairdresser, Enough).**
- 0 to 40 s: Picker shows her as Enough with three green bars; consent as above.
- 40 to 90 s: Home shows Enough until Sun 01 Nov, green chip, "Covered until your next money, even on a heavy week." Clear and reassuring. Risk: next money is Sat 24 Oct, so she may wonder why the date is 1 Nov and why the dot sits at the very end of "Likely between Mon 26 Oct and Sun 01 Nov" (UX-07).
- 90 to 120 s: R330 safe to spend "Until Sun 25 Oct", then "You could set aside up to R280 today" (UX-11). She must decide if she can spend R330 and save R280, or only one of them. Nothing on the screen answers that.

**Ayanda (spaza owner, Short).**
- 0 to 40 s: Picker shows Short with one bar. Consent as above.
- 40 to 70 s: Home shows Short from Fri 23 Oct and "Runs out 2 days before your next money." This is the clearest moment in the product: the warning is unmissable.
- 70 to 100 s: Directly below: "SAFE TO SPEND TODAY R310. No bills due." (UX-01). She must understand this is a ceiling to stretch money to Mon 26 Oct, not a free amount, while she usually spends R623. Likely misreading: "I am short, but I can still spend R310 today."
- 100 to 120 s: Scrolling, the chart shows a green "Enough" for today (UX-02) with an axis up to R30k (UX-08). She may conclude the warning was a false alarm. If she opens Plan, the loan card says R0 is safe to lend and the what-if already shows "1 day less" from a R500 she did not enter (UX-06).

## Top three risks

1. **False reassurance for the Short user.** R310 safe to spend plus a green Enough on the chart can override the Short headline for exactly the person who most needs the warning (UX-01, UX-02).
2. **Loss of trust from contradictory numbers.** Three next-money dates and two state verdicts on one screen make the forecast look unreliable to judges and users even where the engine is correct (UX-03, UX-04).
3. **First impression on the landing page.** The hero mock shows "Enough until" beside "Tight", so the core concept is muddled in the first five seconds of the demo (UX-03).

## Score

6 out of 10: polished, accessible and consistent visual design, held back by Home and Plan figures that contradict each other in ways a stressed user could act on.

## Sources

None.

## Findings table

| id | severity | title | evidence | recommendation | effort |
| --- | --- | --- | --- | --- | --- |
| UX-01 | High | Short state sits next to R310 safe to spend and R0 safe to lend | docs/review/screens/ux/ayanda-home-fold-light-390.png; ayanda-plan-light-390.png; ayanda-why-drawer-light-390.png (R623 a day) | Relabel safe to spend as a daily limit when Short, show usual spend beside it, align What helps and Loan check wording | S |
| UX-02 | High | Chart readout says Enough while hero says Short or Tight | src/components/forecast/TimelineScrubber.tsx:110; ayanda-home-dark-1280.png; thabo-home-dark-768.png | Drop the state word from today's readout or label it as the if-income-lands case; show both paths | S |
| UX-03 | High | Headline label says Enough until when state is Tight | src/components/forecast/DateHero.tsx:9; thabo-home-light-1280.png; landing-light-1280.png | Use state-specific labels such as Lasts until (on a normal week) for Tight | S |
| UX-04 | Medium | Three different next-money dates on one screen | src/pages/Home.tsx:56 and 74; docs/review/screens/ux/ayanda-home-fold-light-390.png | Show one next-money date and explain the planning buffer in words | S |
| UX-05 | Medium | Tight and Short nearly identical colour in light theme | src/styles/index.css:47-48 (contrast between them 1.01); picker-light-390.png | Shift light Tight to a distinct amber and re-run contrast checks | S |
| UX-06 | Medium | Plan opens with pre-filled R500 what-if and R300 loan | src/pages/Plan.tsx:59 and 187; thabo-plan-dark-1280.png | Start empty with a neutral prompt; keep quick-amount chips | S |
| UX-07 | Medium | Range band marker unlabelled and headline at edge of likely range | src/components/forecast/RangeBand.tsx:29-48; lerato-home-dark-390.png | Label Your date and Likely range on the track; explain in Why drawer | S |
| UX-08 | Medium | Chart scale driven by optimistic band, line hugs zero, shading below R0 | src/components/forecast/TimelineScrubber.tsx:59-60; ayanda-home-light-390.png | Scale to central line and capped band, clip at R0, mark the cover date | M |
| UX-09 | Medium | Daily messages on by default at consent | src/pages/Consent.tsx:27; thabo-consent-dark-390.png | Default to off and offer opt-in after first Home view | S |
| UX-10 | Low | Import step 2 dense and summary tiles ambiguous | thabo-import-sample-light-390.png | Collapse mapping when detection succeeds, add amount to preview, relabel tiles as row counts | S |
| UX-11 | Low | Microcopy and date format inconsistencies | src/i18n/locales/en.json:697 and 704; lerato-home-dark-390.png; thabo-plan-dark-1280.png | Lower-case bill names, reword To reach Tight, reconcile R330 and R280, drop leading zero on days | S |
| UX-12 | Low | Phone first fold cuts safe to spend; tablet uses stretched phone stack; Privacy is an unlabelled icon | docs/review/screens/ux/ayanda-home-fold-light-390.png; thabo-home-dark-768.png; src/layouts/nav.ts | Tighten hero on phones, two columns from 768, label Privacy | M |
| UX-13 | Low | Persona lists truncate role and show fixed start state | lerato-me-light-390.png; src/pages/Picker.tsx | Allow two-line roles and compute chip from current forecast | S |
