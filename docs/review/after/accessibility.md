# Accessibility second pass (WCAG 2.2), build 2

## 1. Verdict

Build 2 fixes the serious build 1 failures. Page language, the chart slider, focus under the tab bar and field borders now pass. The new screens use real labels, fieldsets and focus-trapping dialogs, but fail where axe cannot see: lost focus, a page-resetting reveal timer, faint selected states and a weak quick exit.

## 2. Score

7/10 now, 6/10 before. High findings are fixed and tested; the new safety and onboarding flows add keyboard and screen reader failures.

## 3. Status check of A11Y findings

| id | claimed | verdict | evidence |
|---|---|---|---|
| A11Y-01 | Fixed | partly | html lang follows contentLanguage (Preferences.tsx:25, flows.spec.ts:50). Inbox.tsx:130 still sets lang to the chosen language on English message text. |
| A11Y-02 | Fixed | agree | Not re-run; cold-profile tests in tests/flows.spec.ts. |
| A11Y-03 | Fixed | agree | TimelineScrubber.tsx:104 value text has the assumption, range, level and events. No cover word per day. |
| A11Y-04 | Fixed | agree | index.css:96 and 97 set scroll padding for the top bar and tab bar. |
| A11Y-05 | Partly fixed | agree | Low-numeracy test not run. |
| A11Y-06 | Fixed | partly | Lock and discreet mode work (safety.spec.ts:15, 42). Quick exit uses replace on one entry (SafetyControls.tsx:32), so Back returns to Home when no PIN is set. safety.spec.ts:64 only checks "not /app/plan". Quick exit cannot be reached while a drawer is open (Drawer.tsx:28 makes root inert). |
| A11Y-07 | Partly fixed | agree | contrast-check.mjs: 124 of 124 pairs pass. Field border pairs at index.css:20 and 43. The selected state in Segmented is not covered (A11Y-A4). |
| A11Y-08 | Fixed | agree | TimelineScrubber.tsx:252 sets tabIndex 0, role region and a label. |
| A11Y-09 | Prepared for human action | agree | status.json: every language is pending. |
| A11Y-10 | Fixed | partly | Setup errors use role alert (ManualSetupForm.tsx:68). The obligations amount, account email and account balance still give no message (A11Y-A5). |
| A11Y-11 | Fixed | partly | Slider says "below zero" (TimelineScrubber.tsx:99). The chart table still prints "-R1 882" (TimelineScrubber.tsx:280). |
| A11Y-12 | Fixed | partly | Truncate is still used at Money.tsx:210, ObligationsCard.tsx:74, AccountsCard.tsx:55 and Import.tsx:218. |
| A11Y-13 | Fixed | agree | CommandPalette.tsx:48 ignores the shortcut while typing in a field with text. |
| A11Y-14 | Fixed | agree | Not re-measured. |
| A11Y-15 | Partly fixed | agree | The code field allows paste and autofill (Account.tsx:188). The PIN field sets autoComplete off (Lock.tsx:166), which blocks password managers (3.3.8). There is still no consistent help link (3.2.6). |

## 4. New findings

**A11Y-A1. Focus is lost on onboarding steps and notice actions.** High. 2.4.3, 4.1.3.
Evidence: Welcome.tsx:76 to 80 change the step and scroll, but do not move focus. The Next and Agree buttons (Welcome.tsx:194) unmount, so focus drops to body. Nothing announces the step. Notices.tsx:83, 94, 97 and 108 remove the notice that holds the focused button, with no announcement.
Recommendation: Focus the new step h1 and announce the step. After a notice action, announce the result and focus the next notice.

**A11Y-A2. The discreet reveal timer remounts the whole page.** Medium. 2.2.1, 3.2.2.
Evidence: AppLayout.tsx:176 keys the page on the masked state. REVEAL_MS is 30 s (store/reveal.ts:4). On expiry, open drawers close, typed entries are lost and focus resets. The masked text "R ••••" is read as "R bullet bullet". The slider still says "below zero" while masked (TimelineScrubber.tsx:99), so the sign leaks out loud.
Recommendation: Re-render amounts without remounting, pause the timer in forms, and say "amount hidden" with no sign while masked.

**A11Y-A3. Lock screen: a noisy countdown and a one-tap erase.** Medium. 4.1.3, 3.3.4, 3.3.8.
Evidence: Lock.tsx:173 puts a countdown that changes every second inside role alert, so it is announced every second. Lock.tsx:186 erases all data with one tap and no confirmation. Lock.tsx:166 sets autoComplete off.
Recommendation: Announce the wait once, confirm before erase, allow password managers.

**A11Y-A4. The selected option in segmented controls is too faint.** Medium. 1.4.11, 1.4.1.
Evidence: Segmented.tsx:33 shows the selected option as surface-3 on surface-2, about 1.1:1. Text ink against muted is about 2.3:1 (screenshots/setup-dark-390.png, "Weekly"). Used in setup, cash and obligations.
Recommendation: Add a 3:1 border or a check icon to the selected option. Add the pair to contrast-check.mjs.

**A11Y-A5. Disabled buttons and invalid fields give no reason.** Low. 3.3.1, 3.3.3.
Evidence: ObligationsCard.tsx:100 disables Save and the amount field shows no message. Account.tsx:164 disables the email submit until the checkbox is ticked and the email matches a regex. AccountsCard.tsx:98 sets aria-invalid with no message. Drawer.tsx:30 focuses Close first, so CashQuickAdd.tsx:88 autofocus never applies.
Recommendation: Keep Save enabled, show a linked error on submit, focus the first field.

## 5. What still blocks a real pilot

- Onboarding has not been run with TalkBack; A1 breaks the first-run flow.
- Quick exit must clear history and stay reachable while drawers are open. Test it with users from the shared-phone risk group.
- The Inbox lang mismatch, and no per-string lang="en" once any language moves to machine status.
- No reviewed language yet, and no session with low-literacy users (A11Y-05, A11Y-09).
- No check on an entry-level Android with TalkBack and 200 percent text for the drawers and lock screen.
