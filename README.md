# Tengo

**Money you can plan around.**

A balance tells you what you have. Tengo tells you until when.

Tengo is a money app for people with irregular income: drivers, hairdressers, spaza shop owners and anyone paid in lumps, by the day or by the weekend. It answers one question: is my money enough until the next money? The answer comes date first, for example "Enough until Thu 23 Oct", with a likely range, a "Safe to spend today" figure and a cover state of Enough, Tight or Short.

Built for the FNB App of the Year hackathon, track: Financial inclusion and money confidence.

> This is a demo with fictional data only. There is no bank connection, no real personal information and no open banking. Every person in it is a fictional composite.

## Run it

Requires Node 20 or later.

```bash
npm install
npm run dev          # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run build` | Type checks and builds to `dist/` |
| `npm run test` | Contrast check for both themes, then Vitest unit tests (engine, seeds, CSV, messages, repository, formatting) |
| `npm run lint` | ESLint plus a check that no em or en dash appears anywhere |
| `npm run i18n:check` | Fails if any of the 11 locales is missing a key, has extra keys, or uses an exclamation mark |
| `npm run i18n:sync` | Copies new or changed English strings into the other locale files |
| `npm run i18n:translate` | Machine translates the locale files with the Google Cloud Translation API (needs `GOOGLE_TRANSLATE_API_KEY`) |
| `npm run a11y` | axe-core accessibility checks (WCAG 2.1 A and AA) on every main page, light and dark |
| `npm run contrast` | WCAG contrast check of every text and surface pair the UI uses |
| `npm run screens` | Playwright: screenshots at 390, 768, 1280 and 1600px into `screenshots/`, plus end to end flow tests |
| `npm run icons` | Rebuilds the placeholder favicons and app icons (needs Python with Pillow: `pip install pillow`) |
| `npm run fonts:check` | Checks every locale string against Inter (fails on gaps) and Figtree (warns on gaps) |

**On your phone (same Wi-Fi):** run `npm run dev:phone`, then open the "Network" address it prints (for example `http://192.168.1.20:5173`) in your phone's browser. If macOS asks whether Node may accept incoming connections, choose Allow.

Playwright needs a browser once: `npx playwright install chromium`. Set `SCREENS=home-thabo,landing` or `WIDTHS=390` to capture a subset.

`vercel.json` has an SPA rewrite, so the build deploys to Vercel as is.

## Redesign

A restyle of the existing app: the same engine, data, routes, i18n, consent and privacy logic, PWA and tests, with a new visual system. Calm and confident: quiet neutrals, hairline borders, generous space, almost no shadows, big tightly tracked headings, pill buttons, status-dot badges and tiny uppercase labels on data cards. Dark is the default theme. Light is equally finished.

**What changed**
- **Tokens.** Every colour is defined once in `src/styles/index.css`, for dark and light, and exposed to Tailwind (`bg`, `surface`, `surface-2`, `surface-3`, `line`, `line-strong`, `ink`, `muted`, `subtle`, `accent`, `accent-soft`, `on-accent`, `enough`, `tight`, `short` and their soft fills). The old palette (white, off-white, mint, sage, deep green, charcoal) is gone and components hard-code no colours. The accent is one token, `--accent`, and is deliberately not green so it can never be mistaken for Enough.
- **Theme.** Light, Dark or System, remembered. An inline script in `index.html` sets the theme and language before first paint, so the wrong theme never flashes. A Playwright test blocks the app bundle and checks the inline script alone gets it right.
- **Brand.** The old logo is archived. `src/components/Brand.tsx` is the only place the brand is drawn (see Brand and type).
- **Primitives.** Card (with optional corner brackets), section label, icon tile, badge with status dot, stat tile, state chip, slim three-segment cover gauge, quiet inputs, switch with an On or Off dot, segmented control, drawer, toast, data table, empty state and skeleton.
- **Pages.** A new landing page with a framed live preview, a Notion-style sidebar that collapses to icons, a rebuilt Home (greeting banner, large date hero, stat tiles, restyled chart) and every other page on the shared primitives.
- **Command menu.** Ctrl or Cmd plus K (or "Search or jump to" in the sidebar) jumps to a page, switches person, changes language or theme.

