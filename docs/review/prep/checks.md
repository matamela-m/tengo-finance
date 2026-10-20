# Check results

Run on 2026-10-20 12:03 at commit d114497. Node v26.4.0, npm 11.17.0.

## `npm run build`
```
✓ 2060 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                              1.77 kB │ gzip:   0.80 kB
dist/assets/inter-vietnamese-wght-normal-CBcvBZtf.woff2     10.25 kB
dist/assets/figtree-latin-ext-wght-normal-DCwSJGxG.woff2    10.28 kB
dist/assets/inter-greek-ext-wght-normal-DlzME5K_.woff2      11.23 kB
dist/assets/inter-cyrillic-wght-normal-DqGufNeO.woff2       18.75 kB
dist/assets/inter-greek-wght-normal-CkhJZR-_.woff2          19.00 kB
dist/assets/figtree-latin-wght-normal-D_ZTVpCC.woff2        20.16 kB
dist/assets/inter-cyrillic-ext-wght-normal-BOeWTOD4.woff2   25.96 kB
dist/assets/inter-latin-wght-normal-Dx4kXJAl.woff2          48.26 kB
dist/assets/inter-latin-ext-wght-normal-DO1Apj_S.woff2      85.07 kB
dist/assets/index-DGIJMyHN.css                              47.58 kB │ gzip:   9.14 kB
dist/assets/index-BLX9Vxli.js                              695.60 kB │ gzip: 141.85 kB
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 1.76s
exit code: 0
```
## `npm run test`
```
> tengo@0.1.0 test
> node scripts/contrast-check.mjs && vitest run
Contrast: 116 of 116 pairs pass across dark and light.
 RUN  v3.2.7 /Users/matamelamakhado/Documents/development/tengo-finance
 ✓ src/lib/format.test.ts (4 tests) 20ms
 ✓ src/lib/csv.test.ts (9 tests) 9ms
 ✓ src/engine/forecast.test.ts (24 tests) 20ms
 ✓ src/engine/help.test.ts (6 tests) 59ms
 ✓ src/data/localRepository.test.ts (5 tests) 95ms
 ✓ src/messages/templates.test.ts (3 tests) 28ms
 ✓ src/engine/classify.test.ts (7 tests) 8ms
 ✓ src/engine/spending.test.ts (2 tests) 4ms
 ✓ src/data/seed/generate.test.ts (6 tests) 1219ms
   ✓ seed data > Thabo starts in tight on any day  541ms
   ✓ seed data > Lerato starts in enough on any day  355ms
   ✓ seed data > Ayanda starts in short on any day  316ms
 Test Files  9 passed (9)
      Tests  66 passed (66)
   Start at  12:04:01
   Duration  1.54s (transform 383ms, setup 0ms, collect 889ms, tests 1.46s, environment 1ms, prepare 535ms)
exit code: 0
```
## `npm run lint`
```
> tengo@0.1.0 lint
> eslint . && node scripts/check-dashes.mjs
No em or en dashes found.
exit code: 0
```
## `npm run i18n:check`
```
> tengo@0.1.0 i18n:check
> node scripts/i18n-check.mjs
All 11 locales have the same 565 keys.
exit code: 0
```
## `npm run fonts:check`
```
> tengo@0.1.0 fonts:check
> node scripts/fonts-check.mjs
Fonts cover every locale string. Inter: 1623 characters, Figtree: 348.
exit code: 0
```
## `npm run contrast`
```
> tengo@0.1.0 contrast
> node scripts/contrast-check.mjs
Contrast: 116 of 116 pairs pass across dark and light.
exit code: 0
```
