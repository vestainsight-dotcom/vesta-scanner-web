// Synthetic, deterministic scanner snapshots for the demo. Every number is made
// up by the formulas below; symbol names are layout placeholders only. Nothing
// here comes from a real scanner, market feed or event log.
//
// Each scenario is a pure function of the simulated clock (lib/data/sim-clock.ts),
// so the same simulated time always yields the same snapshot.

import { PUBLIC_SCHEMA, TOP_N, type PublicRow, type PublicSnapshot } from "@/lib/schema/public-v2";

export const SCENARIOS = [
  "normal",
  "high_vr14",
  "stale",
  "empty",
  "pending",
  "low_liquidity",
  "partial",
  "invalid",
] as const;
export type Scenario = (typeof SCENARIOS)[number];
export const DEFAULT_SCENARIO: Scenario = "normal";
export const STALE_AGE_S = 600;
// Fictional scanner-health figures shown in the filter line.
export const MOCK_SYMBOLS_SCANNED = 480;
export const MOCK_CONNECTIONS = 3;

export const isScenario = (v: unknown): v is Scenario =>
  typeof v === "string" && (SCENARIOS as readonly string[]).includes(v);

export const MOCK_SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "DOGEUSDT", "BNBUSDT", "ADAUSDT", "LINKUSDT", "AVAXUSDT", "LTCUSDT",
  "DOTUSDT", "TRXUSDT", "SUIUSDT", "APTUSDT", "ARBUSDT", "OPUSDT", "NEARUSDT", "ATOMUSDT", "FILUSDT", "INJUSDT",
  "TIAUSDT", "SEIUSDT", "WLDUSDT", "ORDIUSDT", "1000PEPEUSDT", "1000BONKUSDT", "WIFUSDT", "ENAUSDT", "JUPUSDT",
  "PYTHUSDT", "STRKUSDT", "ONDOUSDT", "TAOUSDT", "RENDERUSDT", "FETUSDT", "AAVEUSDT",
];
const TYPES = ["VOLUME_PRICE", "PRICE_SHOCK", "VOLUME_SPIKE"] as const;
const TRENDS = ["TREND_UP", "TREND_DOWN", "RANGE", "TRANSITION"] as const;
const DATA_FLAGS = [[], ["LOW_LIQUIDITY"], [], ["HISTORY_GAP"], ["TICK_COARSE"], []];
const THIN_FLAGS = [["LOW_LIQUIDITY"], ["THIN_BASELINE"], ["LOW_LIQUIDITY", "TICK_COARSE"], ["THIN_HISTORY"]];

const isoS = (ms: number) => new Date(Math.floor(ms / 1000) * 1000).toISOString().replace(".000Z", "Z");
const minute = (ms: number) => Math.floor(ms / 60_000) * 60_000;
const r4 = (x: number) => Math.round(x * 10_000) / 10_000;
const r2 = (x: number) => Math.round(x * 100) / 100;

interface RowOpts {
  pending: (i: number) => boolean;
  vr14: (i: number) => number;
  qv24: (i: number) => number;
  flags: (i: number) => string[];
  warnings: (i: number) => string[];
}

const NORMAL: RowOpts = {
  pending: (i) => i === 4,
  vr14: (i) => r4(5.2 + ((i * 37) % 41) * 1.7),
  qv24: (i) => r2(900_000_000 / (i + 1)),
  flags: (i) => DATA_FLAGS[i % DATA_FLAGS.length],
  warnings: (i) => (i === 7 ? ["NEW_LISTING"] : []),
};

function row(symbol: string, i: number, gen: number, o: RowOpts): PublicRow {
  const close = minute(gen);
  const up = i % 3 !== 1;
  const detected = gen - (i * 97_000 + 3_100); // strictly older down the list
  const pending = o.pending(i);
  const t15 = TRENDS[i % 4];
  const t1h = TRENDS[(i + 1) % 4];
  const conflict = i === 2 ? "2H_UP_15M_DOWN" : null;
  return {
    symbol,
    detected_at: isoS(detected),
    first_detected_at: isoS(detected - (i % 4) * 240_000),
    event_count: 1 + (i % 4),
    types: i % 4 === 3 ? ["PRICE_SHOCK", "VOLUME_PRICE"] : [TYPES[i % 3]],
    event: {
      type: TYPES[i % 3],
      direction: up ? "UP" : "DOWN",
      bias: up ? "LONG" : "SHORT",
      minute_at: isoS(minute(detected) - 60_000),
      vr14: o.vr14(i),
      quote_volume_1m_usdt: r2(2_500_000 / (i + 1)),
      change_1m_pct: r4((up ? 1 : -1) * (0.4 + ((i * 13) % 17) / 10)),
    },
    price: {
      last_close: Math.round((120_000 / (i + 1) ** 2.2) * 1e6) / 1e6,
      close_at: isoS(close),
      change_15m_pct: r4((up ? 1 : -1) * (0.8 + (i % 5) * 0.3)),
      change_1h_pct: r4((up ? 1 : -1) * (1.5 + (i % 7) * 0.4)),
      change_2h_pct: r4((i % 2 ? -1 : 1) * (2.1 + (i % 3) * 0.5)),
    },
    trends: pending ? null : { "15m": conflict ? "TREND_DOWN" : t15, "1h": t1h, "2h": conflict ? "TREND_UP" : t1h },
    structure_pending: pending,
    conflict: pending ? null : conflict,
    aligned: pending ? null : false,
    data_flags: o.flags(i),
    qv_24h: { state: "OK", usdt: o.qv24(i), at: isoS(close - 2_000) },
    liquidity_warnings: o.warnings(i),
  };
}

