# Technology review, build 2 (second pass)

## Verdict

Build 2 fixes data age, adds hosting headers, code splitting, CI and row-level security tests. The new account layer is the weak point. It rewrites the whole dataset with non-atomic deletes and inserts on every edit, reads at most one page of transactions, and has no tests against Supabase, so it can lose a person's data.

## Score

7 out of 10 now. Earlier: 6 out of 10 (docs/review/technology.md:108). It moved up because TECH-01, TECH-06, TECH-08 and TECH-12 are properly closed, and not further because the backend sync is unsafe and observability is still local only.

## Findings check

| id | claimed | verdict | evidence |
| --- | --- | --- | --- |
| TECH-01 | Fixed | agree | forecast.ts:36-37 (3 and 14 days), 464-465 lowers confidence, 516 hides state as stale. |
| TECH-02 | Fixed | partly | diagnostics.ts:1-4 says "nothing is sent anywhere". No remote errors, no web vitals, no forecast accuracy events. A pilot team still sees nothing. |
| TECH-03 | Fixed | partly | Interface swap works (routing.ts:9-59). Not paged, not incremental, no concurrency control: supabaseBackend.ts:57 and 99-133 load and rewrite everything. Audit rows are written by the client (supabaseBackend.ts:159-168), not by the server. |
| TECH-04 | Fixed | partly | Quota guard and migrations exist (localRepository.ts:25, 45, 49). No IndexedDB, no storage.persist, no cross-tab sync: grep for persist(), storage events and BroadcastChannel in src found nothing. |
| TECH-05 | Fixed | partly | Manifest precache and versioned caches are good (sw.js:14-36, vite.config.ts:13-35). The recommended asset exclusion from the rewrite was not done: vercel.json:2 still rewrites every path, including missing /assets files, to index.html. |
| TECH-06 | Fixed | agree | `npm run budget`: 133.7 KB initial gzip against 142 KB. The claim of 119 KB is stale; headroom is now 8.3 KB. |
| TECH-07 | Fixed | partly | 171 unit tests pass. Playwright is still Chromium only (playwright.config.ts:11). CI runs `npm test`, not `npm run coverage`, so the 40 percent floor is not enforced (ci.yml:42). No test touches SupabaseBackend. |
| TECH-08 | Fixed | agree | `npm audit --omit=dev`: 0 vulnerabilities. Full audit: 7 (2 moderate, 5 high), dev only. CI gate is high only (ci.yml:45). |
| TECH-09 | Fixed | agree | Profiling recorded in README. Not re-measured. |
| TECH-10 | Fixed | agree | data/index.ts:7 latency is 0 outside development. |
| TECH-11 | Fixed | agree | PersonaProvider.tsx:68-69 visibilitychange and a 60 second check. |
| TECH-12 | Fixed | agree | vercel.json:8-25 CSP, HSTS, frame, referrer, permissions and cache headers; tests/headers.spec.ts. style-src still allows 'unsafe-inline'. |

## New findings

**TECH-A1, High. Account saves are not atomic and can wipe data.** Every edit calls saveBundle, which deletes all rows per table and reinserts them in sequential requests (supabaseBackend.ts:122-133). A network drop between delete and insert leaves the server empty. AccountRepository.change has no write queue (accountRepository.ts:36-40), so two quick edits interleave their deletes and inserts. Profiles upsert ignores updated_at, so two devices overwrite each other silently. Recommendation: one Postgres function per save, in a transaction, that upserts by id and removes missing ids, with an expected updated_at check; serialise writes in the client.

**TECH-A2, High. Transactions over one page are lost.** loadBundle selects transactions with no range (supabaseBackend.ts:57). Supabase returns at most 1,000 rows by default (supabase.com/docs/reference/javascript/select). The next save then deletes all rows and writes back only what was loaded (supabaseBackend.ts:131-132). Recommendation: page with range, or load through an RPC; add a test with more than 1,000 rows.

**TECH-A3, Medium. The test double hides the real backend's failure modes.** MemoryBackend saves the bundle in one atomic write (memoryBackend.ts:119-123), so A1 and A2 cannot fail in tests. SupabaseBackend is referenced by no test file. The RLS SQL tests check policies, not the client. The memory server and its localStorage switch also ship in the production bundle (`tengo.e2e` found once in dist/assets/index-Ba6XvEKp.js). Recommendation: integration tests against a local Supabase in CI; load MemoryBackend only in test builds.

**TECH-A4, Medium. Account mode has no offline or failure path.** The service worker never handles cross-origin requests (sw.js:50) and AccountRepository keeps only an in-memory cache, so a signed-in person offline cannot load or save. The write guard only shows a message for StorageError (PersonaProvider.tsx:150-156); a failed account save throws 'save_failed' with no visible state. Recommendation: device write-through cache with an outbox and a visible "not saved yet" state.

**TECH-A5, Medium. Deploy skew breaks open tabs.** The new worker calls skipWaiting and clients.claim and deletes older caches (sw.js:21, 32-33). An open tab on the old build then requests an old lazy route chunk, which Vercel rewrites to index.html (vercel.json:2). No vite:preloadError handler exists (grep found none). Recommendation: reload on preloadError, exclude /assets from the rewrite, and keep the previous cache for one version.

## What still blocks a real pilot

- Fix A1 and A2 before any real person signs in; both lose financial data.
- Remote error reporting with personal data scrubbed, plus a forecast accuracy signal. Local diagnostics give the team no view of a pilot.
- Offline and save failure handling in account mode (A4).
- Integration tests against real Supabase, WebKit in Playwright, and the coverage floor in CI.
- Concurrency control across devices and tabs.
