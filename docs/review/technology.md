# Head of technology / solution architect

## Verdict

As a hackathon build, Tengo is well made. It has a pure, deterministic forecast engine with 97.6 percent statement coverage, clean layering, strict TypeScript, good scores on throttled mobile, and a small, permissively licensed set of dependencies. As the base for a real product it is a well-built client-only prototype, and the README's claim that it can be swapped to a backend without touching UI code is optimistic. The most serious technical defect is about correctness, not scale. Once a user imports or edits data, the record stops ageing. The engine then treats every elapsed day as zero spend against an unchanged balance, so the state drifts towards Enough while confidence stays "high". My benchmark shows Ayanda moving from Short to Enough after 30 days with no new data. The other gaps are expected in a demo but must close before a pilot. There is no observability at all. The repository contract is coarse and cannot be scoped to real users. localStorage writes are unguarded. The service worker caching is naive. The code is never split into smaller chunks.

## What works

- **The engine is pure, deterministic and well tested.** `src/engine/forecast.ts` and `classify.ts` are side-effect-free functions with named constants (`forecast.ts:18-28`, `classify.ts:16-22`). Statement coverage is 97.55 percent for `src/engine` and 98.59 percent for `forecast.ts` (`docs/review/prep/coverage.txt`). There are 66 unit tests across 9 files and all pass (`docs/review/prep/checks.md`).
- **Date arithmetic is safe across time zones.** Calendar days are converted to UTC day numbers (`src/engine/dates.ts:6-9`), so a device in a different time zone cannot shift the forecast date.
- **The engine is fast enough at realistic volumes.** `forecast()` runs in 0.36 ms on 285 transactions, 0.83 to 1.02 ms on about 2 000, and 2.23 ms on 10 080 (laptop, `docs/review/tools/technology/engine-bench.out.txt`, script `engine-bench.ts`).
- **Layering is clean at the edges.** Zustand holds only UI preferences (`src/store/session.ts:18`). All persona data goes through one `TengoRepository` interface (`src/data/repository.ts:75`), and a single line chooses the implementation (`src/data/index.ts:5`).
- **It performs well on throttled mobile.** Lighthouse mobile (slow 4G at 150 ms RTT, 4x CPU) gives landing 94 and picker 96 for performance, with TBT of 160 ms and 10 ms, LCP of 2.4 s and 2.3 s, CLS 0, and 218 KiB total (`docs/review/prep/lighthouse/*.report.json`). Home under the same throttling shows the hero in 1 516 ms cold and 627 ms warm, transferring 149 KB (`docs/review/prep/perf-home.json`).
- **Privacy is tested in code.** A Playwright test asserts no third-party requests (`tests/flows.spec.ts:117`), and the service worker ignores other origins (`public/sw.js:24`).
- **Dependencies are few and permissively licensed.** There are 10 production dependencies, licensed MIT (18), OFL-1.1 (2), ISC (1) and Apache-2.0 (1), with no copyleft (`docs/review/prep/audit.md`).
- **There is a quality toolchain.** Lint, a dash checker, i18n key parity, font coverage and 116 contrast pairs are all scripted and pass (`docs/review/prep/checks.md`). A pre-paint script stops the theme from flashing (`index.html:11-22`).

## What to improve

### TECH-01 Imported or edited data never ages, so the forecast drifts towards Enough
- **Severity:** High
- **Evidence:** `src/data/localRepository.ts:87` refreshes only `source === 'seed'`, so imported and edited records stay fixed. `src/engine/forecast.ts:36-41` measures history up to `today`, not up to the last transaction, and `forecast.ts:66` counts days with no transactions as zero spend. The balance is never reduced for days that have passed. Running the real engine on the seeded records viewed later with no new data (`docs/review/tools/technology/engine-bench.out.txt`): Thabo moves from Tight on 27 Oct to Enough on 13 Nov after 7 days. Ayanda moves from Short to Tight after 7 days and to Enough after 30, with central spend falling from R623 to R79 a day. Confidence stays "high" throughout. The import page's rebase (`src/lib/csv.ts:160-162`) fixes this only at the moment of import. The walkthrough (item 7) noted the freeze but not that it inflates the state.
- **Recommendation:** Store an `asOf` date with the balance. Run the engine with `today = asOf + 1`, or subtract the estimated spend for the elapsed days, and measure the spend window up to the last transaction. Show "Your data is N days old". Lower the confidence after 3 days and hide the state after about 14 days until the user refreshes. Add a unit test for staleness.
- **Effort:** S

