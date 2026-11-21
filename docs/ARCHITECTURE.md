# Architecture / 架構

This document describes the public frontend in this repository only. The production VESTA Scanner backend is a separate, private system and is not described here.

本文件只說明本儲存庫中的公開前端；VESTA Scanner 正式後端為獨立私有系統，不在此說明。

## Overview / 總覽

```
┌──────────────────────────── Browser ────────────────────────────┐
│                                                                  │
│  /demo  (app/demo/page.tsx — statically rendered Next.js page)   │
│    └─ DemoApp  (components/demo-app.tsx)                         │
│         ├─ I18nProvider ─────────── lib/i18n/context.tsx         │
│         │     └─ dictionaries ───── lib/i18n/messages.ts         │
│         ├─ LanguageSwitcher                                      │
│         └─ ScannerBoard  (components/scanner-board.tsx)          │
│               │  on load, every 30 s, on refresh,                │
│               │  on reconnect, on scenario change                │
│               ▼                                                  │
│         ScannerDataAdapter ──────── lib/data/adapter.ts          │
│               │  (only implementation: mock)                     │
│               ▼                                                  │
│         Mock adapter ────────────── lib/data/mock-adapter.ts     │
│           ├─ simulated clock ────── lib/data/sim-clock.ts        │
│           ├─ scenario generator ─── lib/mock/scenarios.ts        │
│           └─ schema validation ──── lib/schema/public-v2.ts      │
│                 valid → shown   ·   invalid → rejected           │
│                                                                  │
│  Optional prototype: lib/corr/{public-v1-draft,mock}.ts          │
│  Service worker: public/demo-sw.js (scope /demo, static only)    │
└──────────────────────────────────────────────────────────────────┘
         No backend · no database · no credentials · no live data
```

## Components / 組成

### Next.js frontend
- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4.
- One page, `/demo`, statically rendered. `/` redirects to `/demo` (`next.config.ts`).
- The first render uses the default scenario at a fixed simulated time, so the server HTML and the first browser render are identical; the browser then takes over the simulated clock.

### UI components (`components/`)
- `demo-app.tsx` — page shell: header, language switcher, hero text, disclaimer.
- `scanner-board.tsx` — demo banner, scenario picker, status banner, filter line, sort buttons, BTC-relationship prototype toggle, the ranked table and the definitions list. Visual design matches the VESTA Scanner dashboard.

### i18n (`lib/i18n/`)
- `messages.ts` holds every user-facing string for `zh-Hant` (default) and `en`. The `en` dictionary is type-checked against `zh-Hant`, and tests check that both have the same shape and that components contain no hard-coded Chinese text.
- `context.tsx` provides the current locale. The choice comes from `?lang=` or is remembered in the browser's `localStorage`; the page works without storage.
- Logic modules return codes (for example freshness reasons); the UI turns codes into words.

### Data adapter (`lib/data/`)
- `adapter.ts` defines `ScannerDataAdapter.getLatest()` and `SchemaValidationError`. It also reserves the *shape* of a future read-only HTTP adapter (`HttpAdapterConfig`) — interface only, not implemented.
- `mock-adapter.ts` builds the snapshot for the selected scenario at the simulated time and validates it before returning it.
- `sim-clock.ts` starts at the fictional moment **2030-01-01 09:00:00 UTC+8** when the page loads and advances in real time. Every time on screen is labelled as simulated.

### Mock scenarios (`lib/mock/scenarios.ts`)
Deterministic functions of the simulated time, based on 36 placeholder symbols:

| Scenario | Shows |
|---|---|
| `normal` | Typical board; one row with structure still pending, some data-quality flags |
| `high_vr14` | Volume ranking led by events with VR14 above 100× |
| `stale` | Snapshot 10 minutes old → "Delayed" state, dimmed table |
| `empty` | No matching events |
| `pending` | Most rows still computing trend structure |
| `low_liquidity` | Thin-market flags; 24H volume close to the demo's 24H filter |
| `partial` | 2 of 3 market connections up → "Partial" state |
| `invalid` | Breaks the schema on purpose → rejected, error shown instead of data |

### Public schema validation (`lib/schema/public-v2.ts`)
- `vesta.scan.public.v2`, written with Zod. All objects are strict (unknown keys rejected), all values bounded.
- Cross-field rules: every row meets the display filters the snapshot itself declares (VR14 ≥ `vr14_min`, known 24H volume ≥ `min_qv_24h_usdt`), 24H volume is fresh, rankings are correctly ordered and every row is ranked.
- Freshness (`lib/scanner/freshness.ts`) is recomputed from `generated_ms` against the reader's clock, so old data is never shown as fresh: older than 180 s → Delayed; scanner not running → Stopped; connections down or 24H volume unavailable → Partial.

### PWA (`public/`)
- `public/demo/manifest.webmanifest` — `id`, `start_url` and `scope` are all `/demo`; standalone display.
- `public/demo-sw.js` — registered only in production builds, scope `/demo`, cache names prefixed `scanner-web-demo-`. It caches only content-hashed build assets (`/_next/static/`), the icons, the manifest and the offline page. It never caches page HTML, `/api/` paths, non-GET requests or cross-origin requests. A failed navigation shows `public/demo/offline.html`, which contains no market data.
- On activation the worker deletes only its own old caches; it never touches caches of other apps on the same origin.

### Tests (`tests/`)
Node.js built-in test runner, no extra dependencies (`tests/register.mjs` resolves the `@/` alias):

| File | Covers |
|---|---|
| `schema.test.ts` | Contract rules, using synthetic snapshots only |
| `mock-adapter.test.ts` | Determinism, simulated clock, every scenario, freshness states |
| `i18n.test.ts` | Dictionary parity, coverage of all codes, no hard-coded UI text |
| `pwa.test.ts` | Manifest, icons, isolation, service-worker caching in a sandbox |
| `corr.test.ts` | Draft contract, placeholder data, reference symbol rule |
| `security.test.ts` | The security scan passes here and catches planted problems |

### Security isolation / 安全隔離
- No network requests in application code; the only code that issues requests is the service worker, for same-origin static files.
- No environment variables except `NODE_ENV`; no secrets are needed or read.
- `scripts/security-scan.mjs` (also run by `npm test` and `npm run check`) fails on secret-shaped strings, connection strings, private network addresses, internal paths and hostnames, deployment-platform hosts, trading-execution endpoints, network calls outside the service worker, unapproved dependencies, secret or deployment configuration files, and a tracked or un-ignored local rules file. Contributors' clones (with a remote and their own commit identity) pass. The maintainer-only pre-push option `--maintainer` additionally fails on non-noreply commit identities, a non-noreply repo-local `user.email`, or credentials embedded in a remote URL. With `--build` it also scans the built client bundle (and fails on source maps). It reports file, line and rule name, never the matched text.
- The scanner's rules are generic. Maintainers may keep extra, environment-specific deny terms in an optional local file, `security.local.json` (`{ "terms": [...], "forbiddenPaths": [...] }`). That file is git-ignored, never scanned or printed, and the scan fails if it is tracked or not ignored. A fresh checkout passes without it; `--no-local` forces generic-only mode.
- Next.js Image Optimization is disabled (`images: { unoptimized: true }`), so `/_next/image` is not served and no native image library is loaded at runtime.
- No deployment configuration is included.

## Data flow in one sentence / 一句話說明資料流

Scenario generator → schema validation → freshness check → UI words from the dictionary → table. Nothing leaves the browser.

情境產生器 → schema 驗證 → 新鮮度判斷 → 字典轉換文字 → 表格。所有資料都不會離開瀏覽器。
