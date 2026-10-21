# UI/UX designer: second pass on build 2

## 1. Verdict

The Home rule works. A Short user no longer sees a spendable figure, the chart no longer says Enough, and there is one next money date. The new surfaces are clean and honest but add length and small new contradictions: two "today" balances on Home, an unlabelled quick exit icon on phones, and a very long Money page.

## 2. Score

7 out of 10 now, 6 out of 10 before. The Home and Plan number story is fixed; new density and loose ends hold it back.

## 3. Earlier findings

| id | claimed | verdict | evidence |
| --- | --- | --- | --- |
| UX-01 | Fixed | agree | home-ayanda-light-390.png: "Not advised" with R623 usual spend; plan-ayanda-light-390.png: Room to lend R0 explained. |
| UX-02 | Fixed | agree | home-ayanda-light-390.png and home-thabo-dark-768.png: readout says "If money lands as usual" and "Above R0", no state word. |
| UX-03 | Fixed | partly | "Tight until Tue 27 Oct" beside next money Mon 26 Oct can read as "tight, then fine after Tuesday" (home-thabo-light-1280.png, landing-light-390.png). |
| UX-04 | Fixed | agree | home-ayanda-light-390.png: one next money date (Mon 26 Oct); budget line has no date. |
| UX-05 | Fixed | agree | picker-light-390.png: amber Tight and red Short are clearly different. |
| UX-06 | Fixed | partly | Loan field starts empty. The what-if is labelled as an example but still loads a change: Ayanda lands on "1 day less" and Short from Fri 23 Oct (plan-ayanda-light-390.png). |
| UX-07 | Fixed | agree | Legend for Your date, Likely range, Next money; Lerato's date now sits inside the range (home-lerato-dark-390.png). |
| UX-08 | Fixed | partly | Axis is tighter, but Ayanda's chart still runs to minus R10k with deep shading below R0 for a R1 193 balance (home-ayanda-light-390.png). |
| UX-09 | Fixed | agree | welcome-2-light-390.png: Daily messages Off by default. |
| UX-10 | Not fixing | agree | Fair reason for a Low item. |
| UX-11 | Partly fixed | partly | No leading zeros. Lerato still sees R310 daily budget and "set aside up to R330" on one screen (home-lerato-dark-390.png); two figures remain. |
| UX-12 | Not fixing | disagree | At 390 the bottom bar still cuts the Daily budget card (home-ayanda-light-390.png). The Privacy shield is still an unlabelled icon, and now sits beside a second unlabelled icon (UX-A2). |
| UX-13 | Partly fixed | agree | Picker says "Starts at" (picker-light-390.png). Me still shows the start state chip without that label (me-light-390.png). |

## 4. New findings in build 2

**UX-A1. Two different "today" balances on Home**
- Severity: Medium
- Evidence: home-thabo-light-1280.png shows "Total R4 957" in the budget card and "Today R4 724" in the chart. Same on home-lerato-dark-390.png and own-home-light-390.png. The chart shows projected end of day (src/components/forecast/TimelineScrubber.tsx:131) with no label.
- Recommendation: Label the chart point "End of today" or start the chart at the current total.

**UX-A2. Quick exit is an unlabelled icon on phones**
- Severity: Medium
- Evidence: Every 390 screen shows a door icon next to the shield with no text (home-ayanda-light-390.png, account-light-390.png). At 1280 it reads "Quick exit". The exit page also links straight back (src/pages/Exit.tsx:13).
- Recommendation: Show the word "Exit" on phones, move Privacy into Me, and make the exit page's way back less obvious or require the PIN.

**UX-A3. Notices stack above the date with no limit**
- Severity: Medium
- Evidence: src/pages/Home.tsx:174 renders all notices before the hero; src/engine/view.ts:139 to 149 allows six kinds at once. The sample notice already pushes the date down (own-home-light-390.png). Three notices would push it out of the first fold.
- Recommendation: Show at most one notice above the hero (the most severe), collapse the rest into "Things to check (3)" below it.

**UX-A4. Money page is very long on phones**
- Severity: Low
- Evidence: money-light-390.png is about 5 100px tall. The 166 transactions dominate the good new cash and obligations cards.
- Recommendation: Default the list to 7 days, or move transactions to their own tab.

**UX-A5. Onboarding friction and mixed signals**
- Severity: Low
- Evidence: The language selector repeats above the progress bar on every step (welcome-1 to welcome-4, light-390). Step 3 has no Back. Sample numbers produce a full Enough with three bars and "Low confidence" on the same hero (own-home-light-390.png); no name gives "Good morning, You.". The landing still says "3 cover states" though a fourth exists (landing-light-390.png).
- Recommendation: Show language on step 1 only, add Back on every step, drop the greeting name when empty, mute the gauge when confidence is Low, fix the landing count.

## 5. What still blocks a real pilot

- No comprehension sessions yet. "Tight until", "Not advised" and the range band are untested with real users.
- Quick exit and PIN have not been tested with people on shared phones; the phone control is not discoverable (UX-A2).
- The first fold on a 390 phone still hides the budget, and notices can push the date down (UX-12, UX-A3).
- The fourth status and the paused and missed bill notices are not in the screenshots, so their layout is unreviewed.
- Only English is usable.
