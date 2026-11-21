# Good First Issues (proposals) / 入門任務提案

> These are **drafts**. They will be opened as GitHub Issues after the repository is published. Every task works on mock data only and must pass `npm run check`.
>
> 以下為**草稿**，將在儲存庫公開後建立為 GitHub Issues。所有任務只使用模擬資料，且必須通過 `npm run check`。

---

## 1. Improve keyboard navigation and accessibility / 改善鍵盤操作與無障礙

**Description.** The board can be used with a mouse, but keyboard and screen-reader use has not been reviewed. Check tab order, visible focus styles, labels of the scenario, sort and language buttons, and how the table is announced.

**Expected result.** The whole page can be used with the keyboard alone, with a visible focus indicator, and screen readers announce controls and the table sensibly in both languages.

- **Difficulty:** Easy–Medium
- **Labels:** `good first issue`, `a11y`, `ui`
- **Acceptance criteria:**
  - [ ] Every interactive element is reachable with Tab and shows a visible focus style
  - [ ] Pressed state of scenario, sort and language buttons is announced
  - [ ] Any new labels exist in `zh-Hant` and `en`
  - [ ] A short note in the PR lists what was checked and with which screen reader

## 2. Add more mock scenarios / 新增模擬情境

**Description.** Add scenarios for states the UI already supports but no scenario shows yet: scanner `STARTING`, scanner `ENDED`, 24H volume unavailable (`ticker_state` not `OK`), and a snapshot from the future (clock skew).

**Expected result.** Each new scenario appears in the scenario picker and shows the matching status banner.

- **Difficulty:** Easy
- **Labels:** `good first issue`, `mock-data`
- **Acceptance criteria:**
  - [ ] Scenarios added in `lib/mock/scenarios.ts` and named in both dictionaries
  - [ ] Each passes the public schema (or, if meant to fail, is rejected)
  - [ ] Tests in `tests/mock-adapter.test.ts` assert the expected freshness level
  - [ ] Values are fictional and deterministic

## 3. Mobile card layout / 手機卡片版面

**Description.** On phones the wide table scrolls sideways. Offer a card layout for narrow screens that shows the most important fields of each row.

**Expected result.** Below a chosen breakpoint, rows are shown as cards without horizontal page scroll; the table remains for wider screens.

- **Difficulty:** Medium
- **Labels:** `good first issue`, `ui`
- **Acceptance criteria:**
  - [ ] No horizontal page scroll at 390 px width
  - [ ] Cards show symbol, event, VR14, price change and detection time
  - [ ] Works for the `empty`, `pending` and `stale` scenarios
  - [ ] Screenshots in both languages in the PR

## 4. CSV export of simulated events / 匯出模擬事件 CSV

**Description.** Add a button that downloads the currently shown rows as a CSV file, generated in the browser.

**Expected result.** The file contains the visible rows in the current sort order, and its name and first line state that the data is simulated.

- **Difficulty:** Easy–Medium
- **Labels:** `good first issue`, `ui`
- **Acceptance criteria:**
  - [ ] No network request and no new dependency
  - [ ] Values containing commas or quotes are escaped correctly (with a unit test)
  - [ ] The export is clearly labelled as simulated data
  - [ ] Button text exists in both languages

## 5. Dark theme support / 深色主題

**Description.** The demo has a light theme only. Add a dark theme that follows the system setting, using the existing colour variables in `app/globals.css`.

**Expected result.** With the system in dark mode, the page, the status colours and the offline page are readable and keep sufficient contrast.

- **Difficulty:** Medium
- **Labels:** `good first issue`, `ui`, `a11y`
- **Acceptance criteria:**
  - [ ] Colours defined as variables, with a dark-mode override
  - [ ] Up/down and status colours keep sufficient contrast in both themes
  - [ ] Manifest and offline page reviewed for both themes
  - [ ] Screenshots of both themes in the PR

## 6. Add another language / 新增語言

**Description.** Add a third UI language (for example Simplified Chinese or Japanese).

**Expected result.** The new language appears in the language switcher and every UI string is translated.

- **Difficulty:** Easy
- **Labels:** `good first issue`, `i18n`
- **Acceptance criteria:**
  - [ ] Locale added to `LOCALES` and a full dictionary in `lib/i18n/messages.ts`
  - [ ] `tests/i18n.test.ts` passes, extended to the new locale where needed
  - [ ] The "DEMO MODE — Simulated Market Data" notice is present
  - [ ] Translation reviewed by a second speaker, if possible

## 7. Improve dashboard filters / 改善儀表板篩選

**Description.** Today the board offers two sort orders and, with the prototype on, a BTC-relationship filter. Add client-side filters, for example by event type (`VOLUME_PRICE`, `VOLUME_SPIKE`, `PRICE_SHOCK`) or by direction.

**Expected result.** Filters narrow the visible rows; the "matching / shown" line stays correct.

- **Difficulty:** Easy–Medium
- **Labels:** `good first issue`, `ui`
- **Acceptance criteria:**
  - [ ] Filters work with both sort orders and every scenario
  - [ ] An empty result shows a clear message
  - [ ] Filter state can be reset in one click
  - [ ] Labels in both languages

## 8. PWA accessibility and offline UX / PWA 無障礙與離線體驗

**Description.** Review the install and offline experience: the offline page's language and contrast, the in-page offline banner, and what happens when the app comes back online.

**Expected result.** Offline and reconnect states are clear, accessible and bilingual, and still never show stale data as fresh.

- **Difficulty:** Medium
- **Labels:** `good first issue`, `pwa`, `a11y`
- **Acceptance criteria:**
  - [ ] Offline page passes a basic contrast and screen-reader check
  - [ ] Behaviour verified with `npm run build && npm start`, including after the server stops
  - [ ] `tests/pwa.test.ts` still passes; caching rules unchanged unless discussed first