**Type rules**
- Figtree (600 to 700) for headings, display numbers, buttons and nav, tracked about -0.03em at display sizes and -0.01em at heading sizes. Inter for body, labels, inputs and tables. Money and dates always use tabular numbers.
- Fluid scale: display up to 88px on desktop and 44px on phones, h1 40, h2 28, h3 20, body 16, small 14, caption 12. Nothing smaller than 12px.
- The heading font is the CSS variable `--font-heading`. For Tshivenda (`html[lang="ve"]`) it switches to Inter, because Figtree has none of ḓ ḽ ṅ ṋ ṱ. Every other language keeps Figtree, with Inter as the fallback. A test checks both.

**Placeholders to replace**
- `src/components/Brand.tsx`: the text wordmark and the T mark. Swap in the final logo here and nowhere else.
- `public/icons/*`: favicons, the SVG favicon, the Apple touch icon and the PWA icons, made from the T mark by `npm run icons`.
- `public/manifest.webmanifest`: `theme_color` and `background_color` follow the dark theme. Update them with the final brand.

**Known limitations of the redesign**
- Hairline borders on inputs and cards are below 3:1 against their surface. Fields are identified by their visible label and their filled background, and focus shows a 2px accent ring that passes 3:1.
- A web app manifest takes one theme colour, so installed app chrome uses the dark background. The page itself follows the chosen theme through the `theme-color` meta tags.
- The shortcut hint reads "Ctrl K". Cmd plus K works on a Mac too.

## How the forecast works, in plain words

All of it lives in `src/engine/`: pure TypeScript, no UI imports, unit tested.

