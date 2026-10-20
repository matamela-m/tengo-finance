# Localisation and language reviewer

## Verdict

Tengo has good plumbing for 11 languages and no translations. All 10 non-English locale files are byte-identical copies of `en.json`, and `status.json` marks every one `pending`. The pipeline that is meant to fill them has a blocking defect: Google Cloud Translation's supported-language list does not include Tshivenda. Because the script processes `ve` ninth and only writes `status.json` at the end, a full run would fail partway and leave state that the sync script then overwrites with English. The parts that exist are well thought out. Keys stay in step, the picker labels each language's translation status, `<html lang>` follows the chosen language, Tshivenda headings switch to a font that has the letters, placeholders are protected, and dates are kept in en-ZA instead of thin CLDR data. What is missing matters more for a money product: no glossary for the three state words, no per-string review status, hard-coded word order in several places, an SMS length check that only works for English, and no first-language review process. As it stands, a judge who picks isiZulu sees English with a notice saying so. If the script is run as written and shipped, people would get machine-translated money advice of uneven quality, with nothing in the message itself saying so.

## What works

- **Key parity is enforced.** `npm run i18n:check` passes with "All 11 locales have the same 565 keys" (run on 2026-10-20). `scripts/i18n-sync.mjs:33` refreshes pending languages from English and makes changed strings in machine or reviewed languages fall back to English. Note: the fact sheet says 577 keys. The check reports 565.
- **The status is honest and visible where language is chosen.** `src/components/LanguageSelector.tsx:53-57` shows "Translation on the way. This language shows English for now." for any language that is not English. The note is linked to the select by `aria-describedby` (line 42). Each option carries its own `lang` attribute (line 46).
- **`<html lang>` follows the selection** (`src/components/Preferences.tsx:12`, set before first paint in `index.html:18`). The Inbox message bubble has its own `lang={message.language}` (`src/pages/Inbox.tsx:117`), so the message language can differ from the app language.
- **Tshivenda headings are handled correctly at the CSS level.** `src/styles/index.css:84-86` switches `--font-heading` to Inter for `html[lang='ve']`. My glyph check (`docs/review/tools/localisation/glyphs.mjs`) confirms Figtree lacks ḓ ḽ ṅ ṋ ṱ and their capitals, and Inter's bundled latin-ext subset has all ten. The pseudo-localisation run confirms the computed `h1` font is `"Inter Variable"` when `lang` is `ve` (`docs/review/tools/localisation/expansion-flat-home-390.json`).
- **The translation script has sensible guards** (`scripts/translate.mjs:51-66,111-116`). `{{placeholders}}` and brand words are wrapped in `translate="no"`, `*bold*` becomes `<b>`, house-rule characters are stripped, and any string whose placeholders change is kept in English. The script runs at build time only, so the app never calls Google.
- **Plural keys use i18next `_one` and `_other`** (18 pairs in `en.json`), which i18next resolves through `Intl.PluralRules`. In Node 26 (ICU 78.3, CLDR 48), all 11 codes are supported and return `one/other` (`docs/review/tools/localisation/plurals.mjs`).
- **Keeping dates in en-ZA was a reasonable call.** CLDR output for these locales is thin or odd. Node prints `zu` as "Bil, Okt 27" and `xh` as "Okt 27, Lwesb", and `nr`, `ss`, `ve` and `ts` fall back to en-US ("Tue, Oct 27") (`plurals.mjs` output). Using en-ZA for every language (`src/i18n/languages.ts:39`) avoids US-ordered dates.
- **Rand formatting is consistent.** `formatZAR` (`src/lib/format.ts:6-15`) produces "R1 250" with a no-break space and a decimal point. Intl en-ZA would give "R 1 250,50", so the hand-rolled formatter avoids a comma decimal that many readers would not expect.
- **The unconfirmed name origin is stated in the UI rather than hidden** (`en.json:460`: "still to be confirmed by a Tshivenda speaker").

## What to improve

