# Security and privacy lead (POPIA)

## Verdict

Tengo's privacy centre is a thoughtful demonstration of data subject rights for a hackathon: consent, access, export, correction, human review, a sample breach notice and deletion all exist as working screens, nothing leaves the browser, and a test checks there are no third party requests. As a model of what a real deployment would do, it is weaker than it looks. Several on-screen statements are written as facts but are not implemented: the "Kept for 12 months, then removed" retention rule is only a computed date and never deletes anything, the "Never uses account numbers or who you pay" panel is contradicted by storing statement descriptions verbatim (the bundled sample already holds "Client payment, Mrs K"), and green ticks sit next to encryption and access claims. Deletion removes the persona slot but leaves a receipt that proves nothing, and the audit log stores transaction descriptions, including the value a user later corrected. None of this harms anyone today because the data is fictional and local. It would matter the moment a real statement is imported, and nothing yet exists for authentication, server-side storage, key management, operator contracts, cross-border transfer, breach handling or a registered Information Officer. This is a simulated professional view based on the code and public sources, not legal advice.

## What works

- Everything is local and same-origin. The service worker only handles same-origin GETs (`public/sw.js:23`) and a Playwright test asserts no third party requests (`tests/flows.spec.ts:117`). The README states no analytics scripts (`README.md:104`).
- Clear "simulated" labelling on the consent screen and privacy centre: "Simulated privacy controls. Not a compliance certification." (`src/pages/Consent.tsx:64-66`, `src/pages/privacy/Overview.tsx:55-57`, screenshot `docs/review/screens/thabo-consent-light-390.png`). The Information Officer card is flagged "Placeholder details. Not a real contact." (`Overview.tsx:157`).
- Rights are mapped to real POPIA concepts: access and export (`src/pages/privacy/MyData.tsx:27-48`), correction routed to Money (`privacy.correctHint`), a human review route that echoes the representation right for automated decisions in section 71 (`src/pages/privacy/Review.tsx`), complaint to the Information Regulator (`privacy.complaints`), and a breach notice template with the right sections (`src/pages/privacy/Breach.tsx`, stamped "Sample").
- Withdrawing core consent pauses the forecast screens while leaving Privacy and Me open, so a person can still see and delete data (`src/layouts/AppGate.tsx:9,35`). Analytics is off by default (`Consent.tsx:28`).
- CSV import drops every column except date, description, amount and balance (`src/lib/csv.ts:130-152`) and the file is read in the browser, never uploaded (`src/pages/Import.tsx:99`). That is genuine minimisation for column-level data.
- Deletion is a two-step confirm with an explicit checkbox (`src/pages/privacy/Delete.tsx:46-66`) and does remove transactions, balance, consent, audit and review requests for that persona (`src/data/localRepository.ts:165-180`, confirmed by `docs/review/tools/security-privacy/deletion-probe.ts`).
- The repository interface (`src/data/repository.ts`) gives one seam where server-side access control, encryption and audit can be added without touching UI code.
- No `dangerouslySetInnerHTML`, `innerHTML` or `eval` in `src` (grep, 2026-10-20). React escaping covers the i18n `escapeValue: false` setting (`src/i18n/index.ts:14`) because no translated string reaches an HTML sink.

## What to improve

### SEC-01 Retention rule is displayed as fact but never enforced
**Severity:** High
**Evidence:** The privacy centre says "Kept for 12 months, then removed." and "Next removal {{date}}" (`src/i18n/locales/en.json:234`, `docs/review/screens/thabo-privacy-dark-1280.png`), the consent notice says "12 months, then it is removed" (`consent.notice.how.body`), and the README says retention "works against local storage" (`README.md:94`). `src/pages/privacy/retention.ts:6-11` only computes a date; the only caller is the display (`Overview.tsx:40`). Probe: a record dated 2024-01-05 is still held on 2026-10-20 (`docs/review/tools/security-privacy/deletion-probe.ts`, output "2024 record still held after 12+ months: true"). Seed data hides this because it is 90 days old and regenerated daily. POPIA section 14(4) requires destruction or de-identification as soon as reasonably practicable once authority to keep ends, and 14(5) requires that destruction prevents reconstruction.
**Recommendation:** Either implement a purge (drop transactions older than the window on every read and log it) or change the copy to "In a real service, records older than 12 months would be removed". In production, run a scheduled server job, cover backups and operator copies, and record the run.
**Effort:** S