### TECH-02 No observability: errors, performance and forecast quality are invisible
- **Severity:** High
- **Evidence:** The only error handling is `console.error` (`src/components/ErrorBoundary.tsx:17`). A search for Sentry, `onerror` or `unhandledrejection` finds nothing. There is one boundary, at the root (`src/App.tsx:22`), so any render error replaces the whole app, which contradicts its own comment "one broken screen never blanks the whole app" (`ErrorBoundary.tsx:8`). Promise failures in writes are not caught at all: `src/pages/Import.tsx:55-60` has no try/catch, and `void` calls in `src/data/PersonaProvider.tsx:80` drop their errors. Nothing measures web vitals, and nothing records forecast outcomes against what actually happened, so accuracy can never be tracked in production.
- **Recommendation:** Add error reporting with personal data scrubbed (no amounts, descriptions or names), route-level error boundaries, a global `unhandledrejection` handler, web-vitals sampling, and a privacy-safe forecast accuracy event (predicted state and date against the observed outcome, bucketed). Define SLOs before a pilot.
- **Effort:** M

### TECH-03 The repository contract is not ready for a real backend
- **Severity:** High
- **Evidence:** Keys are a closed union of three personas (`src/data/seed/personas.ts:3`), with no user, tenant or auth context in any method (`src/data/repository.ts:75-95`). Every read and write parses and rewrites one JSON blob holding all personas (`src/data/localRepository.ts:57-69`). `getRecord` returns the full history and `replaceHistory` sends it all back: about 183 KB of JSON for 2 000 transactions (`engine-bench.out.txt`). There is no paging, no incremental sync and no version or ETag for concurrent edits. Each write makes 2 or 3 sequential calls: `setConsent` then `appendAudit` then `getAudit` (`PersonaProvider.tsx:112-117`). The "audit log" is written by the client, can be edited by the user and is cut to 200 entries (`localRepository.ts:16,146`). Pages also bypass the provider and call the repository directly (`src/pages/Me.tsx:26,32`, `src/pages/Picker.tsx:35,40`, `src/components/CommandPalette.tsx:92`).
- **Recommendation:** Redesign the contract for a hosted service: user-scoped methods that take an auth context, paged and incremental transaction sync (cursor or `since`), optimistic concurrency, write endpoints that return the audit entry they created, and a server-side append-only audit trail with no client delete. Move the engine into a shared package so the server can produce authoritative forecasts and alerts while the client keeps offline what-ifs.
- **Effort:** L

### TECH-04 localStorage writes are unguarded and the storage is fragile
- **Severity:** Medium
- **Evidence:** `write()` calls `setItem` with no try/catch (`src/data/localRepository.ts:67-69`). A `QuotaExceededError` therefore rejects `replaceHistory`. `Import.tsx:57-58` then leaves `saving` set to true and never navigates. MDN gives a limit of 5 MiB per origin and says Safari deletes script-written data after seven days without interaction (source below). 10 080 transactions take 897 KB of JSON, which is about 1.8 MB in browsers that store UTF-16 (`engine-bench.out.txt`). There is no `storage` event listener, so two open tabs overwrite each other's blob (last writer wins). Corrupt data is silently replaced with an empty store (`localRepository.ts:61-64`), which loses consent and audit records without telling the user.
- **Recommendation:** Wrap writes and show a clear error. Move records to IndexedDB, request `navigator.storage.persist()`, listen for `storage` events or use a BroadcastChannel, and keep a backup copy before overwriting corrupt data. Before any pilot, add server sync so clearing the browser does not lose a user's history.
- **Effort:** M

