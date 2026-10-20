# What Tengo does today (fact sheet)

Prepared from the code at commit d114497 on 2026-10-20. Every line here is checked against the source, the check outputs in this folder, or the persona snapshot. It describes what exists, not what the pitch says.

## Form

- A single page web app: React 18, TypeScript (strict), Vite, Tailwind, React Router 6, i18next, Zustand. No backend. Source: `package.json`, `src/App.tsx`.
- All data lives in the browser's localStorage under two keys: `tengo.session.v1` (language, theme, active persona, sidebar) and `tengo.data.v1` (records, consent, audit log, review requests, deletion receipts). Source: `src/store/session.ts:31`, `src/data/localRepository.ts:15`.
- Data access goes through a `TengoRepository` interface with one implementation, `LocalRepository`, which adds a 140 ms artificial delay. Source: `src/data/repository.ts`, `src/data/index.ts`.
- Installable as a PWA with a same-origin service worker for offline use. Source: `public/sw.js`, `src/main.tsx`.
- 6 747 lines of application TypeScript and 642 lines of unit tests. Source: `wc -l` over `src`.

## Data

- No real data. Three fictional personas (Thabo, e-hailing driver, Tshwane; Lerato, hairdresser, Mamelodi; Ayanda, spaza owner, Tembisa) with 90 days of deterministic synthetic transactions ending yesterday. Each persona's balance is chosen by the engine so it starts in Tight, Enough and Short respectively. Source: `src/data/seed/generate.ts`, `src/data/seed/personas.ts`.
- Seed data regenerates every day unless the user imports or edits. Source: `src/data/localRepository.ts` `getRecord`.
- A user can replace a persona's history with a CSV bank statement, parsed in the browser (PapaParse). It detects columns, skips bad rows, requires 14 days, warns under 28, and shifts statements that ended more than 3 days ago so they end yesterday. PDF import is shown as "coming next" and does not exist. Source: `src/lib/csv.ts`, `src/pages/Import.tsx`.
- No bank connection, no open banking, no login, no accounts.

## Forecast engine (`src/engine/`)

- Splits history into income, recurring bills (same description, amounts within 20 percent, 24 to 36 days apart, at least 2 times) and everyday spend. Source: `classify.ts:16`.
- Daily spend: median, 80th and 20th percentile of rolling 7 day spend over the last 60 days, divided by 7. Low confidence (under 28 days) widens the spread by 1.5. Source: `forecast.ts:20,26`.
- Next money: deposits of at least 10 percent of typical monthly income. Weekday pattern when 60 percent land on one weekday (latest date is one day after typical), otherwise gaps between deposits (20th, 50th, 80th percentile). No pattern means a 30 day plan. Source: `forecast.ts:24,28`.
- Runway: balance run down daily at each rate minus bills, ignoring future income. The date is the day the normal path reaches zero. Horizon 180 days. Source: `forecast.ts:18`.
- State: Enough if the heavy path reaches the latest next money; Tight if the normal path reaches the typical next money; otherwise Short.
- Safe to spend today: (balance minus bills before the latest next money) divided by days to it, floored at zero, rounded down to R5.
- Also: a 30 day timeline that does include expected income, a what-if, a loan check with "safe to lend", "What helps most" (extra money, daily cut or bill to move), and a keyword-based spending breakdown. Source: `forecast.ts`, `help.ts`, `spending.ts`.

## Persona snapshot on 2026-10-20 (from `persona-snapshot.json`)

| Persona | State | Date shown | Range | Safe to spend | Next money | Usual daily spend |
| --- | --- | --- | --- | --- | --- | --- |
| Thabo | Tight | 27 Oct | 25 to 28 Oct | R295 | 26 Oct (weekday) | R295 |
| Lerato | Enough | 1 Nov | 26 Oct to 1 Nov | R330 | 24 Oct (weekday) | R120 |
| Ayanda | Short | 23 Oct | 22 to 25 Oct | R310 | 25 Oct (interval) | R623 |

## Screens

Landing, persona picker, consent, Home (date hero, range band, state, stats, 30 day chart, What helps most, recent activity, Why this date drawer), Plan (what-if, loan check), Money (history, filters, search, corrections, recurring bills, spending breakdown), Import, Inbox (simulated WhatsApp or SMS preview in 11 languages), Privacy centre (consent toggles, data minimisation, see and export data, audit log, human review request, sample breach notice, retention, cross-border card, placeholder Information Officer, delete with receipt), Me (persona, language, theme, about, reset). Command menu on Ctrl or Cmd plus K. Source: `src/App.tsx`, `src/pages/`.

## Languages

11 locale files with identical keys (577 keys). All 10 non-English files currently contain English text. A Google Cloud Translation script exists but has not been run (no API key). Source: `npm run i18n:check`, `src/i18n/status.json`, `scripts/translate.mjs`.

## What is simulated, not real

Bank data, messaging (nothing is sent), privacy controls (labelled "Simulated privacy controls. Not a compliance certification."), the Information Officer contact (placeholder), the human review (stored locally, nobody receives it), translations, the logo and icons (placeholders), encryption claims (described for a real deployment only).

## Quality signals (see `checks.md`, `audit.md`, `playwright.txt`, `coverage.txt`, `lighthouse/`)

- Build, 66 unit tests, lint, i18n check, fonts check and 116 contrast pairs all pass.
- Playwright: screenshot, flow, phone and axe accessibility suites (see `playwright.txt` for the count and result).
- Unit coverage: 97.6 percent of statements in `src/engine`, 20.0 percent across all of `src` (UI is covered by Playwright only).
- npm audit: 12 issues in all dependencies (2 critical, 5 high, 5 moderate), 2 moderate in production dependencies (react-router).
- Bundle: one 696 KB JavaScript file (142 KB gzip) that includes all 11 locale files (337 KB of JSON).
- Lighthouse mobile (simulated slow 4G, 4x CPU): landing 94 performance, 100 accessibility, 100 best practices, 91 SEO; picker 96, 100, 100, 91.