### SEC-02 On-screen wording reads as real security and compliance claims
**Severity:** High
**Evidence:** "How data is protected" shows green check icons (`Overview.tsx:105-109`) beside "In a real deployment, data is encrypted in transit and at rest." and "Access is limited to you. Staff access would be logged and reviewed." (`en.json:205,207`). There is no real deployment, so the tick asserts a control that does not exist. Delete says "I understand this removes the data for good" (`en.json:330`) and "A deletion receipt is kept" (`en.json:327`). The human review says a person would "reply within 5 working days" (`en.json:288`). The breach sample says "told the Information Regulator" (`privacy.breach.doing.body`). One banner at the top is easy to crop out of a screenshot or pitch slide (`docs/review/screens/thabo-privacy-dark-1280.png`).
**Recommendation:** Replace ticks with a neutral "planned" icon, write every future control in the conditional ("would be"), put "Demo" on each card that describes a future control, and keep the banner on every privacy sub-page. Do not quote these screens as evidence of compliance in submission material.
**Effort:** S

### SEC-03 "Never uses names, account numbers or who you pay" is false for real statements
**Severity:** High
**Evidence:** The panel lists "Your name", "Account or card numbers" and "Who you pay, beyond the description" under "Never uses" (`en.json:188-201`). Import keeps the description verbatim (`src/lib/csv.ts:133,163`) and it is stored and exported unchanged (`MyData.tsx:44`). Bank statement descriptions routinely hold payee names, references and partial account numbers (**Assumption**, from typical South African statement layouts; likely in most debit-order and transfer rows). The project's own sample contains third party names: "Client payment, Mrs K" and "Client payment, Waterkloof" (`public/sample-statement.csv:2,7`). That is personal information of third parties, who receive no notice. Financial history is personal information under the POPIA section 1 definition, item (b).
**Recommendation:** Scrub descriptions on import (mask digit runs of 6 or more, South African ID number patterns, email and phone numbers), store a normalised merchant token instead of free text where possible, and change the copy to "Descriptions may contain names. We mask numbers." Add unit tests for the scrubber.
**Effort:** M

### SEC-04 No authentication, unencrypted financial data in localStorage, no security headers
**Severity:** High (for any real data), Low (for the demo)
**Evidence:** All records, balance, consent, audit and reviews sit in plaintext JSON under `tengo.data.v1` (`localRepository.ts:15,67-69`; `src/data/index.ts:5`). Anyone with the phone, any script on the origin, or a malicious browser extension can read it. Persona switching has no lock (`src/pages/Picker.tsx:40-41`), which on a shared phone means one person can open another's data. `vercel.json` sets only a rewrite: no Content-Security-Policy, HSTS, `X-Content-Type-Options`, `Referrer-Policy` or `Permissions-Policy`. The inline theme script in `index.html:11-22` means a strict CSP would need a hash. `react-router` 6.x carries a moderate open-redirect advisory (GHSA-wrjc-x8rr-h8h6, `docs/review/prep/audit.md:45-47`). POPIA section 19 requires appropriate, reasonable technical and organisational measures with regard to generally accepted practice.
**Recommendation:** For real data: server-side storage with authentication (bank SSO or phone OTP plus device binding), an app PIN or biometric lock, short-lived tokens in memory or HttpOnly cookies rather than localStorage, and at most a minimal encrypted cache on device (WebCrypto key, non-extractable). Ship CSP with a script hash, HSTS and the other headers in `vercel.json`. Upgrade react-router.
**Effort:** L