### TECH-05 The service worker caching strategy is naive
- **Severity:** Medium
- **Evidence:** The worker is registered on `load` (`src/main.tsx:16-19`), so the first visit's JS and CSS are fetched before it controls the page. Offline works only after a second load, and the test reloads before going offline (`tests/flows.spec.ts:131-140`). Every same-origin GET that is not a navigation is cache-first under a fixed name `tengo-v2` (`public/sw.js:4,40-52`). As a result `manifest.webmanifest` and the icons never refresh, and old hashed bundles pile up forever because the cache name never changes with the build. Navigations write any response, including a 404 or 5xx, over the cached `/` (`sw.js:27-35`). `vercel.json` sends every unmatched path to `index.html`, so a missing old asset comes back as HTML with status 200 and gets cached under a `.js` URL.
- **Recommendation:** Generate a precache manifest from the build (Workbox or vite-plugin-pwa) and precache it at install. Version the cache by build hash and clean up old entries. Cache only `res.ok` responses with the expected content type. Use stale-while-revalidate for files without a hash. Exclude `/assets/*` from the SPA rewrite.
- **Effort:** S

### TECH-06 One 696 KB bundle with every locale loaded at start
- **Severity:** Medium
- **Evidence:** There is a single `index-*.js` of 695 602 bytes raw, 141 864 gzip (`docs/review/prep/audit.md`), and Vite warns that a chunk is over 500 kB (`checks.md`). Locales are imported eagerly (`src/i18n/index.ts:5`), as are all pages (`src/App.tsx:8-18`) and the seed generator. Lighthouse estimates 41 to 47 KiB of unused JS. Today the 11 locale files cost little because 10 are copies of English: 12.8 KB gzip together. Compressed one at a time they total 104 KB gzip (measured with `gzip -c` per file on `src/i18n/locales`). **Assumption:** real translations compress about like separate files, so translating adds roughly 80 to 100 KB gzip to the first load, about 60 to 70 percent more JS on 2G or 3G for users who pay for data.
- **Recommendation:** Load English plus the chosen language on demand and let the service worker prefetch the rest when idle, so switching language offline still works. Lazy-load routes (Plan, Money, Import, Privacy, Inbox). Keep the seed generator out of the main chunk. Set a bundle budget in CI.
- **Effort:** S

### TECH-07 Test strategy leaves the UI, data layer and failure paths unproven
- **Severity:** Medium
- **Evidence:** Statement coverage is 19.95 percent for all of `src`, with 0 percent for every component and page, and 0 percent for `PersonaProvider.tsx` (`coverage.txt`). 136 of the 221 Playwright tests are screenshot runs whose only assertion is no horizontal overflow, with no visual baseline (`tests/screens.spec.ts:96-98`). Playwright uses Chromium only (`playwright.config.ts:13`), so iOS Safari, where storage eviction applies, is untested. There is no CI configuration (no `.github` folder). Nothing tests quota errors, stale data (TECH-01), multiple tabs, time zones or service worker updates. `localRepository.test.ts` has 5 tests.
- **Recommendation:** Add CI running build, unit tests, lint, audit and Playwright on every push. Add a WebKit project and a low-end Android emulation profile. Use `toHaveScreenshot` baselines for the key screens. Add component tests for `PersonaProvider` and Import. Add engine property tests (balance monotonicity, state ordering, staleness).
- **Effort:** M

### TECH-08 Known advisories in shipped and build dependencies
- **Severity:** Medium
- **Evidence:** `react-router-dom` 6.30 is affected by GHSA-wrjc-x8rr-h8h6, an open redirect through `<Link>` and `useNavigate` (moderate, patched in 7.18.0), and by GHSA-337j-9hxr-rhxg, which concerns SSR hydration (`audit.md`). The app passes only internal constant paths or an encoded receipt id to `navigate` (`src/pages/privacy/Delete.tsx:21`, `CommandPalette.tsx:82`), so practical exposure is low, and Tengo has no SSR. The dev toolchain has 2 critical advisories (tinypool, through vitest 3) and 5 high (braces, through tailwind 3 and chokidar), all dev-only but a risk on build machines.
- **Recommendation:** Upgrade to react-router 7.18 or later in library mode, and to vitest 5 and tailwind 4 (or pin fixed transitive versions with npm `overrides`). Add `npm audit --omit=dev` as a CI gate and use Renovate or Dependabot.
- **Effort:** M

