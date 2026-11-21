# Third-Party Software / 第三方軟體

This repository contains no vendored third-party source code. Dependencies are installed by npm from the public npm registry and keep their own licenses. The table lists the direct dependencies declared in `package.json` and the licenses recorded in their package metadata at the time of writing (2026-11-19).

本儲存庫不包含任何第三方原始碼副本。相依套件由 npm 從公開 registry 安裝，各自保有原授權。下表列出 `package.json` 的直接相依套件與其套件資料中記載的授權（2026-11-19）。

| Package | Used for | License |
|---|---|---|
| `next` | Web framework | MIT |
| `react`, `react-dom` | UI library | MIT |
| `zod` | Schema validation | MIT |
| `tailwindcss`, `@tailwindcss/postcss` | Styling (build time) | MIT |
| `typescript` | Type checking (dev) | Apache-2.0 |
| `eslint`, `eslint-config-next` | Linting (dev) | MIT |
| `@types/node`, `@types/react`, `@types/react-dom` | Type definitions (dev) | MIT |

Transitive production dependencies, as resolved by `npm query .prod`, are under MIT, Apache-2.0, ISC, BSD-3-Clause, 0BSD and CC-BY-4.0 (`caniuse-lite`, browser-support data). Development-only tooling (linting, type checking) also includes packages under other permissive licenses, such as BlueOak-1.0.0.

### Image-processing binary (LGPL)

`next` declares `sharp` as an optional dependency. On install, npm downloads a platform-specific `sharp` package and its native library `@img/sharp-libvips-*`, which is licensed under **LGPL-3.0-or-later**. In this project:

- it is **not stored in this repository** and **not included in the browser bundle**;
- it is **still installed** into `node_modules` by `npm install` on supported platforms;
- the demo **disables Next.js Image Optimization** (`images: { unoptimized: true }` in `next.config.ts`), so `next start` does not serve the `/_next/image` optimizer and does not load this library at runtime.

Anyone who redistributes an installed copy of this project together with its `node_modules` (for example in a container image) also redistributes that library and should follow the LGPL-3.0 terms for it.

### 影像處理二進位檔（LGPL）

`next` 將 `sharp` 列為選用相依套件；`npm install` 會在支援的平台下載 `sharp` 與其原生函式庫 `@img/sharp-libvips-*`（**LGPL-3.0-or-later**）。本專案中：它**不在本儲存庫內**、**不會進入瀏覽器 bundle**，但**仍會被安裝**到 `node_modules`；展示已**停用 Next.js 影像最佳化**（`next.config.ts` 中的 `images: { unoptimized: true }`），因此 `next start` 不提供 `/_next/image`，執行時也不會載入此函式庫。若連同 `node_modules` 一起再散布（例如容器映像），也就一併散布了該函式庫，需遵守其 LGPL-3.0 條款。

## Fonts

The UI uses the **Geist** and **Geist Mono** typefaces, loaded through `next/font/google`. They are downloaded from Google Fonts at build time and served with the built site. Geist is licensed under the SIL Open Font License 1.1. No font files are stored in this repository.

## External links

Symbol names in the board link to the third-party charting site TradingView. The demo sends no data to it and loads nothing from it; the link opens only when a user clicks it.

## Checking licenses yourself

```bash
npm query ".prod" --json
```