### SEC-05 Deletion is local only and the receipt proves nothing
**Severity:** Medium
**Evidence:** `deletePersona` deletes the slot then appends a receipt with `personaId`, timestamp and counts (`localRepository.ts:165-180`). Probe output after delete: `{"personas":{},"receipts":[{"id":"DEL_MVGIYDW5GV114F","personaId":"thabo",...}]}`. The receipt id comes from `Math.random` and `Date.now` (`localRepository.ts:37-40`), is unsigned, is stored on the same device whose data was "deleted", and survives forever until "Reset" (`resetAll`, line 186). The id is placed in the URL (`Delete.tsx:21`), so it lands in browser history. Review request count is not recorded in the receipt. Things deletion cannot reach: downloaded JSON and CSV exports (`MyData.tsx:39,45`), the original statement file, and in a real build any server copies, backups, logs and operator copies. Reopening the persona regenerates a fresh seed record immediately (probe: "source: seed tx: 220"), which can look like the deletion failed.
**Recommendation:** In production, deletion is a server workflow: delete primary rows, tombstone for backup restore, purge from operators with confirmation, expire backups within a stated window, then issue a receipt signed by the server that holds no personal data beyond a pseudonymous id. Tell the user plainly what cannot be deleted (their own downloads). Keep the deletion record itself under a documented retention period. In the demo, drop `personaId` from the URL and say "receipt on this device only".
**Effort:** M (demo copy S, real workflow L)

### SEC-06 Consent is bundled, partly pre-ticked, and not provable
**Severity:** Medium
**Evidence:** Core processing is a disabled toggle labelled "Required" (`Consent.tsx:86`), so "consent" for it is not voluntary in the sense of the POPIA section 1 definition ("voluntary, specific and informed"). Contract (section 11(1)(b)) is the more honest lawful basis for the core forecast. Daily messages default to on (`Consent.tsx:27`, screenshot `thabo-consent-light-390.png`). The `ConsentRecord` is overwritten on each change (`localRepository.ts:129-135`) and holds only booleans and a time: no notice version, language, channel or text shown. The only history is the audit log, capped at 200 entries (`localRepository.ts:16,146`) and erased on delete. Section 11(2)(a) puts the burden of proving consent on the responsible party. If messages ever carry offers, section 69 requires prior opt-in for electronic direct marketing.
**Recommendation:** Base core processing on contract and say so; keep consent for messages and analytics, both off by default. Store append-only consent events with notice version hash, locale, UI surface and timestamp on the server, retained beyond profile deletion as proof under a documented period. Separate service messages from any marketing.
**Effort:** M

### SEC-07 Audit log holds personal data, keeps pre-correction values, and is not tamper-evident
**Severity:** Medium
**Evidence:** Editing a transaction logs `{ name: tx.description }` (`src/components/TransactionEditor.tsx:41`), so the original description survives in the log after the user corrects it (probe output `{"name":"PAYMENT TO J SMITH","fields":"category"}`). This undermines correction under section 24. Translated labels are stored as params (`Overview.tsx:47`). The log is client-writable, trimmed to the last 200 entries (`localRepository.ts:146`), and every page view adds `session.opened` and `data.viewed` (`PersonaProvider.tsx:77-81`, `MyData.tsx:20-24`), so a busy user loses older evidence quickly.
**Recommendation:** Log event type, actor id, pseudonymous record id and changed field names only, never descriptions or amounts. In production write audit events server-side to append-only storage with hash chaining or WORM retention, separate from the user profile, and apply the same "no personal data in logs" rule to application logs, error tracking and analytics.
**Effort:** M

