# Dependency audit, bundle and licences

Run on 2026-10-20 at commit d114497.

## npm audit (all dependencies)
```
fix available via `npm audit fix --force`
Will install vitest@5.0.5, which is a breaking change
node_modules/@vitest/mocker
  vitest  0.0.95 - 4.1.10
  Depends on vulnerable versions of @vitest/mocker
  Depends on vulnerable versions of tinypool
  node_modules/vitest
braces  *
Severity: high
braces vulnerable to stack-exhaustion denial of service through deeply nested patterns - https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
fix available via `npm audit fix --force`
Will install tailwindcss@4.3.3, which is a breaking change
node_modules/braces
  chokidar  2.0.0 - 3.6.0
  Depends on vulnerable versions of braces
  node_modules/chokidar
    tailwindcss  <=0.0.0-oxide-insiders.ff2c25f || 0.5.0 - 3.4.19
    Depends on vulnerable versions of chokidar
    Depends on vulnerable versions of fast-glob
    Depends on vulnerable versions of micromatch
    Depends on vulnerable versions of postcss-nested
    Depends on vulnerable versions of postcss-selector-parser
    node_modules/tailwindcss
  micromatch  >=0.2.0
  Depends on vulnerable versions of braces
  node_modules/micromatch
    fast-glob  *
    Depends on vulnerable versions of micromatch
    node_modules/fast-glob
postcss-selector-parser  <7.1.6
Severity: moderate
PostCSS: Quadratic complexity in flat selector parsing allows CPU exhaustion - https://github.com/advisories/GHSA-rj75-hqrm-r3gf
fix available via `npm audit fix --force`
Will install tailwindcss@4.3.3, which is a breaking change
node_modules/postcss-selector-parser
  postcss-nested  2.0.3 - 6.2.0
  Depends on vulnerable versions of postcss-selector-parser
  node_modules/postcss-nested
react-router  6.0.0 - 7.17.0
Severity: moderate
React Router: Open redirect via backslash in <Link> and useNavigate (CVE-2025-68470 bypass) - https://github.com/advisories/GHSA-wrjc-x8rr-h8h6
React Router: Arbitrary Constructor Injection via deserializeErrors() in React Router SSR Hydration - https://github.com/advisories/GHSA-337j-9hxr-rhxg
fix available via `npm audit fix --force`
Will install react-router-dom@7.18.4, which is a breaking change
node_modules/react-router
  react-router-dom  6.0.0-alpha.0 - 7.17.0
  Depends on vulnerable versions of react-router
  node_modules/react-router-dom
tinypool  <=2.1.1
Severity: critical
Tinypool: Prototype Pollution gadget in worker options leads to Remote Code Execution - https://github.com/advisories/GHSA-5gmw-xhrv-c9v3
Tinypool: Prototype Pollution Gadget to RCE in run() options - https://github.com/advisories/GHSA-85c8-ppgw-ccpr
fix available via `npm audit fix --force`
Will install vitest@5.0.5, which is a breaking change
node_modules/tinypool
12 vulnerabilities (5 moderate, 5 high, 2 critical)
To address issues that do not require attention, run:
  npm audit fix
To address all issues (including breaking changes), run:
  npm audit fix --force
```
## npm audit --omit=dev (shipped to users)
```
# npm audit report
react-router  6.0.0 - 7.17.0
Severity: moderate
React Router: Open redirect via backslash in <Link> and useNavigate (CVE-2025-68470 bypass) - https://github.com/advisories/GHSA-wrjc-x8rr-h8h6
React Router: Arbitrary Constructor Injection via deserializeErrors() in React Router SSR Hydration - https://github.com/advisories/GHSA-337j-9hxr-rhxg
fix available via `npm audit fix --force`
Will install react-router-dom@7.18.4, which is a breaking change
node_modules/react-router
  react-router-dom  6.0.0-alpha.0 - 7.17.0
  Depends on vulnerable versions of react-router
  node_modules/react-router-dom
2 moderate severity vulnerabilities
To address all issues (including breaking changes), run:
  npm audit fix --force
```
## Production bundle (dist/assets)

| File | Raw bytes | Gzip bytes |
| --- | --- | --- |
| figtree-latin-ext-wght-normal-DCwSJGxG.woff2 | 10280 | 10348 |
| figtree-latin-wght-normal-D_ZTVpCC.woff2 | 20156 | 20168 |
| index-BLX9Vxli.js | 695602 | 141864 |
| index-DGIJMyHN.css | 47578 | 9155 |
| inter-cyrillic-ext-wght-normal-BOeWTOD4.woff2 | 25960 | 26034 |
| inter-cyrillic-wght-normal-DqGufNeO.woff2 | 18748 | 18818 |
| inter-greek-ext-wght-normal-DlzME5K_.woff2 | 11232 | 11276 |
| inter-greek-wght-normal-CkhJZR-_.woff2 | 18996 | 19063 |
| inter-latin-ext-wght-normal-DO1Apj_S.woff2 | 85068 | 85152 |
| inter-latin-wght-normal-Dx4kXJAl.woff2 | 48256 | 48288 |
| inter-vietnamese-wght-normal-CBcvBZtf.woff2 | 10252 | 10319 |

Locale files are bundled into the main JS: 336600 bytes of JSON across 11 files.

## Licences (production dependencies)
```
├─ MIT: 18
├─ OFL-1.1: 2
├─ ISC: 1
├─ UNLICENSED: 1
└─ Apache-2.0: 1

```
UNLICENSED is the private tengo package itself.