/** Rankings and the row union, ordered exactly as the schema requires. */
function assemble(all: PublicRow[], gen: number, over: Partial<PublicSnapshot> = {}): PublicSnapshot {
  const detectedMs = (r: PublicRow) => (r.detected_at ? Date.parse(r.detected_at) : -Infinity);
  const recent = [...all]
    .sort((a, b) => detectedMs(b) - detectedMs(a) || a.symbol.localeCompare(b.symbol))
    .slice(0, TOP_N)
    .map((r) => r.symbol);
  const volume = [...all]
    .sort((a, b) => (b.event.vr14 ?? 0) - (a.event.vr14 ?? 0) || a.symbol.localeCompare(b.symbol))
    .slice(0, TOP_N)
    .map((r) => r.symbol);
  const used = new Set([...recent, ...volume]);
  return {
    schema: PUBLIC_SCHEMA,
    status: "ok",
    generated_at: isoS(gen),
    generated_ms: Math.floor(gen / 1000) * 1000,
    scanner: {
      state: "RUNNING",
      last_decision_at: isoS(gen - 3_000),
      lag_s: 3.1,
      // fictional values, chosen not to resemble any real deployment
      connections_up: MOCK_CONNECTIONS,
      connections_total: MOCK_CONNECTIONS,
      symbols_scanned: MOCK_SYMBOLS_SCANNED,
    },
    // synthetic, illustrative display-filter values for the demo only; they are not
    // authoritative production settings. The mock rows are generated to satisfy them.
    filters: { tab: "main", window_minutes: 240, vr14_min: 5, min_qv_24h_usdt: 2_000_000 },
    volume_feed: { ticker_state: "OK", ticker_fetched_at: isoS(gen - 20_000) },
    matching: all.length + 106,
    rankings: { recent, volume },
    rows: all.filter((r) => used.has(r.symbol)),
    ...over,
  };
}

const rows = (gen: number, o: RowOpts = NORMAL) => MOCK_SYMBOLS.map((s, i) => row(s, i, gen, o));

/**
 * Snapshot for a scenario at simulated time `simNowMs`. Typed `unknown` on
 * purpose: callers must validate it (the "invalid" scenario is meant to fail).
 */
export function scenarioSnapshot(scenario: Scenario, simNowMs: number): unknown {
  const gen = Math.floor(simNowMs / 1000) * 1000;
  switch (scenario) {
    case "normal":
      return assemble(rows(gen), gen);
    case "high_vr14":
      return assemble(
        rows(gen, { ...NORMAL, vr14: (i) => (i % 5 === 0 ? r4(118 + i * 6.25) : NORMAL.vr14(i)) }),
        gen,
      );
    case "stale": {
      const old = gen - STALE_AGE_S * 1000;
      return assemble(rows(old), old);
    }
    case "empty":
      return assemble([], gen, { matching: 0 });
    case "pending":
      return assemble(rows(gen, { ...NORMAL, pending: (i) => i % 3 !== 2 }), gen);
    case "low_liquidity":
      return assemble(
        rows(gen, {
          ...NORMAL,
          qv24: (i) => r2(2_050_000 + ((i * 7919) % 41) * 60_000),
          flags: (i) => THIN_FLAGS[i % THIN_FLAGS.length],
          warnings: (i) => (i % 6 === 0 ? ["NEW_LISTING", "LISTED_UNDER_24H"] : []),
        }),
        gen,
      );
    case "partial": {
      const s = assemble(rows(gen), gen);
      return { ...s, status: "partial", scanner: { ...s.scanner, connections_up: MOCK_CONNECTIONS - 1 } };
    }
    case "invalid": {
      // deliberately breaks the contract: a row below the VR14 filter plus an unknown key
      type Loose = { rows: (Record<string, unknown> & { event: { vr14: number } })[] };
      const bad = structuredClone(assemble(rows(gen), gen)) as unknown as Loose;
      bad.rows[0].event.vr14 = 1.5;
      bad.rows[1].internal_note = "should never be displayed";
      return bad;
    }
  }
}