### SEC-08 Collection notice misses items section 18 requires
**Severity:** Medium
**Evidence:** The consent notice covers what, why, who, where and how long (`Consent.tsx:14-20`, `en.json:146-157`). Section 18(1) also needs the responsible party's name and address, whether supply is voluntary or mandatory and the consequences, recipients or categories of recipients, the right to object, the right to complain to the Regulator with contact details, and any intended cross-border transfer. The complaint line exists only on the privacy page (`privacy.complaints`). The Information Officer is "To be appointed" with `privacy@example.org` (`Overview.tsx:150-154`); section 55(2) and the Regulator's guidance note say officers take up duties only after registration on the eServices portal.
**Recommendation:** Add the missing items to a short layered notice with a link to a full privacy policy. Name the legal entity. Appoint and register an Information Officer before any pilot. Publish a PAIA manual.
**Effort:** S (copy), M (entity, officer, manual)

### SEC-09 Service worker would cache personal data once an API exists
**Severity:** Medium
**Evidence:** Every same-origin GET that is not a navigation is served cache-first and cached on success (`public/sw.js:38-49`). Today that is only hashed assets. If the planned hosted repository (`README.md:95`) uses a same-origin API path or a proxy, account and transaction responses would be written to Cache Storage, survive logout and deletion, and be served stale to the next person on a shared phone. Navigations are cached as `/` (`sw.js:30`), harmless now, risky if HTML ever embeds user data.
**Recommendation:** Allow-list cacheable paths (hashed `/assets/*`, icons, manifest) and make everything else network-only. Clear all caches and storage on logout and on deletion. Set `Cache-Control: no-store` on API responses.
**Effort:** S

### SEC-10 No plan for operators and cross-border transfer
**Severity:** Medium
**Evidence:** The cross-border card says "nothing is sent to a server, inside or outside South Africa" (`en.json:238`). The README invites swapping in Supabase (`README.md:95`) and an LLM-backed `MessageWriter` (`README.md:96`), and the Inbox previews WhatsApp and SMS delivery. Each would be an operator under POPIA section 1, requiring a written contract obliging section 19 safeguards and immediate breach notice to the responsible party (section 21). A database region, LLM provider or messaging platform outside South Africa triggers section 72: transfer only with adequate protection by law, binding rules or agreement, consent, or contractual necessity. Message text containing a cover date and amount is financial personal information; sending it to an LLM or WhatsApp sends it to that provider.
**Recommendation:** Keep a register of operators with region, data categories and contract status. Prefer a South African hosting region. For an LLM, send only templated, de-identified fields (no names, no descriptions) and contract for zero retention and no training. For WhatsApp or SMS, keep content minimal ("Your Tengo update is ready") to limit what lock screens and the platform see. Update the section 18 notice with transfers.
**Effort:** M

### SEC-11 Children and vulnerable users are not considered
**Severity:** Medium
**Evidence:** There is no age question or gate anywhere (grep for "age" checks in `src/pages`, none). POPIA defines a child as under 18 (section 1) and section 34 prohibits processing a child's personal information unless a section 35 exception applies, such as prior consent from a competent person. The target users (informal earners, shared phones per the brief) include people at risk of financial control by a partner or family member; the app has no lock, shows full history on open, and the planned daily messages could reveal a balance on a shared or watched phone.
**Recommendation:** Require 18 or older at onboarding (or a bank-verified adult account), add an app lock and a discreet notification mode, and run a short risk assessment for financial abuse and coercion with an inclusion partner.
**Effort:** M

### SEC-12 No breach response capability behind the sample notice
**Severity:** Medium
**Evidence:** `Breach.tsx` shows a template only. There is no incident runbook, detection, contact list or log source. Since 1 April 2025 section 22 notifications to the Regulator must go through the eServices portal, and commentary reports no low-risk exemption. An operator must tell the responsible party immediately (section 21(2)).
**Recommendation:** Before a pilot: an incident response plan with roles, a decision log, the SCN1 portal process, a data subject notice in all supported languages, operator notification clauses, and a tabletop exercise.
**Effort:** M

