# Legal and regulatory advisor (South Africa): second pass

Not legal advice. A simulated review of build 2 changes only.

## 1. Verdict

Build 2 fixes the two findings that worried me most. Late credit or insurance suggestions are gone, and so is "safe". The new privacy notice and terms are honest drafts, but some of their promises are not yet true in the code, and the account flow never shows them.

## 2. Score

7/10 now, 5/10 before. The highest harm paths are closed; the drafts still promise things the build does not do, and no attorney has reviewed them.

## 3. Findings check

| id | claimed status | verdict | evidence |
| --- | --- | --- | --- |
| LEGAL-01 | Fixed | agree | `src/engine/help.ts:13-35` protected words; `help.ts:146` filters them; `help.test.ts:49-59` covers instalment, loan, insurance, funeral, rent, school fees. Gap in LEGAL-A5. |
| LEGAL-02 | Fixed | agree | No "safe" key left in `en.json`. "Daily budget", "Room to lend" with buffer lines; `sts.disclaimer` at `Home.tsx:116`, `plan.notAdvice` at `Plan.tsx:320`, `help.ideasNote` at `HelpCard.tsx:39,100`. |
| LEGAL-03 | Fixed | partly | Off by default (`Consent.tsx:28`, Welcome toggle). STOP in every template (`templates.ts:14-51`). But messages carry only "From Tengo", no contact details, and the opt-in is a toggle inside onboarding with no channel or number named. Server consent log exists only for accounts. |
| LEGAL-04 | Prepared for human action | partly | Drafts exist (`PrivacyNotice.tsx`, `legalDoc` keys) with placeholder warning. But the terms are linked only from the notice header (`PrivacyNotice.tsx:26`), not from Welcome or Account, and acceptance of terms is never recorded. |
| LEGAL-05 | Prepared for human action | agree | Listed as item 6 in `docs/HUMAN-ACTIONS.md`. No memo exists yet. Copy names no financial product. |
| LEGAL-06 | Fixed | agree | `help.earn` "Earn or receive", `help.earnAssume` "Borrowing to cover a gap usually costs more later"; NCR link shown only when Short (`HelpCard.tsx:92-96`). |
| LEGAL-07 | Partly fixed | agree | `consent.messages.body` and `inbox.facts.where` name Meta and cross-border processing; SMS offered; `messages.*.discreet` added. No explicit s72 consent, correctly marked partly. |
| LEGAL-08 | Fixed | agree | `hero.tightUntil` "Tight until" exists; "Enough until" only for Enough. |
| LEGAL-09 | Prepared for human action | agree | `legalDoc.notice.why` "Not for ... credit scoring, lending decisions"; item 16 in `HUMAN-ACTIONS.md`. |

## 4. New findings

### LEGAL-A1: The notice promises a re-prompt on change that the app does not do
- **Severity:** Medium
- **Evidence:** `legalDoc.notice.changes`: "Tengo asks you to look at it again before you continue." `NOTICE_VERSION` is only written at `Welcome.tsx:86-87`; nothing compares the stored version with the current one.
- **Recommendation:** Compare the stored version on open and block until the person views and accepts the new one, or remove the sentence.

### LEGAL-A2: The account flow collects email and moves data to a server without showing the notice or terms
- **Severity:** Medium
- **Evidence:** `Account.tsx:146-167` has email, the 18 or older box and "Send me a code". There is no link to `/privacy-notice` or `/terms`. Data leaves the device here, so POPIA s18 likely applies most here.
- **Recommendation:** Link both above "Send me a code" and record the notice and terms version with the account consent row.

### LEGAL-A3: The 18 or older declaration covers accounts only
- **Severity:** Low
- **Evidence:** `account.adult` is required at `Account.tsx:164`. The guest path has no declaration, yet `legalDoc.terms.use.body` and `safetyPolicy.adults.body` say Tengo is for adults. **Unclear law:** POPIA s34 and s35 restrict processing a child's personal information without a competent person's consent. Self-declaration is likely reasonable for a low-risk pilot.
- **Recommendation:** Ask the same one-line declaration in Welcome.

### LEGAL-A4: The notice states controls that do not exist yet
- **Severity:** Medium
- **Evidence:** `legalDoc.notice.who.body`: "Staff access ... is limited and logged." The migration has no staff role or staff access log; `audit_log` is written by the user only (`supabase/migrations/20261021000000_tengo_accounts.sql:72,121`). `legalDoc.notice.rights.body`: "ask a person to check a result". `review_requests` stores the request, but no reviewer, process or response time exists.
- **Recommendation:** Reword both to what is true today, or build them first. Overstated controls are a likely CPA s41 and POPIA s18 problem.

### LEGAL-A5: Absolute safety claims rest on an English keyword list; help numbers unsourced
- **Severity:** Low
- **Evidence:** `safetyPolicy.care.body`: "never suggests ... skipping a loan or insurance payment." Protection depends on words like "loan" or "insurance" in the description (`help.ts:13-35`). Debit order lines often show only a brand name, which a person could mark movable. Help numbers (10111, 0800 428 428, 116) carry "to be confirmed" with no source or check date.
- **Recommendation:** Soften to "is built not to suggest", add a "loan or insurance" bill type the person can pick, and add a source and checked date for each number.

## 5. What still blocks a real pilot

- No named responsible party or registered Information Officer; the app shows placeholders.
- No attorney review of the notice, terms and FAIS and NCA perimeter (`HUMAN-ACTIONS.md` items 5 and 6).
- The notice and account flow must match the code: re-prompt, staff access, human review, links at sign-up (LEGAL-A1, A2, A4).
- No data region, s72 assessment or signed operator agreements.
- Any real WhatsApp or SMS send needs a channel-specific opt-in, sender contact details and explicit cross-border consent.