### L10N-01 Ten of the 11 languages are English, so the 11-language claim is not yet true
**Severity:** High
**Evidence:** `cmp` shows every file in `src/i18n/locales/*.json` is identical to `en.json`. `src/i18n/status.json` lists all 10 as `pending`, and `src/i18n/translated-from.json` is `{}`. The fact sheet's "Languages" section agrees. A user who picks isiZulu, Sepedi or Tshivenda gets English plus a notice.
**Recommendation:** Do not present "11 languages" as a feature in the pitch until at least the pilot languages are translated and checked. Say instead "built for 11, with N live". For the hackathon, pick two or three languages that fit the personas' area (Gauteng home languages, Census 2022: isiZulu 23.1 percent, Sesotho 13.1, Sepedi 12.6, Setswana 10.4; Stats SA P0301.4 Table 2.9). Have a first-language speaker write or post-edit at least the `messages.*`, `state.*`, `hero.*`, `stateCard.*`, `sts.*` and `nav.*` keys, and mark them reviewed.
**Effort:** M

### L10N-02 Tshivenda is not in Google Cloud Translation, and a full run would fail and leave the files in an inconsistent state
**Severity:** High
**Evidence:** The Cloud Translation supported-language page (accessed 2026-10-20) lists `af` and `zu` under Translation LLM, and `xh`, `st`, `nso`, `tn`, `ts`, `ss` and `nr` under NMT. It does not mention Venda, Tshivenda or `ve`. Consumer Google Translate added Venda in June 2024, but the API page used by the script does not list it. `scripts/translate.mjs:16` includes `ve` in `ALL`, and line 76 throws on any non-OK response. The loop writes each locale file as it finishes (line 123), but `status.json` and `translated-from.json` are written only after the loop (lines 127-128). A run that fails at `ve` (ninth of ten) therefore leaves `af` to `ss` translated on disk but still `pending` in `status.json`. The next `npm run i18n:sync` then replaces them with English (`scripts/i18n-sync.mjs:33`), wasting about 137 000 characters of quota. Not run, because there is no API key. The exact error code is an expectation based on the documentation. Separately, the README's estimate of "about 155,000 characters" for 10 languages is low: `en.json` has 17 160 characters of strings, or about 171 600 for 10.
**Recommendation:** Remove `ve` from the machine translation list and have a human translate Tshivenda. Make the script write `status.json` and `translated-from.json` after each language, or catch per-language errors and continue. Add a dry-run that checks each target against the API's `languages` endpoint first. Correct the README figure.
**Effort:** S

### L10N-03 Machine-translated money messages would ship without a glossary or context, and with no caveat in the message itself
**Severity:** High
**Evidence:** `scripts/translate.mjs:74` sends bare strings with `source: 'en'`. It sends no key path or context, and uses no glossary: v2 has no glossary support, and the script uses v2. 156 of 565 strings are 12 characters or fewer, including `state.enough`, `state.tight` and `state.short` ("Enough", "Tight", "Short"). Out of context, "Short" can be read as a length and "Tight" as a fit (**Assumption**: likely for at least some languages, which only a speaker can confirm). The state word is interpolated into every message: `messages.whatsapp.*` "Cover: {{state}}" and `messages.sms.*` "({{state}})" (`src/messages/templates.ts:17`). The "Machine translated with Google Translate" notice appears only beside the language select (`LanguageSelector.tsx:53-57`, used in `Picker.tsx:65`, `Me.tsx:82` and `Inbox.tsx:135`). It does not appear on Home or in the WhatsApp or SMS text that would reach the user. Public evidence on quality is weak. Google said of the 2022 zero-shot languages, including Sepedi and Tsonga, that the method "isn't perfect". It added Venda and Swati in 2024 with PaLM 2 and noted that it is "impossible to pick a 'right' variety". A Stellenbosch study of Afrikaans to English Google output found omission, mistranslation, non-translation and grammar to be the main error types, and quality stopped improving after 2012. News24 (July 2024) reported Tshivenda and siSwati output that diverged from the intended meaning (headline and search summary only, because the page returned 403).
**Recommendation:** Never show machine output for the `messages`, `state`, `hero`, `stateCard`, `sts`, `plan` loan-check and `help` keys until a first-language reviewer has signed them off. Fall back to English for those keys until then. Build a short term base (Enough, Tight, Short, Safe to spend, Cover, Next money, Plan) per language, written by speakers, and enforce it. Move to Cloud Translation v3 with a glossary if MT stays in the loop. Send each string with its key and an English context note. Keep the machine-translation notice in both the language and English, and show it in the app shell when the status is `machine`.
**Effort:** M