1. **Sort the history.** Every transaction is income, a recurring bill or everyday spend. A recurring bill is the same description with a similar amount (within 20%) repeating 24 to 36 days apart.
2. **Everyday spend.** Take the last 60 days (fewer if that is all there is) and add up spending over every rolling 7 day stretch. The middle value, divided by 7, is the usual daily spend. The 80th percentile is a heavy week and the 20th a light week.
3. **Next money.** Deposits of at least 10% of typical monthly income count as "next money". If most of them land on one weekday (Lerato's Saturdays, Thabo's Monday payout), the next one is the next such weekday, possibly a day late. Otherwise the gaps between deposits give an earliest, typical and latest date (Ayanda's lumpy cash). Amounts give a low, typical and high figure.
4. **Runway.** Start from today's balance and run it down day by day at the daily spend rate, taking off known bills on their dates. Money not yet received is not counted. The day the normal path reaches zero is **the date**. The heavy and light paths give the range band.
5. **Cover.**
   - **Enough**: even the heavy week lasts until the latest likely next money.
   - **Tight**: a normal week reaches the typical next money, a heavy week does not.
   - **Short**: a normal week runs out first. The headline then reads "Short from" with the gap in days.
6. **Safe to spend today**: balance minus bills due before the latest likely next money, divided by the days until then, floored at zero and rounded down to the nearest R5.
7. **Confidence**: high with 60 or more days of history, medium with 28 to 59, low below 28. Low confidence widens the band by 1.5 times and shows "Low confidence".
8. **Scrubber**: for each of the next 30 days, the light, normal and heavy balance including expected income at its usual timing, and the cover for that day.
9. **What-if and loan check** rerun the same engine with an extra dated item or a lower starting balance.

The "Why this date" drawer on Home shows every input behind the date and doubles as the explanation of this automated result.

## What is simulated

- **People and money.** Thabo (e-hailing driver, Tshwane), Lerato (hairdresser, Mamelodi) and Ayanda (spaza shop owner, Tembisa) are fictional composites. Their 90 days of history come from a seeded generator, so they are the same every time and always end yesterday. They start in Tight, Enough and Short.
- **No bank.** No bank connection and no open banking. The CSV import reads a file in the browser and nothing is uploaded.
- **Messages.** The Inbox previews a daily WhatsApp or SMS message. Nothing is sent.
- **Privacy controls.** Consent, access, export, correction, deletion, retention, audit log, human review, breach notice and Information Officer details all work against local storage. They show good practice and are labelled "Simulated privacy controls. Not a compliance certification." They are not legal advice. The Information Officer contact is a placeholder.
- **Storage.** Everything is in this browser's local storage. All data access goes through the `TengoRepository` interface in `src/data/repository.ts`. Swap `LocalRepository` in `src/data/index.ts` for a hosted one (for example Supabase) without touching UI code.
- **Messages writer.** `MessageWriter` in `src/messages/` has a template implementation. An LLM-backed writer can implement the same interface.

## Brand and type

- **Logo: placeholder.** The founder is replacing the logo. The old PNGs are archived in `assets/archive/old-brand/` (not served, not bundled). Every place the brand appears uses one component, `src/components/Brand.tsx`: a "Tengo" wordmark in Figtree 700, and a `mark` variant (a rounded accent square with a bold T). Swap that one file for the final logo.
- **Icons: placeholders.** Favicons, the SVG favicon and the PWA icons are the T mark in the accent colour, made by `npm run icons` (Python with Pillow). Replace them with the final logo.
- **Fonts.** Figtree for headings, display numbers, buttons and nav. Inter for body text, labels, inputs and tables. Both are self-hosted through `@fontsource-variable`. Money and dates use tabular numbers.
- **Tshivenda.** Figtree has no Tshivenda letters (ḓ ḽ ṅ ṋ ṱ). The heading font is a CSS variable, and when the language is Tshivenda (`html[lang="ve"]`) headings switch to Inter, so a word never mixes two fonts. `npm run fonts:check` scans every locale string against both fonts: it fails if Inter lacks a character and warns about Figtree gaps.
- No third-party requests at runtime and no analytics scripts. A Playwright test checks this.

## Name origin

Tengo comes from "mutengo", Tshivenda for value. This was supplied by the founder.

- [ ] **TODO: confirm the meaning with a Tshivenda speaker before submission.**

## Colour and contrast

| Token | Dark | Light |
| --- | --- | --- |
| bg | #0B0B0C | #FBFBFA |
| surface-1 / 2 / 3 | #121214 / #18181B / #1F1F23 | #FFFFFF / #F4F3F1 / #ECEAE6 |
| border / border-strong | #26262B / #34343A | #E7E5E1 / #D6D3CD |
| text / muted / subtle | #F4F4F5 / #A1A1AA / #8B8B94 | #1C1B19 / #66635D / #6C6963 |
| accent / on-accent | #7291FF / #0B0B0C | #3755CC / #FFFFFF |
| enough / tight / short | #34D399 / #FBBF24 / #F97362 | #046E50 / #9B4708 / #A9390A |
| soft fills | state colour at 13%, accent at 14% | state colour at 10%, accent at 10% |

The proposed light values were adjusted where a pair failed: subtle text, the three state colours and the accent are each a few percent darker in light, and the dark accent a touch lighter, so that state text passes 4.5:1 on every surface and on its own soft fill. Every state shows a colour, a word and an icon.

`npm run contrast` checks every text and UI pair the interface uses, in both themes, blending translucent fills over the surface they sit on first. It runs as part of `npm run test`. Body and small text need 4.5:1, large text and non-text UI 3:1. The empty gauge segment is decorative, since the state word is always shown beside it.

<details>
<summary>All 116 checked pairs</summary>

| Theme | Pair | Foreground | Background | Ratio | Target |
| --- | --- | --- | --- | --- | --- |
| dark | Text on bg | #F4F4F5 | #0B0B0C | 17.90:1 | 4.5:1 |
| dark | Muted text on bg | #A1A1AA | #0B0B0C | 7.68:1 | 4.5:1 |
| dark | Subtle text on bg | #8B8B94 | #0B0B0C | 5.83:1 | 4.5:1 |
| dark | enough text on bg | #34D399 | #0B0B0C | 10.23:1 | 4.5:1 |
| dark | tight text on bg | #FBBF24 | #0B0B0C | 11.79:1 | 4.5:1 |
| dark | short text on bg | #F97362 | #0B0B0C | 7.17:1 | 4.5:1 |
| dark | Text on surface-1 | #F4F4F5 | #121214 | 17.02:1 | 4.5:1 |
| dark | Muted text on surface-1 | #A1A1AA | #121214 | 7.30:1 | 4.5:1 |
| dark | Subtle text on surface-1 | #8B8B94 | #121214 | 5.54:1 | 4.5:1 |
| dark | enough text on surface-1 | #34D399 | #121214 | 9.73:1 | 4.5:1 |
| dark | tight text on surface-1 | #FBBF24 | #121214 | 11.21:1 | 4.5:1 |
| dark | short text on surface-1 | #F97362 | #121214 | 6.82:1 | 4.5:1 |
| dark | Text on surface-2 | #F4F4F5 | #18181B | 16.12:1 | 4.5:1 |
| dark | Muted text on surface-2 | #A1A1AA | #18181B | 6.91:1 | 4.5:1 |
| dark | Subtle text on surface-2 | #8B8B94 | #18181B | 5.25:1 | 4.5:1 |
| dark | enough text on surface-2 | #34D399 | #18181B | 9.22:1 | 4.5:1 |
| dark | tight text on surface-2 | #FBBF24 | #18181B | 10.61:1 | 4.5:1 |
| dark | short text on surface-2 | #F97362 | #18181B | 6.46:1 | 4.5:1 |
| dark | Text on surface-3 | #F4F4F5 | #1F1F23 | 14.94:1 | 4.5:1 |
| dark | Muted text on surface-3 | #A1A1AA | #1F1F23 | 6.41:1 | 4.5:1 |
| dark | Subtle text on surface-3 | #8B8B94 | #1F1F23 | 4.86:1 | 4.5:1 |
| dark | enough text on surface-3 | #34D399 | #1F1F23 | 8.54:1 | 4.5:1 |
| dark | tight text on surface-3 | #FBBF24 | #1F1F23 | 9.84:1 | 4.5:1 |
| dark | short text on surface-3 | #F97362 | #1F1F23 | 5.99:1 | 4.5:1 |
| dark | Accent link on bg | #7291FF | #0B0B0C | 6.75:1 | 4.5:1 |
| dark | Accent link on surface-1 | #7291FF | #121214 | 6.42:1 | 4.5:1 |
| dark | Accent link on surface-2 | #7291FF | #18181B | 6.08:1 | 4.5:1 |
| dark | Accent text on accent-soft over bg | #7291FF | #191E2E | 5.69:1 | 4.5:1 |
| dark | Text on accent-soft over bg | #F4F4F5 | #191E2E | 15.09:1 | 4.5:1 |
| dark | enough text on enough-soft over bg | #34D399 | #10251E | 8.37:1 | 4.5:1 |
| dark | tight text on tight-soft over bg | #FBBF24 | #2A220F | 9.43:1 | 4.5:1 |
| dark | short text on short-soft over bg | #F97362 | #2A1917 | 6.13:1 | 4.5:1 |
| dark | Accent text on accent-soft over surface-1 | #7291FF | #1F2435 | 5.29:1 | 4.5:1 |
| dark | Text on accent-soft over surface-1 | #F4F4F5 | #1F2435 | 14.03:1 | 4.5:1 |
| dark | enough text on enough-soft over surface-1 | #34D399 | #162B25 | 7.77:1 | 4.5:1 |
| dark | tight text on tight-soft over surface-1 | #FBBF24 | #302816 | 8.73:1 | 4.5:1 |
| dark | short text on short-soft over surface-1 | #F97362 | #301F1E | 5.71:1 | 4.5:1 |
| dark | Accent text on accent-soft over surface-2 | #7291FF | #25293B | 4.94:1 | 4.5:1 |
| dark | Text on accent-soft over surface-2 | #F4F4F5 | #25293B | 13.09:1 | 4.5:1 |
| dark | enough text on enough-soft over surface-2 | #34D399 | #1C302B | 7.25:1 | 4.5:1 |
| dark | tight text on tight-soft over surface-2 | #FBBF24 | #362E1C | 8.04:1 | 4.5:1 |
| dark | short text on short-soft over surface-2 | #F97362 | #352424 | 5.36:1 | 4.5:1 |
| dark | Accent text on accent-soft over surface-3 | #7291FF | #2B2F42 | 4.54:1 | 4.5:1 |
| dark | Text on accent-soft over surface-3 | #F4F4F5 | #2B2F42 | 12.03:1 | 4.5:1 |
| dark | enough text on enough-soft over surface-3 | #34D399 | #223632 | 6.65:1 | 4.5:1 |
| dark | tight text on tight-soft over surface-3 | #FBBF24 | #3C3423 | 7.37:1 | 4.5:1 |
| dark | short text on short-soft over surface-3 | #F97362 | #3B2A2B | 4.93:1 | 4.5:1 |
| dark | Primary pill: background-colour label on text-colour fill | #0B0B0C | #F4F4F5 | 17.90:1 | 4.5:1 |
| dark | On-accent on accent (mark, selected) | #0B0B0C | #7291FF | 6.75:1 | 4.5:1 |
| dark | On-accent on short (destructive button) | #0B0B0C | #F97362 | 7.17:1 | 4.5:1 |
| dark | Dimmed headline half (display size) on bg | #A1A1AA | #0B0B0C | 7.68:1 | 3:1 |
| dark | Focus ring and handle (accent) on bg | #7291FF | #0B0B0C | 6.75:1 | 3:1 |
| dark | Focus ring and handle (accent) on surface-1 | #7291FF | #121214 | 6.42:1 | 3:1 |
| dark | Focus ring and handle (accent) on surface-2 | #7291FF | #18181B | 6.08:1 | 3:1 |
| dark | enough gauge segment on surface-1 | #34D399 | #121214 | 9.73:1 | 3:1 |
| dark | tight gauge segment on surface-1 | #FBBF24 | #121214 | 11.21:1 | 3:1 |
| dark | short gauge segment on surface-1 | #F97362 | #121214 | 6.82:1 | 3:1 |
| dark | Gauge empty segment (surface-3) vs lit is decorative: state word always shown | #1F1F23 | #121214 | 1.14:1 | 1:1 |
| light | Text on bg | #1C1B19 | #FBFBFA | 16.62:1 | 4.5:1 |
| light | Muted text on bg | #66635D | #FBFBFA | 5.78:1 | 4.5:1 |
| light | Subtle text on bg | #6C6963 | #FBFBFA | 5.28:1 | 4.5:1 |
| light | enough text on bg | #046E50 | #FBFBFA | 6.05:1 | 4.5:1 |
| light | tight text on bg | #9B4708 | #FBFBFA | 6.15:1 | 4.5:1 |
| light | short text on bg | #A9390A | #FBFBFA | 6.19:1 | 4.5:1 |
| light | Text on surface-1 | #1C1B19 | #FFFFFF | 17.21:1 | 4.5:1 |
| light | Muted text on surface-1 | #66635D | #FFFFFF | 5.99:1 | 4.5:1 |
| light | Subtle text on surface-1 | #6C6963 | #FFFFFF | 5.47:1 | 4.5:1 |
| light | enough text on surface-1 | #046E50 | #FFFFFF | 6.27:1 | 4.5:1 |
| light | tight text on surface-1 | #9B4708 | #FFFFFF | 6.37:1 | 4.5:1 |
| light | short text on surface-1 | #A9390A | #FFFFFF | 6.41:1 | 4.5:1 |
| light | Text on surface-2 | #1C1B19 | #F4F3F1 | 15.52:1 | 4.5:1 |
| light | Muted text on surface-2 | #66635D | #F4F3F1 | 5.40:1 | 4.5:1 |
| light | Subtle text on surface-2 | #6C6963 | #F4F3F1 | 4.93:1 | 4.5:1 |
| light | enough text on surface-2 | #046E50 | #F4F3F1 | 5.65:1 | 4.5:1 |
| light | tight text on surface-2 | #9B4708 | #F4F3F1 | 5.74:1 | 4.5:1 |
| light | short text on surface-2 | #A9390A | #F4F3F1 | 5.78:1 | 4.5:1 |
| light | Text on surface-3 | #1C1B19 | #ECEAE6 | 14.32:1 | 4.5:1 |
| light | Muted text on surface-3 | #66635D | #ECEAE6 | 4.98:1 | 4.5:1 |
| light | Subtle text on surface-3 | #6C6963 | #ECEAE6 | 4.55:1 | 4.5:1 |
| light | enough text on surface-3 | #046E50 | #ECEAE6 | 5.22:1 | 4.5:1 |
| light | tight text on surface-3 | #9B4708 | #ECEAE6 | 5.30:1 | 4.5:1 |
| light | short text on surface-3 | #A9390A | #ECEAE6 | 5.33:1 | 4.5:1 |
| light | Accent link on bg | #3755CC | #FBFBFA | 6.08:1 | 4.5:1 |
| light | Accent link on surface-1 | #3755CC | #FFFFFF | 6.30:1 | 4.5:1 |
| light | Accent link on surface-2 | #3755CC | #F4F3F1 | 5.68:1 | 4.5:1 |
| light | Accent text on accent-soft over bg | #3755CC | #E7EAF5 | 5.24:1 | 4.5:1 |
| light | Text on accent-soft over bg | #1C1B19 | #E7EAF5 | 14.33:1 | 4.5:1 |
| light | enough text on enough-soft over bg | #046E50 | #E2EDE9 | 5.23:1 | 4.5:1 |
| light | tight text on tight-soft over bg | #9B4708 | #F1E9E2 | 5.30:1 | 4.5:1 |
| light | short text on short-soft over bg | #A9390A | #F3E8E2 | 5.33:1 | 4.5:1 |
| light | Accent text on accent-soft over surface-1 | #3755CC | #EBEEFA | 5.44:1 | 4.5:1 |
| light | Text on accent-soft over surface-1 | #1C1B19 | #EBEEFA | 14.87:1 | 4.5:1 |
| light | enough text on enough-soft over surface-1 | #046E50 | #E6F1EE | 5.43:1 | 4.5:1 |
| light | tight text on tight-soft over surface-1 | #9B4708 | #F5EDE6 | 5.50:1 | 4.5:1 |
| light | short text on short-soft over surface-1 | #A9390A | #F6EBE7 | 5.48:1 | 4.5:1 |
| light | Accent text on accent-soft over surface-2 | #3755CC | #E1E3ED | 4.92:1 | 4.5:1 |
| light | Text on accent-soft over surface-2 | #1C1B19 | #E1E3ED | 13.45:1 | 4.5:1 |
| light | enough text on enough-soft over surface-2 | #046E50 | #DCE6E1 | 4.91:1 | 4.5:1 |
| light | tight text on tight-soft over surface-2 | #9B4708 | #EBE2DA | 4.98:1 | 4.5:1 |
| light | short text on short-soft over surface-2 | #A9390A | #EDE0DA | 4.97:1 | 4.5:1 |
| light | Accent text on accent-soft over surface-3 | #3755CC | #DADBE3 | 4.57:1 | 4.5:1 |
| light | Text on accent-soft over surface-3 | #1C1B19 | #DADBE3 | 12.48:1 | 4.5:1 |
| light | enough text on enough-soft over surface-3 | #046E50 | #D5DED7 | 4.55:1 | 4.5:1 |
| light | tight text on tight-soft over surface-3 | #9B4708 | #E4DAD0 | 4.62:1 | 4.5:1 |
| light | short text on short-soft over surface-3 | #A9390A | #E5D8D0 | 4.60:1 | 4.5:1 |
| light | Primary pill: background-colour label on text-colour fill | #FBFBFA | #1C1B19 | 16.62:1 | 4.5:1 |
| light | On-accent on accent (mark, selected) | #FFFFFF | #3755CC | 6.30:1 | 4.5:1 |
| light | On-accent on short (destructive button) | #FFFFFF | #A9390A | 6.41:1 | 4.5:1 |
| light | Dimmed headline half (display size) on bg | #66635D | #FBFBFA | 5.78:1 | 3:1 |
| light | Focus ring and handle (accent) on bg | #3755CC | #FBFBFA | 6.08:1 | 3:1 |
| light | Focus ring and handle (accent) on surface-1 | #3755CC | #FFFFFF | 6.30:1 | 3:1 |
| light | Focus ring and handle (accent) on surface-2 | #3755CC | #F4F3F1 | 5.68:1 | 3:1 |
| light | enough gauge segment on surface-1 | #046E50 | #FFFFFF | 6.27:1 | 3:1 |
| light | tight gauge segment on surface-1 | #9B4708 | #FFFFFF | 6.37:1 | 3:1 |
| light | short gauge segment on surface-1 | #A9390A | #FFFFFF | 6.41:1 | 3:1 |
| light | Gauge empty segment (surface-3) vs lit is decorative: state word always shown | #ECEAE6 | #FFFFFF | 1.20:1 | 1:1 |

</details>

## Translations

All 11 official written languages of South Africa: English, Afrikaans, isiNdebele, isiXhosa, isiZulu, Sepedi, Sesotho, Setswana, siSwati, Tshivenda and Xitsonga (`en af nr xh zu nso st tn ss ve ts`). Every file has the same keys. South African Sign Language is also an official language. It cannot be written as text, so it is out of scope for the locale files.

The language picker is a single labelled select showing the native and English name of each language. It says whether a language is still in English, machine translated, or checked by a first-language speaker (`src/i18n/status.json`).

**Machine translation with Google.** `npm run i18n:translate` sends the English strings to the Google Cloud Translation API and writes the results into the locale files. This happens at build time only. The app never calls Google while it runs, so the no-third-party-requests rule still holds.

1. In Google Cloud, create a project, enable the Cloud Translation API, and create an API key restricted to that API. A billing account is required, but the first 500,000 characters each month are free. All 10 languages take about 155,000 characters.
2. Run `GOOGLE_TRANSLATE_API_KEY=your-key npm run i18n:translate` (or name languages, for example `-- zu xh`).
3. Check with `npm run i18n:check` and commit the locale files.

The script protects `{{placeholders}}`, *bold* markers and names such as Tengo and WhatsApp. It keeps the demo chip exactly "Demo | Fictional Data", and replaces any em dash, en dash or exclamation mark the translation brings in. Any string whose placeholders change stays in English. It remembers which English text each translation came from (`src/i18n/translated-from.json`), so only new or changed strings are sent next time. Machine translations still need checking by first-language speakers. Mark a language `reviewed` in `status.json` once that is done.

Dates use `Intl.DateTimeFormat` with a locale map that resolves every language to `en-ZA` for now. Headings switch from Figtree to Inter for Tshivenda (see Brand and type).

## Accessibility

- Every main page passes axe-core WCAG 2.1 A and AA checks in light and dark themes, at 390 and 1280px wide, plus the drawer and command menu (`npm run a11y`).
- A skip link. Route changes move focus to the main content and announce the new page.
- One polite live region announces saves, exports and consent changes, with a matching visual toast.
- Choice rows (filters, money in or out, WhatsApp or SMS) are native radio groups, so arrow keys work.
- The 30 day chart is a native slider with a full spoken value ("Tuesday 20 October, about R1 250, Tight"), plus a "Show numbers" table.
- Dates are read in full and amounts as "money in" or "money out". Decorative gauges and icons are hidden from screen readers. Every state has a word and an icon, not just a colour.
- Drawers trap focus, close on Escape and hide the page behind them. Form errors are shown in text and linked to their fields.
- Visible focus, 44px touch targets, reduced motion respected, contrast checked by script and by axe.

## Premium features

- **What helps most** (Home): for Short or Tight, the smallest extra amount, the daily spending cut, or a bill to move that would lift the cover one level. For Enough, how much could be set aside. Uses the same engine as the date (`src/engine/help.ts`).
- **Where everyday money goes** (Money): last 30 days of spending in plain groups, by simple keyword rules (`src/engine/spending.ts`).
- **Installable and offline**: a small service worker (`public/sw.js`) caches the app after the first visit. It is same-origin only.
- **Motion**: the Safe to spend figure counts up and the date hero animates in. Both respect reduced motion.
- **Phone testing**: `npm run dev:phone` serves the app on your local network.
- **Command menu**: Ctrl or Cmd plus K to jump anywhere, switch person, language or theme.

## Decisions

Choices made where the brief left room:

- **Light colours adjusted.** The redesign brief's proposed light state colours, subtle text and accent failed 4.5:1 on the darker surfaces and on their own soft fills. Each was darkened the smallest amount that passes everywhere.
- **Sidebar collapse.** Collapsing hides labels visually but keeps them for screen readers, with a tooltip on hover.
- **Redesign references.** The redesign brief points at reference screenshots in `assets/reference/`. That folder does not exist, so the style follows the brief's written description only.

- **Asset locations.** The first brief pointed at `docs/BRIEF.md`, `assets/brand/` and `assets/fonts/`. The brief was at the root and the logos came as `tengo-brand-trimmed.zip`. Those logos are now archived (see Brand and type).
- **Spend paths.** The central path uses the median of rolling 7 day spend divided by 7 (not the median single day), so it uses the same basis as the 20th and 80th percentile paths and copes with lumpy spending such as stock runs.
- **What counts as next money.** Deposits of at least 10% of typical monthly income. Smaller daily income (cash fares, card sales) is not "next money". The scrubber still includes it as background income (full rate on the normal and light paths, half on the heavy path).
- **Weekday payouts.** At least 3 qualifying deposits with 60% on one weekday. The latest plausible date is one day after the typical one. Next money is always after today, since anything that landed today is already in the balance.
- **No income pattern found.** Tengo plans 30 days ahead and says so.
- **"Reaches zero".** The first day the end-of-day balance is zero or below. That is the headline date.
- **Headline versus scrubber.** The headline counts only money already in the account. The scrubber assumes income lands as usual, so on a given day it can show Enough while the headline says Short. The scrubber is labelled "If money lands as usual". Its per-day cover is Enough if the heavy path is above zero, Tight if only the normal path is, Short otherwise.
- **Safe to lend.** The largest amount, in R10 steps, that keeps the current cover state. Zero when already Short.
- **Persona balances.** Each persona's balance is picked with the engine so the intended start state holds on any date (tested over 40 consecutive days). Seed data refreshes daily until the user imports or corrects something.
- **Old statements.** A CSV that ends more than 3 days ago has its dates moved forward to end yesterday, with a visible note. Otherwise the 60 day spend window would be empty.
- **Mobile navigation.** The bottom bar has five tabs (Home, Plan, Money, Inbox, Me). Privacy is the shield icon in the top bar and is linked from Me, Inbox and the consent flow. The desktop sidebar has all six.
- **Paused forecast.** With core consent withdrawn, Privacy and Me stay open so people can still see, export or delete their data. Every other page shows "Forecast paused".
- **Picker states.** Persona cards show each persona's designed starting state.
- **Spending groups.** Descriptions are now also used to group everyday spending. The data minimisation panel says so.
- **Premium suggestions.** "What helps most" aims one level up: Short to Tight, Tight to Enough. A bill is only suggested if moving it alone is enough.
- **Message templates.** Template strings live in the locale files under `messages.*`, so the i18n check covers them. `src/messages/templates.ts` composes them.
- **Retention.** The next removal date is the oldest stored transaction plus 12 months.
- **Dark theme.** Built as the stretch goal on the same tokens, selectable in Me.

## Known limitations

- The logo and app icons are placeholders until the founder's new logo is ready.
- Translations stay in English until the translate script is run with a Google API key, and machine translations still need review by first-language speakers.
- The forecast is statistical and simple by design. It does not model seasonality, month-end effects or income that is changing over time.
- Recurring bill detection needs at least two monthly occurrences. A new bill shows as spend until the user recategorises it.
- CSV import handles common South African formats (day first dates, R amounts, debit and credit columns). It does not handle multi-currency files or PDF statements. PDF is shown as "coming next".
- Data lives in one browser's local storage. Clearing site data removes it.
- Icon generation needs Python with Pillow. The generated icons are committed.
- Privacy features are a simulation and have not been reviewed by a lawyer.
