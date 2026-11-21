# BTC Relationships — Research Notes / BTC 關係研究說明

> **Status: research proposal and UI prototype.** No classification method is implemented or validated in this repository. The demo's classes are **fixed fictional placeholders**.
>
> **狀態：研究提案與介面原型。** 本儲存庫沒有實作或驗證任何分類方法；展示中的分類是**固定的虛構示意值**。

[English](#english) · [繁體中文](#繁體中文)

---

## English

### The three research categories

**BTC-Linked.** Coins whose returns show relatively strong statistical co-movement with BTC over a chosen window — for example, a high correlation of returns.

**High-Beta.** Coins that tend to move more than BTC for a given BTC move, measured by the slope (beta) of their returns against BTC's. High beta can come with high or moderate correlation.

**Independent Movers.** Coins whose recent price behaviour is relatively unexplained by BTC (low correlation over the window). This category needs the most further validation: low correlation can also come from noise, thin trading or a short sample.

### Important caveats

- **Correlation is not causation.** Moving together does not mean one drives the other; both may react to the same market-wide news.
- **High beta does not guarantee future gains.** Sensitivity works in both directions — a high-beta coin can fall faster than BTC.
- **Low correlation does not guarantee an independent upward trend.** "Independent" describes the relationship, not the direction.
- **Classes change over time.** Relationships shift with market regimes; a class is only meaningful together with its window and its date.
- **Window and data choices matter.** Different windows (for example 7, 30 or 90 days), bar sizes and sample periods can give different classes.
- **The current demo uses fictional values.** Classes in `lib/corr/mock.ts` are assigned by a fixed rotation over the placeholder symbol list, not computed from any price data.
- **No validated production classification engine is included** in this repository.

### Draft data contract: `vesta.corr.public.v1`

Defined in [`lib/corr/public-v1-draft.ts`](../lib/corr/public-v1-draft.ts). It is a **draft**: every snapshot must carry `draft: true` until the contract is approved.

| Field | Meaning |
|---|---|
| `schema` | `"vesta.corr.public.v1"` |
| `draft` | Always `true` for now |
| `as_of` | Time the classes refer to (UTC, ISO 8601) |
| `window` | `7d`, `30d` or `90d` |
| `calc_version` | Label of the method that produced the classes; `"placeholder"` in the demo |
| `entries[]` | `{ symbol, class, corr_bucket, beta_bucket }` |
| `class` | `BTC_LINKED`, `HIGH_BETA` or `INDEPENDENT` |
| `corr_bucket`, `beta_bucket` | `LOW`, `MID` or `HIGH` |

Design choices open for discussion:

- Only **coarse buckets** are published, never raw research metrics; unknown fields are rejected.
- `BTCUSDT` is the reference and can never be classified; duplicate symbols are rejected.
- The contract is **separate** from the scanner contract `vesta.scan.public.v2`, which is unchanged. The UI joins the two by `symbol`. A symbol without an entry is shown as "Unclassified".
- The bucket thresholds and the rule that maps buckets to classes are **not defined** yet — they are research questions.

### In the demo

Tick **"Show BTC relation prototype (draft)"** on `/demo`. A labelled banner appears, a "BTC relation (draft)" column is added and the rows can be filtered by class. All of it uses the placeholder data described above.

### Contributing to this topic

Use the [Research proposal issue template](https://github.com/vestainsight-dotcom/vesta-scanner-web/issues/new/choose) (a Quant Research Discussion category is planned, see [COMMUNITY.md](COMMUNITY.md)). Useful contributions: definitions and thresholds with reasoning, validation methods (out-of-sample checks, stability across windows), and UI ideas that communicate uncertainty and change over time.

---

## 繁體中文

### 三個研究分類

**BTC 連動（BTC-Linked）**：在選定視窗內，報酬與 BTC 有相對強的統計共同變動（例如報酬相關係數高）的幣種。

**高 Beta（High-Beta）**：對 BTC 同樣幅度的變動，反應通常更大的幣種，以報酬對 BTC 報酬的斜率（beta）衡量；高 beta 可能伴隨高或中等的相關性。

**獨立走勢（Independent Movers）**：近期價格行為相對無法由 BTC 解釋（視窗內相關性低）的幣種。此分類最需要進一步驗證，因為低相關也可能來自雜訊、成交稀薄或樣本太短。

### 重要提醒

- **相關不代表因果**：同步變動不代表彼此影響，可能只是對同一市場消息的共同反應。
- **高 Beta 不保證未來獲利**：敏感度是雙向的，高 Beta 幣種也可能跌得比 BTC 更快。
- **低相關不保證獨立上漲**：「獨立」描述的是關係，不是方向。
- **分類會隨時間改變**：關係會隨市場狀態轉變，分類必須搭配視窗與日期才有意義。
- **視窗與資料選擇會影響結果**：不同視窗（如 7、30、90 天）、K 線週期與樣本期間可能得到不同分類。
- **目前展示使用虛構值**：`lib/corr/mock.ts` 的分類是依示意幣種清單固定輪替指派，並非由任何價格資料計算。
- **本儲存庫不包含任何經驗證的正式分類引擎。**

### 資料合約草案：`vesta.corr.public.v1`

定義於 [`lib/corr/public-v1-draft.ts`](../lib/corr/public-v1-draft.ts)，目前為**草案**，在核准前每份快照都必須帶有 `draft: true`。欄位：`schema`、`draft`、`as_of`（UTC）、`window`（`7d`／`30d`／`90d`）、`calc_version`（展示中為 `"placeholder"`）、`entries[]`（`symbol`、`class`、`corr_bucket`、`beta_bucket`）。

可討論的設計：只公開**粗略分級**而非原始研究數值、拒絕未知欄位；`BTCUSDT` 作為基準永遠不分類；與掃描合約 `vesta.scan.public.v2` **分開**（v2 不變），介面以 `symbol` 合併，沒有對應資料的幣種顯示為「未分類」；分級門檻與分類規則**尚未定義**，屬於研究問題。

### 在展示中查看

在 `/demo` 勾選「顯示 BTC 關係原型（草案）」，會出現標示橫幅、新增「BTC 關係（草案）」欄位，並可依分類篩選；全部使用上述示意資料。

### 參與這個主題

請使用 **Quant Research** 討論分類或「研究提案」Issue 範本。歡迎提供：有依據的定義與門檻、驗證方法（樣本外檢驗、不同視窗下的穩定性），以及能清楚傳達不確定性與時間變化的介面想法。
