# Persona walkthrough notes

Walked on 2026-10-20 against the production build (`npx vite preview`, port 4180) for Thabo, Lerato and Ayanda: landing, picker, consent, Home, Plan, Money, import with the sample CSV, Inbox, Privacy, Me. Screens are in `docs/review/screens/` named `<persona>-<page>-<theme>-<width>.png`. These are observations for the panel to weigh, not conclusions.

## Flow and friction points

1. **Three steps before any value.** Landing, then the picker, then a consent screen with five notice cards and three switches, then Home. On a 390px phone the consent screen is several screens tall before "Agree and continue". Evidence: `thabo-consent-dark-390.png`.
2. **Short but "safe to spend R310".** Ayanda is shown as Short from 23 Oct, two days before her next money, yet the stats card says R310 is safe to spend today, while her usual daily spend is R623. The two figures come from different rules (runway versus balance spread to the latest next money) and are not reconciled on screen. Evidence: `persona-snapshot.json` (ayanda), `ayanda-home-dark-1280.png`.
3. **Headline and chart can disagree.** For Ayanda the hero says Short, while the 30 day chart's readout for today says Enough, because the chart assumes income lands as usual and the headline does not. It is labelled "If money lands as usual" in small text. Evidence: `ayanda-home-light-390.png`.
4. **Pre-filled what-if.** Plan opens with a R500 expense already entered, so the result panel shows a change ("days less") before the user has done anything. Evidence: `thabo-plan-dark-1280.png`.
5. **Languages show English.** Choosing any of the 10 other languages keeps English text everywhere, with a small note. A judge choosing isiZulu sees no change. Evidence: `src/i18n/status.json` (all "pending"), picker screenshots.
6. **Starting state on the picker is fixed.** Persona cards always show the designed starting state (Tight, Enough, Short) even after an import or edit changes it. Evidence: `src/pages/Picker.tsx` uses `p.startState`.
7. **Edited seed data freezes.** Once a seed transaction is corrected, the record stops refreshing daily, so on later days the history no longer ends yesterday and the 60 day spend window drifts. Evidence: `src/data/localRepository.ts` `getRecord` (only `source === 'seed'` refreshes).
8. **Privacy is one tap further on phones.** The bottom bar has Home, Plan, Money, Inbox and Me; Privacy is the shield icon in the top bar. Evidence: `src/layouts/nav.ts`, any `*-390.png`.
9. **Sample import changes the person.** "Use sample statement" replaces the active persona's history with a different, fictional domestic worker's statement, so Thabo becomes someone else with Thabo's name. Evidence: `src/lib/sampleStatement.ts`, `thabo-import-sample-*.png`.
10. **What helps most can suggest moving a car instalment.** For Thabo, the bill-move idea names the car instalment, which in real life may carry penalties. Evidence: `persona-snapshot.json` (thabo help.billToMove).
11. **Human review goes nowhere.** "Question this result" stores a request locally and confirms "Request received" with a reference. It is labelled simulated, but a user could believe a person will reply. Evidence: `src/pages/privacy/Review.tsx`, `thabo-privacy-review-*.png`.
12. **Things that worked smoothly.** Persona switch from the sidebar, Ctrl K menu, theme switching with no flash, CSV sample import with skipped-row count, export of JSON and CSV, delete with receipt, offline reload (Playwright flow test).
