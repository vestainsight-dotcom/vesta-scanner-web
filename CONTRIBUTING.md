# Contributing / 參與貢獻

[English](#english) · [繁體中文](#繁體中文)

---

## English

Thank you for your interest in VESTA Scanner Web. This repository is a **frontend demo that runs on simulated data only**. Contributions that improve the interface, its accessibility, its tests and its documentation, or that sharpen research ideas, are all welcome.

By participating you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

### What you can contribute

| Area | Examples |
|---|---|
| UI / UX | Layout, readability, interaction details |
| Accessibility | Keyboard navigation, screen-reader labels, contrast, reduced motion |
| Internationalization | New languages, better wording, locale-aware formatting |
| PWA | Install experience, offline UX, update flow |
| Data visualization | New views of the existing snapshot fields |
| Mock data and tests | New scenarios, edge cases, more test coverage |
| Documentation | Corrections, clearer explanations, translations |
| Research ideas | Questions and methods, proposed with the [Research proposal issue template](https://github.com/vestainsight-dotcom/vesta-scanner-web/issues/new/choose) |

Starter tasks: [docs/GOOD_FIRST_ISSUES.md](docs/GOOD_FIRST_ISSUES.md).

### Workflow

1. **Propose first for anything major.** [Open an Issue](https://github.com/vestainsight-dotcom/vesta-scanner-web/issues/new/choose) with the Feature request or Research proposal template for new features, new views or research ideas, so the scope is agreed before work starts. Small fixes (typos, obvious bugs) can go straight to a Bug report or a PR. (GitHub Discussions are not enabled yet; see [docs/COMMUNITY.md](docs/COMMUNITY.md).)
2. **Agree on scope** with a maintainer in the Issue.
3. **Start work** once the Issue records the agreed scope.
4. **Fork and branch.** Work in a separate branch, for example `feat/keyboard-nav` or `fix/empty-state-text`. Dependency install scripts are not needed: the project builds and passes its tests with them skipped (npm 11 skips unapproved install scripts by default).
5. **Add or update tests**, then run the full check locally:
   ```bash
   npm install
   npm run check   # typecheck → lint → test → security scan → build
   ```
6. **Open a Pull Request** using the template. Include screenshots for UI changes, in both languages if text changed.
7. **Wait for maintainer review.** External pull requests are never merged or deployed automatically; every change is reviewed by a maintainer, and merging does not by itself deploy anything.

### Project conventions

- **All UI text lives in `lib/i18n/messages.ts`.** Add every new string in both `zh-Hant` and `en`; the tests fail if the two dictionaries differ in shape or if a component contains hard-coded Chinese text.
- **Data only through the adapter.** Components read data from a `ScannerDataAdapter` (`lib/data/adapter.ts`); do not add network requests in components.
- **Mock data must be fictional and deterministic.** New scenarios go in `lib/mock/scenarios.ts`, must pass the public schema (unless the scenario exists to fail it) and must not copy real market data, event logs or responses from any real system.
- **Keep the demo labelling.** Do not remove or weaken the "DEMO MODE — Simulated Market Data" notices or the simulated-time labels.
- **Dependencies:** avoid adding new ones. If one is truly needed, explain why in the PR; the security scan rejects dependencies that are not on its allowlist until a maintainer approves them.

### Schema changes

`lib/schema/public-v2.ts` (`vesta.scan.public.v2`) is the public display contract that every snapshot must pass before the demo shows it, and it **must not be edited in a pull request**. To propose a change, open a Feature request Issue describing the field, its meaning and why it is needed. If accepted, it will become a new schema version, never an in-place edit of v2. The BTC-relationship contract `vesta.corr.public.v1` is a **draft** and is likewise changed only through an agreed Issue.

### What will not be accepted

Pull requests that do any of the following will be closed:

- Add, request or expose credentials, API keys, tokens or other secrets
- Connect to private infrastructure, or add live market-data or production API access that has not been approved
- Add or change data-ingest, publishing or other backend write paths
- Add order placement, account access or any trading-execution functionality
- Weaken the security boundaries: the schema validation, the service-worker caching rules or the security scan
- Present simulated data as real, or present the demo as financial advice
- Use VESTA brand assets in a misleading way (see [docs/BRANDING.md](docs/BRANDING.md))

### Licensing of contributions

This project is licensed under the [Apache License 2.0](LICENSE). Under Section 5 of that license, any contribution you intentionally submit for inclusion is licensed under the same terms, unless you explicitly state otherwise. Only submit work you have the right to contribute.

### Security issues

Do not report vulnerabilities in public Issues or Discussions. See [SECURITY.md](SECURITY.md).

---

## 繁體中文

感謝你對 VESTA Scanner Web 的興趣。本儲存庫是**只使用模擬資料的前端展示**。歡迎改進介面、無障礙、測試與文件，也歡迎讓研究想法更具體的討論。

參與即表示你同意遵守[行為準則](CODE_OF_CONDUCT.md)。

### 可以貢獻的方向

UI／UX、無障礙（鍵盤操作、螢幕閱讀器標籤、對比）、多語系、PWA（安裝與離線體驗）、資料視覺化、模擬資料與測試、文件，以及研究想法（請以 [Research proposal 範本開 Issue](https://github.com/vestainsight-dotcom/vesta-scanner-web/issues/new/choose)）。入門任務見 [docs/GOOD_FIRST_ISSUES.md](docs/GOOD_FIRST_ISSUES.md)。

### 流程

1. **重大想法先提案**：新功能、新視圖或研究想法請以 Feature request 或 Research proposal 範本[開 Issue](https://github.com/vestainsight-dotcom/vesta-scanner-web/issues/new/choose)，先確認範圍；小修正（錯字、明顯 bug）可直接開 Bug report 或 PR。（GitHub Discussions 尚未啟用，見 [docs/COMMUNITY.md](docs/COMMUNITY.md)。）
2. **在 Issue 中與維護者確認範圍。**
3. **範圍確認後再開始開發。**
4. **Fork 並在獨立分支開發**，例如 `feat/keyboard-nav`。建置與測試不需要執行相依套件的安裝腳本（npm 11 預設會略過未核准的安裝腳本，在此情況下仍可建置並通過測試）。
5. **新增或更新測試**，並在本機執行 `npm run check`（型別檢查 → lint → 測試 → 安全掃描 → 建置）。
6. **使用範本提交 Pull Request**；介面變更請附截圖，文字有變動時請附中英兩種語言。
7. **等待維護者審查**。外部 PR 不會自動合併或部署；所有變更都由維護者審查，合併本身也不會觸發任何部署。

### 專案慣例

- **所有介面文字集中在 `lib/i18n/messages.ts`**，新增字串需同時提供 `zh-Hant` 與 `en`；兩份字典結構不一致或元件中出現寫死的中文時，測試會失敗。
- **資料只透過 Adapter 取得**（`lib/data/adapter.ts`），不要在元件中加入網路請求。
- **模擬資料必須虛構且可重現**：新情境放在 `lib/mock/scenarios.ts`，必須通過公開 schema（刻意失敗的情境除外），不得複製真實行情、事件紀錄或任何真實系統的回應。
- **保留展示模式標示**：不得移除或弱化「展示模式 — 所有市場資料均為模擬資料」與模擬時間標示。
- **相依套件**：盡量不新增；確有需要請在 PR 說明，安全掃描會在維護者核准前拒絕不在允許清單內的套件。

### Schema 變更

`lib/schema/public-v2.ts`（`vesta.scan.public.v2`）是公開的顯示合約，每份快照都必須通過它才會顯示，**不得在 PR 中直接修改**。請先開 Feature request Issue 說明欄位、意義與需求；若被接受，將以新版本 schema 發布，而不是修改 v2。BTC 關係合約 `vesta.corr.public.v1` 目前為**草案**，同樣只透過已確認範圍的 Issue 調整。

### 不會接受的貢獻

- 新增、索取或暴露任何憑證、API 金鑰、token 或 secret
- 連線到私有基礎設施，或加入未經核准的即時行情或正式 API 存取
- 新增或修改資料寫入、發布或其他後端寫入路徑
- 加入下單、帳戶存取或任何交易執行功能
- 削弱安全邊界：schema 驗證、Service Worker 快取規則、安全掃描
- 把模擬資料呈現為真實資料，或把展示呈現為投資建議
- 以誤導方式使用 VESTA 品牌素材（見 [docs/BRANDING.md](docs/BRANDING.md)）

### 貢獻的授權

本專案採 [Apache License 2.0](LICENSE)。依該授權第 5 條，除非你明確另行聲明，你有意提交以供納入的貢獻將以相同條款授權。請只提交你有權貢獻的內容。

### 安全問題

請勿在公開的 Issue 或 Discussion 回報漏洞，請見 [SECURITY.md](SECURITY.md)。