### SEC-13 Withdrawn consent does not stop processing
**Severity:** Low
**Evidence:** With core consent off, `AppGate` hides forecast pages (`AppGate.tsx:35`) but `PersonaProvider` still computes the full forecast on every load (`PersonaProvider.tsx:83-86`) and data stays held. Section 11(2)(b) allows withdrawal at any time.
**Recommendation:** Skip the forecast computation when `consent.core` is false, and offer deletion on the paused screen. On a server, stop scheduled jobs and messaging for that user.
**Effort:** S

### SEC-14 Export and import edge cases
**Severity:** Low
**Evidence:** `toCsv` quotes only commas, quotes and newlines (`src/lib/csv.ts:189-199`); a description beginning with `=`, `+`, `-` or `@` from an imported statement is written as a live spreadsheet formula (CSV injection). The JSON export includes the full audit log and free-text review details (`MyData.tsx:28-38`) as an unencrypted file in Downloads, with a note saying "Not real personal information", which would be false on real data. Import has no size limit (`Import.tsx:99`) and `write` does not catch `QuotaExceededError` (`localRepository.ts:67-69`), so a large file fails silently mid-flow.
**Recommendation:** Prefix risky leading characters with a single quote in exported cells. Warn before export that the file is unprotected. Cap import size (for example 2 MB) and handle storage errors with a message.
**Effort:** S

### Threat model for a real deployment

| Area | Threat | What must be built |
| --- | --- | --- |
| Authentication | Account takeover via SIM swap or shared phone; persona-style switching without a lock | Bank SSO or OTP plus device binding, app PIN or biometric, session timeout, step-up for export and delete |
| Data in transit | Interception, downgrade | TLS 1.2 or higher, HSTS preload, certificate monitoring, no data in URLs (fix `?deleted=` pattern) |
| Data at rest | Database or backup leak, stolen phone | Encrypted database and backups with KMS-managed keys, field-level encryption for descriptions and balance, minimal device cache, encrypted if kept |
| Row-level security | One user reading another's rows through a client SDK | RLS policies keyed to the authenticated user id on every table, deny by default, tests that try cross-user reads, no service-role key in the client |
| Key management | Key leak in code or CI | Keys in a managed KMS or secret store, rotation schedule, separate keys per environment, no keys in the bundle |
| Logging | Personal data in app logs, error tracker, analytics | Structured logs with ids only, scrubbers in the error SDK, retention limits, access to logs logged |
| Consent records | Cannot prove consent | Append-only consent events with notice version and locale (SEC-06) |
| Retention and deletion | Data kept forever; deletion misses backups and operators | Scheduled purge, backup expiry window, operator purge confirmation, signed receipt (SEC-01, SEC-05) |
| Breach response | Late or missed section 22 notice | Runbook, eServices SCN1 process, operator clauses (SEC-12) |
| Operators | Processor misuse or breach | Written contracts under section 21, register, due diligence (SEC-10) |
| Cross-border | Transfer without basis to cloud, LLM or messaging provider | Section 72 assessment, South African region where possible, de-identified LLM inputs (SEC-10) |
| Automated decisions | A forecast or loan check that substantially affects the user without recourse | Real staffed human review with logic explanation, as section 71 contemplates |
| Children and vulnerable users | Minors, coerced users | Age gate, discreet mode, lock (SEC-11) |
| Client side | XSS stealing tokens or data, stale caches | CSP, no tokens in localStorage, service worker allow-list (SEC-04, SEC-09) |

### Must exist before real user data is touched