### TECH-09 Engine runs on the main thread and is repeated many times per render
- **Severity:** Low
- **Evidence:** `helpPlan` runs `forecast` inside a binary search over R10 steps up to R200 000 (`src/engine/help.ts:6,29-39`), then again for each candidate bill. It is called on every Home render where the record changes (`src/components/forecast/HelpCard.tsx:17`). Measured on a laptop: 4.2 ms at 285 transactions, 10 to 12 ms at about 2 000, 40 ms at 10 080 (`engine-bench.out.txt`). `loanCheck` and `whatIf` run again on every keystroke (`src/pages/Plan.tsx:65-73,190`). **Assumption:** a low-end Android is 4 to 10 times slower than the laptop, giving 40 to 120 ms at 2 000 transactions and 160 to 400 ms at 10 000. That is noticeable input lag on Home and Plan.
- **Recommendation:** Debounce the Plan inputs. Cache the base forecast by record version. Solve `extraNeeded` in closed form from the runway (it is linear in balance) instead of searching. Move heavy work to a Web Worker if histories grow.
- **Effort:** S

### TECH-10 The fake 140 ms latency ships to production and is applied unevenly
- **Severity:** Low
- **Evidence:** `new LocalRepository(window.localStorage, 140)` in production (`src/data/index.ts:5`). It adds 140 ms to every cold Home load (`perf-home.json`, hero at 1 516 ms). It applies to `getRecord`, `getConsent`, `getAudit` and `deletePersona`, but not to `setConsent`, `appendAudit`, `getReviewRequests` or `getDeletionReceipts` (`localRepository.ts:129-163,182`). The loading states therefore do not model a real network.
- **Recommendation:** Make the latency a development-only flag, and test loading and error states with Playwright route delays and failures instead.
- **Effort:** S

### TECH-11 "Today" is fixed when the app opens
- **Severity:** Low
- **Evidence:** `const [today] = useState(() => localToday())` (`src/data/PersonaProvider.tsx:36`). An installed PWA left open overnight keeps showing yesterday's forecast and does not trigger the daily seed refresh.
- **Recommendation:** Recompute `today` on `visibilitychange` and at local midnight, and reload when it changes.
- **Effort:** S

### TECH-12 No security or caching headers in the hosting config
- **Severity:** Low
- **Evidence:** `vercel.json` contains only an SPA rewrite: no Content-Security-Policy, no `frame-ancestors`, no Permissions-Policy, and no `immutable` cache header for hashed `/assets/*`. For a money app that will later hold bank data, the CSP is the main defence against injected scripts reading localStorage.
- **Recommendation:** Add a strict CSP (`default-src 'self'`, with a hash for the inline theme script at `index.html:11`), `frame-ancestors 'none'`, `Referrer-Policy`, `Permissions-Policy`, long immutable caching for `/assets/*` and `no-cache` for `/sw.js`.
- **Effort:** S

## What breaks first at 100 000 users

Serving the app is not the problem: it is a static site on a CDN. What breaks first, in order:

1. **Trust, through stale and lost data.** Users who imported once see drifting forecasts (TECH-01). Safari users who stay away for a week lose everything (TECH-04).
2. **The team's ability to see any of it.** No telemetry means the first signal is a support ticket or a social media post (TECH-02).
3. **The repository when a backend arrives.** Full-history payloads and 2 or 3 calls per write (TECH-03) multiply load. **Assumption:** with 30 percent daily active users each making about 6 data calls a day, that is about 180 000 calls a day, which is trivial for a managed Postgres service. The real costs are bank-feed ingestion, key management and the audit store, none of which exist yet.

## Top three risks

1. **The forecast misleads users as data ages (TECH-01).** A frozen import shows Enough to someone who is Short, with high confidence. That is a product safety risk, not only a bug.
2. **Running blind (TECH-02).** Without error, performance or accuracy telemetry, a pilot cannot show the forecast works or catch regressions on low-end phones.
3. **Underestimating the backend (TECH-03, TECH-04).** The repository swap is presented as easy. In practice auth, user scoping, sync, a server-side audit trail and data durability are most of the work for a pilot.

