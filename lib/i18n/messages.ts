// All user-facing words, in one place. zh-Hant is the reference dictionary;
// `en` must have exactly the same shape (enforced by the Messages type and by
// tests/i18n.test.ts). Components never hard-code UI text.

import type { AgeParts } from "@/lib/scanner/format";

export const LOCALES = ["zh-Hant", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "zh-Hant";

const zhAge = (p: AgeParts) =>
  p.unit === "s" ? `${p.n} 秒` : p.unit === "m" ? `${p.n} 分鐘` : p.unit === "h" ? `${p.n} 小時 ${p.m} 分` : `${p.n} 天`;
const enAge = (p: AgeParts) =>
  p.unit === "s" ? `${p.n}s` : p.unit === "m" ? `${p.n} min` : p.unit === "h" ? `${p.n}h ${p.m}m` : `${p.n}d`;

const zh = {
  langName: "繁體中文",
  langSwitch: "語言",
  meta: {
    title: "VESTA Scanner — 展示模式",
    description: "VESTA Scanner 公開前端展示：所有市場資料均為模擬資料，不構成投資建議。",
  },
  header: { brand: "VESTA SCANNER", tagline: "Scanner · 展示模式" },
  hero: {
    kicker: "VESTA Scanner · Open Demo",
    title: "Market anomalies, as they happen.",
    subtitle: "全市場異動掃描介面展示：符合下方示範篩選條件的合約，依最新偵測或量能排序，各列 30 名。",
  },
  demo: {
    bannerTitle: "展示模式 — 所有市場資料均為模擬資料",
    bannerTitleEn: "DEMO MODE — Simulated Market Data",
    bannerBody: "本頁不連接任何真實行情或掃描器。幣種名稱僅作版面示意，數值、時間與訊號皆為程式產生的虛構資料，不代表任何市場狀況。",
    simClock: "模擬時間",
    scenario: "情境",
    scenarios: {
      normal: "一般事件",
      high_vr14: "高 VR14",
      stale: "資料過期",
      empty: "無符合事件",
      pending: "結構計算中",
      low_liquidity: "低流動性",
      partial: "部分連線異常",
      invalid: "Schema 驗證失敗",
    },
  },
  status: {
    labels: {
      LIVE: "最新（模擬）",
      CLOCK: "時間不一致",
      DELAYED: "資料延遲",
      STARTING: "掃描器啟動中",
      STALLED: "掃描器停滯",
      ENDED: "掃描器已停止",
      CONNECTIONS: "部分連線異常",
      TICKER: "24H 成交額暫缺",
      INCOMPLETE: "資料不完整",
      OFFLINE: "離線",
    },
    detail: {
      LIVE: (age: string) => `${age}前產生的模擬快照`,
      CLOCK: () => "資料時間晚於目前時間，請確認裝置時鐘；不視為最新資料",
      DELAYED: (age: string) => `最後更新於 ${age}前，超過 3 分鐘未更新，以下為舊資料`,
      STARTING: () => "掃描器啟動中，以下為最後一次已知的訊號",
      STALLED: () => "掃描器停滯，以下為最後一次已知的訊號",
      ENDED: () => "掃描器已停止，以下為最後一次已知的訊號",
      CONNECTIONS: () => "部分行情連線中斷，訊號可能不完整",
      TICKER: () => "暫時無法取得 24H 成交額，無法套用示範篩選條件，列表可能不完整",
      INCOMPLETE: () => "部分資料暫缺，訊號可能不完整",
      OFFLINE: (age: string) => `裝置目前沒有網路連線，以下為 ${age}前的資料；恢復連線後自動更新`,
    },
    lastUpdate: (t: string) => `最後更新 ${t}`,
    fetchFailed: "· 無法取得新資料，顯示上次結果",
    refresh: "立即更新",
    refreshing: "更新中…",
    notLiveNote: "資料超過 3 分鐘未更新、掃描器未運作、連線異常或 24H 成交額暫缺時，本頁不會標示為「最新」。",
  },
  errors: {
    noData: "目前沒有可顯示的掃描資料。",
    schemaTitle: "資料未通過 schema 驗證，已拒絕顯示",
    schemaBody: (n: number, first: string) => `共 ${n} 項錯誤；第一項：${first}。前端只顯示通過 vesta.scan.public.v2 驗證的資料。`,
  },
  filter: {
    rule: (vr: number, qv: string, w: number | null) =>
      `示範篩選（示意值）· VR14 ≥ ${vr}x · 24H ≥ ${qv} USDT · ${w === null ? "整段掃描" : `近 ${w} 分鐘`}`,
    matching: (m: number, shown: number) => `符合 ${m} 個，顯示 ${shown}`,
    scanned: (n: number) => `掃描 ${n} 個合約`,
    connections: (up: number, total: number) => `行情連線 ${up}/${total}`,
    ticker: (t: string) => `24H 成交額更新 ${t}`,
  },
  sort: { label: "排序", group: "排序方式", recent: "最新偵測", volume: "量能（VR14）" },
  empty: {
    ticker: "暫時無法取得 24H 成交額，無法判斷哪些合約符合示範篩選條件。",
    none: "這段時間沒有符合條件的訊號。",
  },
  table: {
    swipe: "左右滑動查看 →",
    region: (sort: string) => `訊號排行（依${sort}）`,
    symbol: "# 幣種",
    event: "事件",
    vr14: "VR14",
    qv1m: "事件 1m 成交額",
    chg1m: "事件 1m 漲跌",
    price: "價格",
    detected: "偵測時間",
    hints: "提示",
    btcRel: "BTC 關係（草案）",
    tvTitle: (s: string) => `在 TradingView 開啟 BINANCE:${s}.P`,
    qv24h: (v: string) => `24H ${v}`,
    times: (n: number) => `· ${n} 次`,
    bar: (t: string) => `${t} 那根`,
    close: (t: string) => `收盤 ${t}`,
    pending: "計算中",
    noData: "資料不足",
    conflict: "週期衝突",
    conflictTitle: (c: string) => `週期衝突（15M／1H／2H）：${c}`,
  },
  event: {
    types: { VOLUME_PRICE: "價量", VOLUME_SPIKE: "爆量", PRICE_SHOCK: "價格急動" } as Record<string, string>,
    directions: { UP: "上漲", DOWN: "下跌" } as Record<string, string>,
    // "價量上漲" (no space) for VOLUME_PRICE, "爆量 上漲" for the others
    label: (code: string, type: string, dir: string) =>
      code === "VOLUME_PRICE" ? type + dir : dir ? `${type} ${dir}` : type,
  },
  bias: { LONG: "偏多", SHORT: "偏空", NEUTRAL: "中性" } as Record<string, string>,
  trend: {
    TREND_UP: "多頭",
    TREND_DOWN: "空頭",
    RANGE: "盤整",
    TRANSITION: "轉換中",
    INSUFFICIENT: "資料不足",
    NO_DATA: "資料不足",
  } as Record<string, string>,
  conflictDir: { UP: "多頭", DOWN: "空頭" } as Record<string, string>,
  conflictSep: "／",
  flags: {
    // only the illustrative flags the mock scenarios use; any other code is shown as-is
    LOW_LIQUIDITY: "流動性不足",
    TICK_COARSE: "價格跳動較粗",
    HISTORY_GAP: "歷史資料有缺口",
    THIN_HISTORY: "歷史 K 線偏少",
    THIN_BASELINE: "量能基準不足",
    NEW_LISTING: "新上市",
    LISTED_UNDER_24H: "上市未滿 24 小時",
  } as Record<string, string>,
  defs: {
    filterTerm: "篩選條件",
    filter: (vr: number, qv: string) =>
      `示範用的示意篩選值（非正式版設定）：事件的 VR14 ≥ ${vr}，且最近 24 小時成交額 ≥ ${qv} USDT；24H 成交額無法取得時不列入。`,
    vr14: "相對成交量：事件那根 1 分鐘成交額相對近期一般成交量的倍數，數值越高代表放量越明顯。",
    qvTerm: "事件 1m 成交額／漲跌",
    qv: "事件那根 1 分鐘 K 線的成交額與漲跌。",
    priceTerm: "價格與 15M／1H／2H 漲跌",
    price: "最後一根已收盤 1 分鐘 K 線的收盤價，相對 15 分鐘、1 小時、2 小時前收盤價的變化。",
    trendTerm: "趨勢",
    trend: "15M／1H／2H 已收盤 K 線的結構狀態（多頭、空頭、盤整、轉換中）；「計算中」表示結構尚未算完。",
    conflictTerm: "週期衝突",
    conflict: "15M、1H、2H 之間有趨勢方向相反。",
    qv24Term: "24H 成交額",
    qv24: "合約最近 24 小時成交額（USDT）。",
    detectedTerm: "偵測時間",
    detected: "掃描器判定該幣種最新一筆符合條件事件的時間。",
    sep: "：",
  },
  corr: {
    toggle: "顯示 BTC 關係原型（草案）",
    bannerTitle: "BTC 關係分類 — 介面原型（vesta.corr.public.v1 草案）",
    bannerBody: "分類為固定的示意值，並非計算結果，也未經任何驗證。僅用於討論未來的介面與資料格式。",
    classes: { BTC_LINKED: "BTC 連動", HIGH_BETA: "高 Beta", INDEPENDENT: "獨立走勢" } as Record<string, string>,
    unclassified: "未分類",
    filterAll: "全部",
  },
  time: {
    age: zhAge,
    ago: (p: AgeParts) => (p.unit === "h" ? `${p.n} 小時前` : `${zhAge(p)}前`),
    tz: (label: string) => `（模擬時間，${label}）`,
  },
  disclaimer:
    "本頁為開源前端的展示版本，所有市場資料均為模擬資料，不構成任何投資建議，也不代表進出場訊號。加密貨幣合約波動劇烈，請自行判斷並承擔風險。",
  offline: { title: "目前離線" },
};

export type Messages = typeof zh;

const en: Messages = {
  langName: "English",
  langSwitch: "Language",
  meta: {
    title: "VESTA Scanner — Demo Mode",
    description: "VESTA Scanner open frontend demo. All market data is simulated; not investment advice.",
  },
  header: { brand: "VESTA SCANNER", tagline: "Scanner · Demo mode" },
  hero: {
    kicker: "VESTA Scanner · Open Demo",
    title: "Market anomalies, as they happen.",
    subtitle:
      "Market-wide anomaly scanner UI demo: contracts that pass the demo filter shown below, sorted by newest detection or volume, top 30 each.",
  },
  demo: {
    bannerTitle: "DEMO MODE — Simulated Market Data",
    bannerTitleEn: "展示模式 — 所有市場資料均為模擬資料",
    bannerBody:
      "This page is not connected to any real market feed or scanner. Symbol names are layout placeholders only; every value, time and signal is generated fiction and says nothing about any market.",
    simClock: "Simulated time",
    scenario: "Scenario",
    scenarios: {
      normal: "Normal events",
      high_vr14: "High VR14",
      stale: "Stale data",
      empty: "No matching events",
      pending: "Structure pending",
      low_liquidity: "Low liquidity",
      partial: "Partial connections",
      invalid: "Schema validation failure",
    },
  },
  status: {
    labels: {
      LIVE: "Fresh (simulated)",
      CLOCK: "Clock mismatch",
      DELAYED: "Delayed",
      STARTING: "Scanner starting",
      STALLED: "Scanner stalled",
      ENDED: "Scanner stopped",
      CONNECTIONS: "Partial connections",
      TICKER: "24H volume unavailable",
      INCOMPLETE: "Incomplete data",
      OFFLINE: "Offline",
    },
    detail: {
      LIVE: (age: string) => `Simulated snapshot generated ${age} ago`,
      CLOCK: () => "Snapshot time is ahead of the current time; check the device clock. Not treated as fresh",
      DELAYED: (age: string) => `Last updated ${age} ago, more than 3 minutes; the data below is old`,
      STARTING: () => "Scanner is starting; showing the last known signals",
      STALLED: () => "Scanner stalled; showing the last known signals",
      ENDED: () => "Scanner stopped; showing the last known signals",
      CONNECTIONS: () => "Some market connections are down; signals may be incomplete",
      TICKER: () => "24H volume is unavailable, so the demo filter cannot be applied; the list may be incomplete",
      INCOMPLETE: () => "Some data is missing; signals may be incomplete",
      OFFLINE: (age: string) => `This device is offline; showing data from ${age} ago. Updates resume when back online`,
    },
    lastUpdate: (t: string) => `Last update ${t}`,
    fetchFailed: "· Could not get new data, showing the last result",
    refresh: "Refresh now",
    refreshing: "Refreshing…",
    notLiveNote:
      "The page is never marked “fresh” when data is older than 3 minutes, the scanner is not running, a connection is down or 24H volume is missing.",
  },
  errors: {
    noData: "No scanner data to show right now.",
    schemaTitle: "Data failed schema validation and was not displayed",
    schemaBody: (n: number, first: string) =>
      `${n} issue(s); first: ${first}. The frontend only shows data that passes vesta.scan.public.v2 validation.`,
  },
  filter: {
    rule: (vr: number, qv: string, w: number | null) =>
      `Demo filter (illustrative) · VR14 ≥ ${vr}x · 24H ≥ ${qv} USDT · ${w === null ? "whole run" : `last ${w} min`}`,
    matching: (m: number, shown: number) => `${m} matching, ${shown} shown`,
    scanned: (n: number) => `${n} contracts scanned`,
    connections: (up: number, total: number) => `Connections ${up}/${total}`,
    ticker: (t: string) => `24H volume at ${t}`,
  },
  sort: { label: "Sort", group: "Sort order", recent: "Newest", volume: "Volume (VR14)" },
  empty: {
    ticker: "24H volume is unavailable, so the demo filter cannot be applied.",
    none: "No matching signals in this window.",
  },
  table: {
    swipe: "Swipe to see more →",
    region: (sort: string) => `Signal ranking (by ${sort})`,
    symbol: "# Symbol",
    event: "Event",
    vr14: "VR14",
    qv1m: "Event 1m volume",
    chg1m: "Event 1m change",
    price: "Price",
    detected: "Detected",
    hints: "Notes",
    btcRel: "BTC relation (draft)",
    tvTitle: (s: string) => `Open BINANCE:${s}.P on TradingView`,
    qv24h: (v: string) => `24H ${v}`,
    times: (n: number) => `· ${n}×`,
    bar: (t: string) => `${t} bar`,
    close: (t: string) => `close ${t}`,
    pending: "pending",
    noData: "no data",
    conflict: "Timeframe conflict",
    conflictTitle: (c: string) => `Timeframe conflict (15M / 1H / 2H): ${c}`,
  },
  event: {
    types: { VOLUME_PRICE: "Volume-price", VOLUME_SPIKE: "Volume spike", PRICE_SHOCK: "Price shock" },
    directions: { UP: "up", DOWN: "down" },
    label: (_code: string, type: string, dir: string) => (dir ? `${type} ${dir}` : type),
  },
  bias: { LONG: "Long bias", SHORT: "Short bias", NEUTRAL: "Neutral" },
  trend: {
    TREND_UP: "Up",
    TREND_DOWN: "Down",
    RANGE: "Range",
    TRANSITION: "Transition",
    INSUFFICIENT: "No data",
    NO_DATA: "No data",
  },
  conflictDir: { UP: "up", DOWN: "down" },
  conflictSep: " / ",
  flags: {
    LOW_LIQUIDITY: "Low liquidity",
    TICK_COARSE: "Coarse tick size",
    HISTORY_GAP: "History gap",
    THIN_HISTORY: "Few history bars",
    THIN_BASELINE: "Thin volume baseline",
    NEW_LISTING: "New listing",
    LISTED_UNDER_24H: "Listed < 24h ago",
  },
  defs: {
    filterTerm: "Filter",
    filter: (vr: number, qv: string) =>
      `Illustrative demo values (not production settings): the event's VR14 ≥ ${vr} and the last-24-hour volume ≥ ${qv} USDT; contracts without known 24H volume are excluded.`,
    vr14: "Relative volume: how many times the event's 1-minute quote volume exceeds the recent typical volume; higher means a stronger volume surge.",
    qvTerm: "Event 1m volume / change",
    qv: "Quote volume and change of the event's 1-minute bar.",
    priceTerm: "Price and 15M / 1H / 2H change",
    price: "Close of the latest closed 1-minute bar, versus the close 15 minutes, 1 hour and 2 hours earlier.",
    trendTerm: "Trend",
    trend: "Structure state of closed 15M / 1H / 2H bars (up, down, range, transition); “pending” means not computed yet.",
    conflictTerm: "Timeframe conflict",
    conflict: "15M, 1H and 2H trends point in opposite directions.",
    qv24Term: "24H volume",
    qv24: "The contract's last-24-hour quote volume (USDT).",
    detectedTerm: "Detected",
    detected: "When the scanner flagged the symbol's newest qualifying event.",
    sep: ": ",
  },
  corr: {
    toggle: "Show BTC relation prototype (draft)",
    bannerTitle: "BTC relation classes — UI prototype (vesta.corr.public.v1 draft)",
    bannerBody:
      "Classes are fixed placeholder values, not computed results, and have not been validated in any way. For discussing a future UI and data format only.",
    classes: { BTC_LINKED: "BTC-Linked", HIGH_BETA: "High-Beta", INDEPENDENT: "Independent" },
    unclassified: "Unclassified",
    filterAll: "All",
  },
  time: {
    age: enAge,
    ago: (p: AgeParts) => `${enAge(p)} ago`,
    tz: (label: string) => ` (simulated time, ${label})`,
  },
  disclaimer:
    "This is a demo of the open-source frontend. All market data is simulated. Nothing here is investment advice or an entry/exit signal. Crypto derivatives are highly volatile; use your own judgment and bear your own risk.",
  offline: { title: "You are offline" },
};

export const MESSAGES: Record<Locale, Messages> = { "zh-Hant": zh, en };

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}