1. A named legal entity as responsible party, a registered Information Officer, a privacy policy and a PAIA manual.
2. A documented lawful basis per purpose (contract for the forecast, consent for messages and analytics) and a section 18 notice with every required item.
3. Authentication with device binding and an app lock; no personal data in localStorage beyond an encrypted, minimal cache.
4. A hosted database with encryption at rest, row-level security tested against cross-user reads, KMS-managed keys and backups with a stated expiry.
5. Description scrubbing on import (ID numbers, account numbers, phone numbers, emails) and an updated "what we use" panel that tells the truth.
6. An enforced retention job and a deletion workflow that reaches backups and operators, with a server-signed receipt.
7. Append-only consent and audit records with no transaction content in them.
8. Security headers and CSP, service worker allow-list, dependency upgrades with no known high or critical issues in production dependencies.
9. Written operator agreements and a section 72 assessment for every provider (database, LLM, WhatsApp or SMS, hosting, error tracking).
10. An incident response plan, tested once, using the Regulator's eServices portal process.
11. An age gate and a vulnerable-user risk assessment.
12. A staffed human review process with a real response time before the screen promises one.
13. An independent security review or penetration test, and a privacy impact assessment signed off by counsel.

## Top three risks

1. **A demo statement mistaken for a compliance fact.** Ticks beside encryption and access claims, a retention rule that does not run, and "Never uses account numbers" could be quoted by judges, a bank partner or users as real controls (SEC-01, SEC-02, SEC-03).
2. **Real statements imported into an unprotected browser store.** The import path works with real bank CSVs today; their descriptions carry third party names and references and sit in plaintext localStorage on possibly shared phones, with no lock (SEC-03, SEC-04).
3. **Bolting on Supabase, an LLM or WhatsApp without the privacy plumbing.** The README makes these swaps sound like one-file changes; each adds an operator, likely a cross-border transfer and new caching and logging paths (SEC-09, SEC-10, SEC-12).

## Score

5 out of 10. Strong privacy UX for a demo and nothing leaves the device, but several screens assert controls that do not exist and none of the real-deployment foundations are in place.

## Sources

- Protection of Personal Information Act 4 of 2013, official text, gov.za: https://www.gov.za/documents/protection-personal-information-act (accessed 2026-10-20)
- POPIA consolidated text, Law Library: https://lawlibrary.org.za/akn/za/act/2013/4 (accessed 2026-10-20)
- POPIA section 1 definitions (child, operator, consent, personal information): https://popia.co.za/section-1-definitions/ (accessed 2026-10-20)
- POPIA section 11: https://popia.co.za/section-11-consent-justification-and-objection/ (accessed 2026-10-20)
- POPIA section 14: https://popia.co.za/section-14-retention-and-restriction-of-records/ (accessed 2026-10-20)
- POPIA section 18: https://popia.co.za/section-18-notification-to-data-subject-when-collecting-personal-information/ (accessed 2026-10-20)
- POPIA section 19: https://popia.co.za/section-19-security-measures-on-integrity-and-confidentiality-of-personal-information/ (accessed 2026-10-20)
- POPIA section 21: https://popia.co.za/section-21-security-measures-regarding-information-processed-by-operator/ (accessed 2026-10-20)
- POPIA section 35 (and section 34 prohibition): https://popia.co.za/section-35-general-authorisation-concerning-personal-information-of-children/ (accessed 2026-10-20)
- POPIA section 69: https://popia.co.za/section-69-direct-marketing-by-means-of-unsolicited-electronic-communications/ (accessed 2026-10-20)
- POPIA section 71: https://popia.co.za/section-71-automated-decision-making/ (accessed 2026-10-20)
- POPIA section 72: https://popia.co.za/section-72-transfers-of-personal-information-outside-republic/ (accessed 2026-10-20)
- Information Regulator, Guidance Note on Information Officers: https://inforegulator.org.za/wp-content/uploads/2025/07/Guidance_Note_on_Information_Officers_.pdf (accessed 2026-10-20)
- Information Regulator, POPIA forms (SCN1): https://inforegulator.org.za/popia-forms/ (accessed 2026-10-20)
- Information Regulator eServices security compromise reporting: https://eservices.inforegulator.org.za/compromises/default.aspx (accessed 2026-10-20)
- Moonstone, "Updated POPIA compliance: data breach reporting must be online": https://www.moonstone.co.za/updated-popia-compliance-data-breach-reporting-must-be-online/ (accessed 2026-10-20)
- Michalsons, guideline on notification of security compromises: https://www.michalsons.com/blog/guideline-notification-of-security-compromises-to-the-information-regulator/58993 (accessed 2026-10-20)
- GitHub advisory GHSA-wrjc-x8rr-h8h6 (react-router open redirect): https://github.com/advisories/GHSA-wrjc-x8rr-h8h6 (accessed 2026-10-20, via `docs/review/prep/audit.md`)