## Score

6 out of 10. The engine and front end are clean, fast and well tested for a demo, but data freshness, observability and the backend contract all need real work before a pilot.

## Sources

- MDN, "Storage quotas and eviction criteria": https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria (accessed 2026-10-20)
- GitHub Advisory GHSA-wrjc-x8rr-h8h6, React Router open redirect: https://github.com/advisories/GHSA-wrjc-x8rr-h8h6 (accessed 2026-10-20)

## Findings table

| id | severity | title | evidence | recommendation | effort |
| --- | --- | --- | --- | --- | --- |
| TECH-01 | High | Imported or edited data never ages, so the forecast drifts towards Enough | localRepository.ts:87; forecast.ts:36-41,66; engine-bench.out.txt (Ayanda Short to Enough after 30 days, confidence high) | Store an asOf date, run the engine from it, show data age, lower confidence after 3 days and hide the state after 14 | S |
| TECH-02 | High | No observability: errors, performance and forecast quality are invisible | ErrorBoundary.tsx:8,17; App.tsx:22; Import.tsx:55-60; no error reporting found | Error reporting with personal data scrubbed, route-level boundaries, unhandledrejection handler, web vitals, forecast accuracy events | M |
| TECH-03 | High | The repository contract is not ready for a real backend | repository.ts:75-95; personas.ts:3; localRepository.ts:16,57-69,146; PersonaProvider.tsx:112-117; Me.tsx:26 | User-scoped, paged, incremental API with concurrency control, server-side append-only audit, shared engine package | L |
| TECH-04 | Medium | localStorage writes are unguarded and the storage is fragile | localRepository.ts:61-69; Import.tsx:57-58; MDN 5 MiB limit and Safari 7-day eviction | Catch quota errors, move to IndexedDB, call storage.persist, sync across tabs, sync to a server before a pilot | M |
| TECH-05 | Medium | The service worker caching strategy is naive | sw.js:4,27-35,40-52; main.tsx:16-19; flows.spec.ts:131-140; vercel.json | Build precache manifest, cache versioned by build hash, cache only ok responses, stale-while-revalidate, exclude assets from the rewrite | S |
| TECH-06 | Medium | One 696 KB bundle with every locale loaded at start | audit.md (695 602 B, 141 864 B gzip); i18n/index.ts:5; App.tsx:8-18; 104 KB gzip of locales compressed one at a time | Load locales and routes on demand, prefetch through the service worker, bundle budget in CI | S |
| TECH-07 | Medium | Test strategy leaves the UI, data layer and failure paths unproven | coverage.txt 19.95 percent; screens.spec.ts:96-98; playwright.config.ts:13 Chromium only; no CI folder | CI pipeline, WebKit and low-end profiles, visual baselines, provider and Import tests, engine property tests | M |
| TECH-08 | Medium | Known advisories in shipped and build dependencies | audit.md: react-router GHSA-wrjc-x8rr-h8h6 moderate; tinypool critical and braces high (dev only) | Upgrade react-router to 7.18 or later, vitest 5, tailwind 4 or overrides; audit gate and Renovate | M |
| TECH-09 | Low | Engine runs on the main thread and is repeated many times per render | help.ts:6,29-39; HelpCard.tsx:17; Plan.tsx:65-73,190; helpPlan 10 to 40 ms on laptop | Debounce inputs, cache the base forecast, closed-form extraNeeded, Web Worker if needed | S |
| TECH-10 | Low | The fake 140 ms latency ships to production and is applied unevenly | data/index.ts:5; localRepository.ts:79-81,129-163; perf-home.json | Development-only latency flag; test loading and error states with Playwright route delays | S |
| TECH-11 | Low | "Today" is fixed when the app opens | PersonaProvider.tsx:36 | Recompute today on visibilitychange and at midnight, then reload | S |
| TECH-12 | Low | No security or caching headers in the hosting config | vercel.json has only a rewrite; inline script at index.html:11 | Add CSP with script hash, frame-ancestors, Referrer-Policy, Permissions-Policy, immutable asset caching | S |
