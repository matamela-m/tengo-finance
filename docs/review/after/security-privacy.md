# Security and privacy: second pass on build 2

Reviewer: security and privacy (POPIA). Scope: changed areas only. Read-only.

## 1. Verdict

Build 2 adds a real server base: row-level security on every table, working account deletion, an append-only consent log and a safe service worker. Several claims still outrun the code. The PIN lock can be bypassed for signed-in users, the SQL tests use a harness unlike Supabase's grants, and the notice states controls that do not exist.

## 2. Score

6 out of 10 now. 5 out of 10 before. Server, RLS, deletion and export are real and tested; the lock bypass and overclaims hold it back.

## 3. SEC findings check

Commands run: `npm run test:rls` printed "All row-level security tests passed." `npx vitest run src/data src/lib` gave 56 tests passed in 9 files.

| id | claimed | verdict | evidence |
|---|---|---|---|
| SEC-01 | Fixed | partly | Device purge works (retention.ts:21). Server purge is never scheduled (migration:185-197), so inactive accounts keep old rows. |
| SEC-02 | Partly fixed | agree | Ticks gone, but a new overclaim: staff access "limited and logged" (en.json:1280). Nothing logs it. |
| SEC-03 | Fixed | agree | scrubDescription on import (csv.ts:138,219); copy no longer denies names. |
| SEC-04 | Partly fixed | partly | RLS real (migration:100-121), headers set (vercel.json:9-16). connect-src allows every `*.supabase.co` project. Guest data plaintext; lock is a UI gate (SEC-A1, SEC-A5). |
| SEC-05 | Fixed | partly | delete_my_account removes all rows and auth.users (migration:146-153, tested). Backups not covered (en.json:1284). Receipt unsigned, not retrievable (accountRepository.ts:152). |
| SEC-06 | Fixed | partly | Append only and versioned (migration:60-68,118-119), but decided_at and notice_version are client-writable (migration:210). It records what the browser sent. |
| SEC-07 | Fixed | partly | No update or delete policies, so append only holds under RLS. The test passes for the wrong reason (SEC-A2). Owner can set any `at`; not tamper-evident. |
| SEC-08 | Prepared for human action | agree | Draft notice covers the items and warns on placeholders (legalDoc.placeholderWarning). |
| SEC-09 | Fixed | agree | Skips cross-origin and non-GET (sw.js:50); caches precache files only (sw.js:59-65). |
| SEC-10 | Prepared for human action | agree | Operators and s72 step in SETUP-SUPABASE.md:8-9,41,80. |
| SEC-11 | Fixed | partly | 18+ tick for accounts only (Account.tsx:31,71). A missing confirmation is filled with "now" (account/index.ts:63). |
| SEC-12 | Prepared for human action | agree | Template only; correctly a human action. |
| SEC-13 | Fixed | agree | Forecast not computed with core off (PersonaProvider.tsx:129-135). |
| SEC-14 | Fixed | agree | neutraliseCell (csv.ts:196) and MAX_IMPORT_BYTES 2 MB (csv.ts:190, Import.tsx:105). |

E2e switch: runtime check for localhost only (account/index.ts:18-24), so the claim holds on web hosts. It and MemoryBackend still ship in the production bundle (`grep` finds "tengo.e2e.accounts" in dist/assets). A wrapper on a localhost origin would turn it on.

## 4. New findings

**SEC-A1. High. "Forgot PIN" erase leaves a signed-in user signed in.**
Evidence: Lock.tsx:138-143 calls resetAll and removes the lock. AccountRepository.resetAll only clears a cache (accountRepository.ts:156-158). The session stays under `tengo.auth` (supabaseBackend.ts:21). After reload, server data opens with no PIN.
Recommendation: sign out and clear the session in eraseAll; add a Playwright test.

**SEC-A2. Medium. The RLS test harness does not match Supabase grants.**
Evidence: 00_stub_auth.sql:4-12 creates bare roles. The append-only and receipt tests expect insufficient_privilege (10_rls_test.sql:79-88,143-146). On Supabase, `authenticated` likely gets all table privileges by default, so those statements would affect zero rows and the tests would fail. TRUNCATE skips RLS and may be granted.
Recommendation: revoke update, delete and truncate on log and receipt tables; run the tests on the Supabase local stack in CI.

**SEC-A3. Medium. Consent and audit times can be set by the client.**
Evidence: table-wide insert grant (migration:210); decided_at, at, notice_version and adult_confirmed_at accept client values (migration:10,66-67,75).
Recommendation: column grants or a trigger forcing now(); set the notice version on the server.

**SEC-A4. Medium. The notice states controls that do not exist.**
Evidence: staff access "limited and logged" (en.json:1280); "removed when Tengo opens" (en.json:1284) while the server purge is only a comment (migration:185-187).
Recommendation: drop the staff line or build access logging; schedule pg_cron and reword retention.

**SEC-A5. Medium. The PIN lock is weak against a person who holds the phone.**
Evidence: try counter and cool-off are React state (Lock.tsx:30-31), reset by reload. Salt and hash sit in localStorage beside plaintext data (appLock.ts:7, Lock.tsx:24); a 4-digit PIN is a small offline search.
Recommendation: persist the counter with growing delays; say the lock hides the screen and does not encrypt.

## 5. What still blocks a real pilot

- SEC-A1 fixed and tested.
- RLS tests on real Supabase grants (SEC-A2); server-set log times (SEC-A3).
- Named responsible party and Information Officer, reviewed notice, SEC-A4 overclaims removed.
- Operator agreements, region and backup retention recorded; storage abroad likely needs a section 72 basis.
- Scheduled server retention, and an atomic saveBundle: it deletes then inserts, so a failure midway could wipe the server copy (supabaseBackend.ts:131-132).