### L10N-04 Review status is per language, so "checked by a first-language speaker" can become untrue
**Severity:** Medium
**Evidence:** `scripts/translate.mjs:124` leaves a `reviewed` language as `reviewed` even after it machine-translates new or changed strings into it, and `--force` re-translates every string while keeping the status. `LanguageSelector.tsx:56` then shows `language.reviewed`: "Translated and checked by a first-language speaker." `TranslationStatus` in `src/i18n/languages.ts:29` has no per-key notion.
**Recommendation:** Track status per key, for example `reviewed-from.json` that maps each key to the English text and the reviewer. Show "reviewed" only when every user-facing key in the language is reviewed. Refuse `--force` on reviewed languages unless a flag names the keys.
**Effort:** M

### L10N-05 The page declares a language its text is not in
**Severity:** Medium
**Evidence:** Choosing Tshivenda sets `<html lang="ve">` (`Preferences.tsx:12`), but the content is English because the status is `pending`. The pseudo-localisation run records `lang: "ve"` on English pages. The Inbox bubble is marked `lang="ve"` over English text (`Inbox.tsx:117`). After a machine run, any string that falls back to English (`i18n-sync.mjs:19-20`, `translate.mjs:113`) also sits under the wrong `lang`. WCAG 3.1.1 and 3.1.2 require the declared language to match the content, and a screen reader may read English with a Tshivenda or default voice.
**Recommendation:** Set `<html lang>` to the language actually rendered: `en` while the status is `pending`. Wrap English fallback strings in `lang="en"`, for example by having a small `T` component compare the resolved string with English.
**Effort:** S

### L10N-06 Word order and agreement are fixed in code and by interpolated fragments
**Severity:** Medium
**Evidence:** Code joins a fragment and a date in English order: `WhyDrawer.tsx:105` and `Import.tsx:260` (`{t('hero.enoughUntil')} {date}`), and `privacy/Review.tsx:22` (`` `${label} ${date} (${state})` ``). `DateHero.tsx:9` shows "Enough until" above the date even for Tight, which conflicts with the "Tight" chip below it (screenshot `docs/review/tools/localisation/shots/pseudo-ve-flat-home-360.png`). Translated sentences receive a translated state word (`{{state}}`) and an English date ("Fri 23 Oct", from `formatDayShort` with en-ZA, `src/lib/format.ts:31`). In conjunctively written languages (isiZulu, isiXhosa, siSwati, isiNdebele), the word around a date or number usually takes a prefix or concord. **Assumption**: a translator will want forms such as a locative prefix attached to the date. That cannot be done when the date is a fixed English token, and it can break WhatsApp `*bold*` if the asterisk lands inside a word. `messages.whatsapp.tip.short` names a UI label ("Check Plan in Tengo") that MT translates separately from `nav.plan`.
**Recommendation:** Replace every concatenation with a single key that contains `{{date}}`, for example `hero.enoughUntilDate`. Give each state word its own full sentence per state instead of interpolating `{{state}}`. Add month and weekday names to the locale files so translators control them and the format, while keeping en-ZA as the fallback. Write the "Plan" reference as `$t(nav.plan)` nesting so it always matches. Ask reviewers to check bold markers on a real WhatsApp client.
**Effort:** M

### L10N-07 The SMS length check only works for English and GSM characters
**Severity:** Medium
**Evidence:** `SMS_LIMIT = 160` (`src/messages/MessageWriter.ts:28`). The Inbox counter uses `message.text.length` (`Inbox.tsx:129`), and the only test checks English (`src/messages/templates.test.ts:17-21`). The GSM 7-bit default alphabet has no ê, ô, ë, š, ḓ, ṱ or ṅ. A message containing any of them is sent as UCS-2, with at most 70 characters per SMS (Wikipedia, GSM 03.38). These letters are needed for Afrikaans (ê, ë, ô), Sepedi (š) and Tshivenda. Today's Short SMS for Ayanda is 101 characters. At 40 percent expansion it would be about 141 characters, which is more than two UCS-2 segments (**Assumption**: 30 to 50 percent expansion for these languages).
**Recommendation:** Count segments by encoding (GSM-7 or UCS-2), not by characters. Add a test that renders every SMS template in every language with long names and dates and checks segment count. Allow a shorter per-language SMS variant. Bring per-segment cost into the financial model.
**Effort:** S

