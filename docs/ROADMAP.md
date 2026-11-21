# Public Roadmap / 公開路線圖

This roadmap covers the public frontend only. It lists directions, not dates; items move as maintainers and contributors have time. Research items are questions to investigate, not promised features.

本路線圖只涵蓋公開前端，列出方向而非時程。研究項目是待探討的問題，不是承諾的功能。

## ✅ Completed / 已完成

| Item | Notes |
|---|---|
| Standalone mock frontend / 獨立的模擬資料前端 | Runs with no backend, credentials or environment variables |
| Bilingual dashboard / 中英雙語儀表板 | `zh-Hant` and `en`, switchable in the UI, one central dictionary |
| PWA demo / PWA 展示 | Installable; isolated scope and caches; offline page instead of stale data |
| Schema validation / Schema 驗證 | Every snapshot is checked against `vesta.scan.public.v2` before display |
| Security scan / 安全掃描 | `npm run scan:security`, also run as a test |
| BTC relationship UI prototype / BTC 關係介面原型 | Placeholder values only; contract `vesta.corr.public.v1` is a draft |

## 🗺️ Planned / 規劃中

| Item | Notes |
|---|---|
| UI accessibility / 無障礙 | Keyboard navigation, screen-reader labels, contrast checks |
| Responsive improvements / 響應式改進 | Card layout for phones as an alternative to the wide table |
| More mock scenarios / 更多模擬情境 | Scanner starting/stopped, clock skew, 24H volume unavailable |
| Additional visualizations / 更多視覺化 | Views built from existing snapshot fields only |
| Community contribution workflow / 社群協作流程 | Discussions, labels, starter issues (see [COMMUNITY.md](COMMUNITY.md)) |

Starter tasks for these items: [GOOD_FIRST_ISSUES.md](GOOD_FIRST_ISSUES.md).

## 🔬 Research / 研究方向

Open questions, discussed in the Quant Research category. Any result would first appear as a written note or a mock-data prototype here.

| Topic | Question |
|---|---|
| BTC-Linked coins / BTC 連動幣種 | Which contracts tend to move with BTC, and how stable is that? |
| High-Beta coins / 高 Beta 幣種 | Which contracts react more strongly than BTC to the same move? |
| Independent movers / 獨立走勢幣種 | Which contracts show behaviour largely unexplained by BTC? |
| Relative strength / 相對強弱 | How to present strength versus BTC without implying a forecast? |
| Correlation regime shift / 相關性狀態轉換 | How to detect and display when a relationship changes? |
| Event performance analysis / 事件後表現分析 | How did comparable past events behave, and how to show uncertainty honestly? |

Background and caveats: [BTC_RELATIONSHIPS.md](BTC_RELATIONSHIPS.md).

## 🚫 Out of scope / 不在範圍內

These are not part of this repository and will not be added to it:

- The production scanner backend and its detection algorithms
- Databases, database credentials and any other service credentials
- Data-ingest and publishing pipelines
- Automated trading systems
- Order placement or any other live trade execution

以下不屬於本儲存庫，也不會加入：正式掃描後端與偵測演算法、資料庫與任何服務憑證、資料寫入與發布管線、自動交易系統、下單或任何即時交易執行。
