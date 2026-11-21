# Security Policy / 安全政策

[English](#english) · [繁體中文](#繁體中文)

---

## English

### Reporting a vulnerability

Please report vulnerabilities **privately**. Do not open a public Issue, Discussion or pull request that describes an unfixed vulnerability.

**Private reporting channel:** GitHub private vulnerability reporting. Open the repository's [Security tab](https://github.com/vestainsight-dotcom/vesta-scanner-web/security) and choose **Report a vulnerability**.

Please include:

- A description of the issue and its impact
- Steps to reproduce, ideally against a local build (`npm run build && npm start`)
- The affected file(s) and commit, if known
- Any suggested fix

We aim to acknowledge reports and keep reporters informed while an issue is assessed and fixed. Because this is a small project, we do not offer a bug bounty or fixed response times.

### Never post secrets

Do not paste credentials, tokens, private keys, private URLs or personal data in Issues, Discussions, pull requests or commit messages, even when reporting a problem. If you find a secret in this repository or its history, report it privately through the channel above.

### Scope

**In scope** — the code and configuration in this repository:

- The frontend (`app/`, `components/`, `lib/`)
- The service worker and PWA files (`public/demo-sw.js`, `public/demo/`)
- The security scan (`scripts/security-scan.mjs`) and the tests
- Build configuration (`next.config.ts`, `package.json`)

Examples: cross-site scripting, unsafe rendering of data, service-worker caching of data it should not store, scope or cache collisions, a secret or private host committed to the repository, a dependency vulnerability that affects this project.

**Out of scope:**

- Production VESTA services, servers, databases, domains and data pipelines. They are not part of this repository.
- Third-party services the demo links to (for example TradingView) and third-party dependencies themselves — report those to their maintainers.
- Findings that require a modified or malicious local build.

### No authorization to test production systems

This policy does **not** authorize testing, scanning, probing or attacking any production VESTA system or any third-party service. Test only against your own local build of this repository.

### Supported versions

There are no versioned releases yet. Security fixes are made on the `main` branch only. When releases begin, this section will list which versions receive fixes.

### Security expectations for contributions

Every pull request is reviewed by a maintainer and must pass `npm run check`, which includes the security scan. The scan fails on secret-shaped strings, connection strings, private network addresses, internal paths and hostnames, deployment-platform hosts, network calls outside the service worker, unapproved dependencies, environment-variable reads other than `NODE_ENV`, and secret or deployment configuration files. Pull requests must not weaken the schema validation, the service-worker caching rules or the scan.

---

## 繁體中文

### 回報漏洞

請以**私下方式**回報漏洞，不要在公開的 Issue、Discussion 或 PR 中描述尚未修復的漏洞。

**私下回報管道：**GitHub private vulnerability reporting。請開啟本儲存庫的 [Security 分頁](https://github.com/vestainsight-dotcom/vesta-scanner-web/security)，選擇「**Report a vulnerability**」。

回報時請附上：問題描述與影響、重現步驟（最好以本機建置 `npm run build && npm start` 重現）、受影響的檔案與 commit（若知道），以及修正建議（若有）。我們會盡力確認收到回報，並在評估與修復期間告知進度。本專案規模小，不提供漏洞賞金，也不承諾固定回應時間。

### 不要張貼 secret

無論是否在回報問題，都不要在 Issue、Discussion、PR 或 commit 訊息中張貼憑證、token、私鑰、私有網址或個人資料。若在本儲存庫或其歷史中發現 secret，請透過上述管道私下回報。

### 範圍

**在範圍內**：本儲存庫的程式碼與設定，包括前端、Service Worker 與 PWA 檔案、安全掃描與測試、建置設定。例如 XSS、不安全的資料呈現、Service Worker 快取了不應保存的資料、scope 或快取名稱衝突、提交了 secret 或私有主機、影響本專案的相依套件漏洞。

**不在範圍內**：VESTA 正式服務、伺服器、資料庫、網域與資料管線（不屬於本儲存庫）；展示所連結的第三方服務（例如 TradingView）與第三方套件本身（請向其維護者回報）；需要修改或惡意建置才能成立的問題。

### 不授權測試正式系統

本政策**不**授權對任何 VESTA 正式系統或第三方服務進行測試、掃描、探測或攻擊。請只針對你自己在本機建置的版本測試。

### 支援版本

目前尚無版本發布，安全修正只在 `main` 分支進行。開始發布版本後，將在此列出接受修正的版本。

### 對貢獻的安全要求

每個 PR 都由維護者審查，且必須通過包含安全掃描的 `npm run check`。PR 不得削弱 schema 驗證、Service Worker 快取規則或安全掃描。