### L10N-08 The layout clips expanded text in the bottom nav, persona rows and segmented controls
**Severity:** Medium
**Evidence:** I ran a pseudo-localisation test (`docs/review/tools/localisation/expansion.l10n.ts`) at 360 and 390px with `lang="ve"`, using Tshivenda letters as padding. With a flat 40 percent expansion, the main reading paths wrap without page overflow. With the W3C/IBM size bands (short strings at least double), the bottom tab bar truncates "Money" and "Inbox" on every page (`grid-cols-5`, `text-[12px]`, `truncate`, `src/layouts/AppLayout.tsx:171,185`; screenshot `shots/pseudo-ve-ibm-inbox-360.png`). On Me, `whitespace-nowrap` state chips (`src/components/StateChip.tsx:18`) squeeze persona descriptions to "E-hailing d…" and "Spaza shop o…" (`shots/pseudo-ve-flat-me-360.png`). The WhatsApp or SMS channel control loses its shape and stacks (`shots/pseudo-ve-ibm-inbox-360.png`). In the header, the demo chip pushes the privacy icon to the edge, although that chip is kept in English, so real translation would affect it less. The other clipped items in the JSON are screen-reader-only spans and user-entered descriptions.
**Recommendation:** Allow nav labels to wrap to two lines or use shorter per-language labels approved by reviewers. Let state chips shrink or move below the name on narrow screens. Make the segmented control wrap cleanly. Add the pseudo-locale as a permanent Playwright project.
**Effort:** S

### L10N-09 The quality gates do not check translation quality
**Severity:** Medium
**Evidence:** `scripts/i18n-check.mjs` checks only that keys match and that no string contains an exclamation mark. It does not check placeholder parity across locales (only the translate script does, at the moment of translation), `*bold*` parity, em or en dashes, or how many strings are identical to English. `scripts/fonts-check.mjs` passes, but only because every locale file is English. It has never seen a Tshivenda letter in a locale file.
**Recommendation:** Extend `i18n:check` to compare `{{var}}` sets and bold-marker counts with English for every key, reject U+2013 and U+2014, and report per language the share of strings still identical to English, so the status cannot say `machine` or `reviewed` while 100 percent is English. Add a fixture with real Tshivenda text to the font check.
**Effort:** S

### L10N-10 Plural rules need briefing and testing
**Severity:** Low
**Evidence:** `Intl.PluralRules` for `zu` and `nso` returns `one` for 0 as well as 1. i18next therefore renders `_one` for a count of 0 (`plurals.mjs`: "zu: count=0 -> '0 day'"). Counts can be 0 in `privacy.deleteTx`, `privacy.deleteAudit`, `money.count` and `import.skipped`. Node 26 supports all 11 codes. **Assumption**: older Android WebViews may ship trimmed ICU data without `nr`, `ss`, `ve` or `ts`, in which case the rules resolve to the default locale. This is untested in the app. There are no plural tests for any language other than English.
**Recommendation:** Tell translators that the `_one` form covers 0 in isiZulu and Sepedi. Add a unit test that renders every plural key in every language for counts 0, 1 and 2. Avoid count-0 sentences where an empty state reads better.
**Effort:** S

### L10N-11 Decomposed Tshivenda characters would render in a fallback font
**Severity:** Low
**Evidence:** The bundled Inter has the precomposed letters but not the combining marks U+032D (circumflex below) or U+0307 (dot above) (`glyphs.mjs` output: "MISSING" for both fonts). Tshivenda text typed or pasted as base letter plus combining mark, which some keyboards and sources produce, would draw the mark from a system font. `translate.mjs` does not normalise to NFC. `fonts-check.mjs` would catch this in locale files, but not in imported CSV descriptions or names.
**Recommendation:** Apply `.normalize('NFC')` to translated strings, imported descriptions and names. Add NFC as a rule in `i18n:check`.
**Effort:** S

