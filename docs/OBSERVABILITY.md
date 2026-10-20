# Observability without personal data

Prepared 2026-10-20 for build 2. Tengo handles money histories, so the rule is simple: no personal data in any log, metric or error report, on the device or on a server.

## What exists now (device only)

- **Error boundaries.** A top-level boundary keeps a crash from blanking the app; every page has its own boundary so the navigation stays usable (`src/components/ErrorBoundary.tsx`).
- **Local diagnostics.** `src/lib/diagnostics.ts` notes render errors, uncaught errors, rejected promises and storage failures with only four fields: time, kind, error class name and route pattern (ids and numbers replaced). Never the message, stack, amounts, descriptions or ids. At most 20 entries, on this device, cleared from Me. Unit tests check that a message containing a name, phone number and amount leaves no trace.
- **Diagnostics panel.** Me shows build, data version, storage used, offline cache version, language and recent error names. "Copy" lets a person choose to share it; nothing is sent.
- **Visible storage failures.** Full or blocked storage and unreadable data show a message instead of failing silently.

## Plan for server logging (when accounts exist)

| Signal | What is logged | What is never logged |
| --- | --- | --- |
| Client errors | Error class, route pattern, build id, browser family, time | Messages, stacks with values, URLs with query strings, user ids, emails |
| API requests | Endpoint pattern, status code, duration, region | Request or response bodies, auth tokens, IP addresses beyond the edge's own short retention |
| Auth events | Event type (sign-in requested, signed in, signed out, deleted) and a per-day salted hash of the user id | Email addresses, one-time codes |
| Forecast quality (pilot, with consent) | Shown state, lead days, band width, later outcome bucket, all aggregated | Balances, transactions, descriptions |

Rules:
1. Scrub at the source: the client sends only the fields above, built by an allow-list, never by removing fields from a full object.
2. Retention: 30 days for errors and requests, then deleted; aggregated forecast-quality counts kept for the pilot report only.
3. Hosting: in South Africa or a country with adequate protection, under an operator agreement (POPIA s21, s72). Listed in the privacy notice.
4. Access: two named people, logged access, reviewed monthly.
5. No third-party analytics or session replay, ever, because they capture screen content.

Before turning any server logging on, the founder must name the operator, sign the operator agreement and update the privacy notice (see `docs/HUMAN-ACTIONS.md`).
