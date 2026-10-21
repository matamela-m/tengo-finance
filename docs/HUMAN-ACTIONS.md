# What a person must do

Prepared 2026-10-21. Build 2 prepares each of these but cannot do them. None of them is done. Owners are roles; the founder decides who.

| # | Action | Owner | Why it needs a person | Prepared in the build |
| --- | --- | --- | --- | --- |
| 1 | Review the AI drafts in each official language, starting with two Gauteng languages; confirm or change the draft money terms in `src/i18n/glossary.json` first, then mark strings reviewed | First-language speakers, briefed by the founder | All 10 non-English languages are AI drafts nobody has checked; a wrong money word can mislead | Complete drafts, per-string status, draft glossary, `import-drafts.mjs` for corrected files, `lang-shot.mjs` screenshots, gates in `npm run i18n:check` and `tests/languages.spec.ts` |
| 2 | Check the Tshivenda, isiNdebele, siSwati and Xitsonga drafts with particular care | First-language speakers of each | AI drafting is least reliable in these languages; Google does not support Tshivenda at all | Drafts in place and labelled "AI draft" |
| 3 | Confirm what "mutengo" means | Two first-language Tshivenda speakers | The review found it may mean price, not value | Name story off by default (`VITE_SHOW_NAME_STORY`) |
| 4 | Run the six comprehension sessions | Founder, with a note-taker | Only real people can show whether the date, range and states are read correctly | Kit in `docs/research/` |
| 5 | Legal review of the privacy notice and terms | A South African attorney | They are drafts; only a lawyer can say they meet POPIA, the CPA and ECTA | `/privacy-notice`, `/terms`, text under `legalDoc` in `en.json` |
| 6 | Regulatory position on FAIS and the NCA | An attorney, then a partner bank's compliance team | Whether estimates and suggestions count as advice depends on how they are offered | Copy avoids naming or linking financial products; outputs are never used for credit decisions |
| 7 | Name the responsible party and register the Information Officer | Founder | POPIA requires both; the app shows placeholders and a build warning until set | `VITE_RESPONSIBLE_PARTY`, `VITE_RESPONSIBLE_PARTY_ADDRESS`, `VITE_INFORMATION_OFFICER`, `VITE_PRIVACY_EMAIL` |
| 8 | Set up Supabase and Vercel, and sign operator agreements with them and the email sender | Founder | Accounts, keys, regions and contracts are the founder's | `docs/SETUP-SUPABASE.md`, migrations, `.env.example` |
| 9 | Decide the data region and, if outside South Africa, the cross-border assessment | Founder with the attorney | POPIA section 72 | Notice says where data goes; setup guide lists the check |
| 10 | State the hosting plan's backup retention in the notice | Founder | Only the chosen plan knows it | Notice and account page say it will be stated |
| 11 | Write the incident response plan | Founder with the attorney | Needs the named responsible party and the Information Regulator's process | Sample breach notice in Privacy |
| 12 | Nothing needed for drafts | Founder | The drafts were written without Google or any paid service; `npm run i18n:translate` stays available only if Google drafts are ever wanted | Not required |
| 13 | Validate the forecast on consented real statements | Founder with a data scientist, after ethics and consent | Every accuracy number so far is synthetic | Backtest code and regression thresholds ready to run on real data |
| 14 | A final logo and cleared brand assets | A designer, then the founder | The current mark is a placeholder | Brand component in one place |
| 15 | Confirm the help numbers on `/safety` | Founder | Numbers change; the page says so | Safety policy page |
| 16 | Put the purpose limit in any bank partner contract | Founder with the attorney | Contracts are human work | Notice and terms already state it |