### L10N-12 The name origin is still unconfirmed, and "value" may really be "price"
**Severity:** Low
**Evidence:** `README.md:106-110` and `BRIEF.md:11` record "mutengo", Tshivenda for value, as unconfirmed, and the UI says so (`en.json:460`). My search found no Tshivenda dictionary entry. The only hit lists "mutengo: price" on a Shona vocabulary page (search result summary only, because the page returned 403, so this is unverified). "Price" and "value" carry different meanings for a money brand.
**Recommendation:** Confirm with two Tshivenda speakers, and ideally a lexicographer from a university African languages department, before the pitch. Record the exact gloss and use it consistently in the pitch and the About copy. Have the `me.nameBody` string in Tshivenda written by a person, not MT.
**Effort:** S

### L10N-13 The demo safety label is English in every language
**Severity:** Low
**Evidence:** `translate.mjs:18` keeps `common.demoChip` as "Demo | Fictional Data" in every language. This is the label that tells users the figures are not theirs.
**Recommendation:** Show it in the chosen language and in English, for example "Demo | Fictional Data" plus a translated line.
**Effort:** S

### L10N-14 Every locale is bundled into the main script
**Severity:** Low
**Evidence:** `src/i18n/index.ts:5` imports all locale files eagerly. Per the fact sheet, the JSON accounts for 337 KB of the 696 KB bundle. Translated text with non-ASCII letters will grow slightly. A user downloads ten languages they will not read, on prepaid data.
**Recommendation:** Bundle English, and load the selected language with a dynamic import that the service worker caches for offline use.
**Effort:** S

## First-language review process (step by step)

1. **Recruit two reviewers per language**, one translator and one checker, both first-language speakers. At least one should live in or near the target users' area (for these personas, Gauteng). Pay them, and record their names and dates against each key.
2. **Brief them before they see any text.** Explain who the users are (irregular earners, low data, shared phones), what the product does and does not promise, and that it is not financial advice. Give the house style (plain words, no exclamation marks or dashes) and the tone: calm, direct and never shaming, especially for Short.
3. **Agree a term base first:** Enough, Tight, Short, Cover, Safe to spend, Next money, What helps most, Plan, Money, Inbox, Privacy, statement, bill, income. For each term, record the chosen word, the rejected alternatives and why. Test the three state words with three or more lay speakers for the intended meaning (enough money, nearly not enough, not enough).
4. **Translate or post-edit the money paths first:** `messages.*`, `state.*`, `hero.*`, `stateCard.*`, `sts.*`, `next.*`, `why.*`, `plan.*` (the loan check especially) and `help.*`. Then consent and privacy. Then everything else.
5. **Check meaning against the numbers.** For each persona's real output (Thabo Tight, Lerato Enough, Ayanda Short), have the reviewer read the Home screen and the WhatsApp and SMS messages, then say back what they would do. A wrong answer is a defect, whatever the grammar.
6. **Check grammar around variables:** prefixes or concords on `{{date}}`, `{{count}}` and `{{state}}`, the plural forms (0, 1, 2, 10), and `*bold*` boundaries on a real WhatsApp client.
7. **Check register:** formal or informal address, respect forms, and whether "Hi {{name}}" fits. Check that no line sounds like an instruction to borrow, lend or spend, so that "safe to spend" does not become "you may spend".
8. **Check on screen at 360px** in both themes, for truncation, wrapping and the Tshivenda glyphs in headings.
9. **Check accessibility by ear.** Listen to the main screens with a screen reader set to the language, if a voice exists, or confirm that `lang` is set correctly.
10. **Sign off per key** in a reviewed file. Re-review any key whose English changes. Spot-check 10 percent of keys after each release.
11. **Test with five users per pilot language** before any real data is used, using the same comprehension questions as step 5.

## Risk ranking by language

Speaker shares are Census 2022 "language spoken most often in the household" (Stats SA P0301.4, Table 2.8). Counts are the share applied to the 62 027 503 total population. They are approximate, because the table excludes infants under 1.