## Findings table

| id | severity | title | evidence | recommendation | effort |
| --- | --- | --- | --- | --- | --- |
| SEC-01 | High | Retention rule displayed as fact but never enforced | src/pages/privacy/retention.ts:6-11; en.json:234; README.md:94; deletion-probe.ts shows 2024 record kept | Implement purge or reword as future; server job covering backups in production | S |
| SEC-02 | High | On-screen wording reads as real security and compliance claims | Overview.tsx:105-109 green ticks; en.json:205,207,288,327,330 | Neutral planned icons, conditional wording, Demo label per card, banner on all sub-pages | S |
| SEC-03 | High | "Never uses names or account numbers" false for real statements | en.json:188-201; csv.ts:133,163 store description verbatim; sample-statement.csv:2,7 "Mrs K" | Scrub descriptions on import, tokenise merchants, fix copy, add tests | M |
| SEC-04 | High | No auth, plaintext financial data in localStorage, no security headers | localRepository.ts:15,67-69; Picker.tsx:40-41; vercel.json; index.html:11-22; audit.md:45-47 | Server storage with auth and app lock, CSP with hash, HSTS and headers, upgrade react-router | L |
| SEC-05 | Medium | Deletion is local only and the receipt proves nothing | localRepository.ts:37-40,165-180; Delete.tsx:21; probe output shows receipt with personaId | Server deletion workflow incl. backups and operators, signed receipt, no id in URL, explain downloads | M |
| SEC-06 | Medium | Consent bundled, messages pre-ticked, not provable | Consent.tsx:27,86; localRepository.ts:16,129-135,146 | Contract basis for core, opt-in off by default, append-only versioned consent events | M |
| SEC-07 | Medium | Audit log stores descriptions incl. pre-correction values; not tamper-evident | TransactionEditor.tsx:41; localRepository.ts:146; PersonaProvider.tsx:77-81 | Ids and field names only, server-side append-only log, no personal data in any logs | M |
| SEC-08 | Medium | Collection notice misses section 18 items; Information Officer placeholder | Consent.tsx:14-20; en.json:146-157; Overview.tsx:150-154 | Layered notice with all s18 items, named entity, registered Information Officer, PAIA manual | M |
| SEC-09 | Medium | Service worker would cache personal API responses | public/sw.js:30,38-49; README.md:95 | Allow-list static paths, network-only for the rest, clear caches on logout and delete, no-store | S |
| SEC-10 | Medium | No plan for operators and cross-border transfer | en.json:238; README.md:95-96; Inbox WhatsApp preview | Operator register and s21 contracts, s72 assessment, SA region, de-identified LLM inputs, minimal message content | M |
| SEC-11 | Medium | Children and vulnerable users not considered | No age gate in src/pages; Picker.tsx no lock | 18+ gate or bank-verified adult, app lock, discreet mode, abuse risk assessment | M |
| SEC-12 | Medium | No breach response behind the sample notice | src/pages/privacy/Breach.tsx template only | Incident plan, eServices SCN1 process, operator clauses, tabletop exercise | M |
| SEC-13 | Low | Withdrawn consent does not stop processing | PersonaProvider.tsx:83-86; AppGate.tsx:35 | Skip forecast when core consent off, offer deletion on paused screen | S |
| SEC-14 | Low | Export and import edge cases (CSV injection, unprotected files, no size cap) | csv.ts:189-199; MyData.tsx:28-38; Import.tsx:99; localRepository.ts:67-69 | Neutralise formula prefixes, warn on export, cap import size, handle quota errors | S |