| Rank | Language | Census 2022 share (approx. speakers) | Why the risk |
| --- | --- | --- | --- |
| 1 | Tshivenda (ve) | 2.5% (about 1.6m) | Not offered by the Cloud Translation API the script uses (L10N-02). Added to consumer Translate only in 2024. Special letters (L10N-11). The brand name rests on an unconfirmed Tshivenda word (L10N-12). Few reviewers. |
| 2 | isiNdebele (nr) | 1.7% (about 1.1m) | Smallest written language. Added to Google in 2024. Conjunctive writing makes placeholders and agreement hard (L10N-06). Least public evidence of MT quality. |
| 3 | siSwati (ss) | 2.8% (about 1.7m) | Added in 2024. Conjunctive. News24 reported poor 2024 output. |
| 4 | Sepedi (nso) | 10.0% (about 6.2m) | 2022 zero-shot model ("isn't perfect"). š breaks GSM SMS (L10N-07). 12.6% of Gauteng, so many target users. |
| 5 | Xitsonga (ts) | 4.7% (about 2.9m) | 2022 zero-shot model. 7.0% of Gauteng. |
| 6 | isiZulu (zu) | 24.4% (about 15.1m) | Better MT support (listed under Translation LLM), but errors reach the most people, including 23.1% of Gauteng. Conjunctive. 0 takes the singular plural form (L10N-10). |
| 7 | Sesotho (st), Setswana (tn), isiXhosa (xh) | 7.8%, 8.3%, 16.3% | Longer-supported NMT languages. Still need human review of the money terms. |
| 8 | Afrikaans (af) | 10.6% (about 6.6m) | Strongest MT support and many reviewers. ê, ë and ô still force UCS-2 SMS. |

## Top three risks

1. **A machine-translated state word or loan check gives the wrong meaning in a money decision.** For example, Short read as fine, or "safe to lend" read as an instruction, sent by WhatsApp or SMS with no caveat (L10N-03, L10N-06).
2. **The 11-language claim is challenged at judging.** Every language shows English, and the chosen MT tool cannot produce one of the 11 languages, which is also the language of the brand's origin (L10N-01, L10N-02, L10N-12).
3. **Trust labels drift from reality.** "Checked by a first-language speaker" stays on after unchecked machine strings arrive, and `lang` declares a language the text is not in (L10N-04, L10N-05).

## Score

4/10. The infrastructure is above average for a hackathon build, but no language is translated, the pipeline cannot produce Tshivenda, and there is no review process for money messages.

## Sources

- Google Cloud, Cloud Translation "Language support", https://docs.cloud.google.com/translate/docs/languages (accessed 2026-10-20)
- Google Translate Help, "What's new in Google Translate: More than 100 new languages" (27 June 2024), https://support.google.com/translate/answer/15139004?hl=en (accessed 2026-10-20)
- Google blog, "110 new languages are coming to Google Translate" (27 June 2024), https://blog.google/products/translate/google-translate-new-languages-2024/ (accessed 2026-10-20)
- Google blog, "Google Translate learns 24 new languages" (11 May 2022), https://blog.google/intl/en-in/24-new-languages/ (accessed 2026-10-20)
- Lotz and Van Rensburg, "Omission and other sins: Tracking the quality of online machine translation output over four years", Stellenbosch Papers in Linguistics 46 (2016), https://spil.journals.ac.za/pub/article/view/223/215 (accessed 2026-10-20)
- News24, "Lost in translation: Google Translate adds SA languages Venda and Swati but fumbles on accuracy" (11 July 2024), https://www.news24.com/life/trends/lost-in-translation-google-translate-adds-sa-languages-venda-and-swati-but-fumbles-on-accuracy-20240711 (accessed 2026-10-20; headline and search summary only, page returned 403)
- Lelapa AI, Vulavula API "Get started", https://docs.lelapa.ai/vulavula-api/get-started (accessed 2026-10-20). Translation covers "a growing set of African languages, including isiZulu, isiXhosa, Sesotho". Venda and South Ndebele are not mentioned. This is a possible South African alternative for some languages, to be evaluated.
- Statistics South Africa, Census 2022 Statistical Release P0301.4, Tables 2.8 and 2.9, https://census.statssa.gov.za/assets/documents/2022/P03014_Census_2022_Statistical_Release.pdf (accessed 2026-10-20)
- Wikipedia, "GSM 03.38", https://en.wikipedia.org/wiki/GSM_03.38 (accessed 2026-10-20)
- Shona vocabulary page listing "mutengo: price", https://wisc.pb.unizin.org/lctlresources/chapter/buying-and-selling/ (accessed 2026-10-20; search summary only, page returned 403, unverified)

## Findings table

| id | severity | title | evidence | recommendation | effort |
| --- | --- | --- | --- | --- | --- |
| L10N-01 | High | Ten of 11 languages are English | All 10 locale files byte-identical to en.json; status.json all pending; translated-from.json empty | Claim "built for 11, N live"; get speakers to write the money keys for 2 to 3 Gauteng languages and mark them reviewed | M |
| L10N-02 | High | Tshivenda not in Cloud Translation; a full run would leave files inconsistent | Cloud Translation language page lists no Venda; translate.mjs:16,76,123,127-128; i18n-sync.mjs:33; README estimate 155k vs about 171.6k chars | Human-translate ve; save status after each language; pre-check supported targets; fix README figure | S |
| L10N-03 | High | MT money messages without glossary, context or in-message caveat | translate.mjs:74 bare strings, v2 no glossary; 156 strings of 12 chars or fewer incl. state words; notice only at LanguageSelector.tsx:53-57; Google and Stellenbosch quality caveats | Block MT on money keys until reviewed; speaker term base; v3 glossary and context; bilingual notice in app shell | M |
| L10N-04 | Medium | Review status is per language, not per string | translate.mjs:124 keeps reviewed after new MT strings; LanguageSelector.tsx:56 claims speaker-checked | Track reviewed status per key; show reviewed only when all keys are reviewed | M |
| L10N-05 | Medium | html lang declares a language the text is not in | Preferences.tsx:12 sets lang=ve on English content; Inbox.tsx:117; WCAG 3.1.1 and 3.1.2 | Use lang=en while pending; mark English fallback strings lang=en | S |
| L10N-06 | Medium | Word order and agreement fixed in code | WhyDrawer.tsx:105, Import.tsx:260, privacy/Review.tsx:22 concatenate; {{state}} and English date interpolated; DateHero.tsx:9 shows Enough until for Tight | One key per full sentence; month and day names in locales; nest nav labels; test bold on WhatsApp | M |
| L10N-07 | Medium | SMS limit check only works for English and GSM | MessageWriter.ts:28 160; Inbox.tsx:129 counts length; templates.test.ts English only; ê ë ô š ḓ not GSM-7 so 70 per SMS | Count segments by encoding; test every language; per-language short SMS | S |
| L10N-08 | Medium | Layout clips expanded text | expansion.l10n.ts at 360px: bottom nav truncates Money and Inbox (AppLayout.tsx:171,185); StateChip nowrap squeezes Me rows; channel control stacks; shots/pseudo-ve-ibm-inbox-360.png | Two-line nav labels; shrinkable chips; wrapping segmented control; keep pseudo-locale in CI | S |
| L10N-09 | Medium | Quality gates do not check translations | i18n-check.mjs checks keys and exclamation marks only; fonts-check passes only because all text is English | Check placeholder and bold parity, dashes, share identical to English; Tshivenda font fixture | S |
| L10N-10 | Low | Plural rules need briefing and tests | Intl.PluralRules zu and nso map 0 to one, so i18next renders the _one form for 0; no non-English plural tests | Brief translators; test plural keys for 0, 1, 2 in all languages | S |
| L10N-11 | Low | Decomposed Tshivenda characters use a fallback font | glyphs.mjs: Inter lacks U+032D and U+0307; no NFC normalisation in translate.mjs or CSV import | Normalise to NFC everywhere; add rule to i18n-check | S |
| L10N-12 | Low | Name origin unconfirmed, may mean price not value | README.md:106-110; en.json:460; only hit is a Shona page glossing mutengo as price (unverified) | Confirm with two Tshivenda speakers before pitch; fix gloss everywhere | S |
| L10N-13 | Low | Demo safety label English in every language | translate.mjs:18 keeps common.demoChip as "Demo, Fictional Data" | Show translated label alongside English | S |
| L10N-14 | Low | All locales bundled eagerly | i18n/index.ts:5 eager glob; 337 KB of locale JSON in a 696 KB bundle | Bundle English only; lazy-load and cache the chosen language | S |
