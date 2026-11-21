// Public scanner snapshot contract: vesta.scan.public.v2.
//
// The public display contract of this demo: every snapshot (in this repository,
// always simulated) must pass it before anything is shown. It defines the shape
// and consistency of displayed data only; it contains no detection or filtering
// logic of any production system. Do not change it here — propose a schema
// change in an Issue first (a new version, never an edit of v2).
//
// Every object is strict (unknown keys are rejected) and every string / array /
// number is bounded, so the largest valid snapshot has a known size.
//
// Displayed volume multiple: VR14, a relative-volume figure (the event's 1m
// quote volume relative to recent typical volume). The demo only displays it.
//
// Consistency checks: every row must meet the display filters that the snapshot
// itself declares in `filters` (VR14 >= vr14_min, rolling 24H volume known and
// >= min_qv_24h_usdt), and both rankings must be in the right order, so a
// snapshot that contradicts its own filters can never be shown.

import { z } from "zod";

export const PUBLIC_SCHEMA = "vesta.scan.public.v2";
export const TOP_N = 30;
export const MAX_ROWS = 2 * TOP_N; // union of the two rankings
export const MAX_DATA_FLAGS = 12;
export const MAX_LIQUIDITY_WARNINGS = 8;

export const SIGNAL_TYPES = ["VOLUME_PRICE", "VOLUME_SPIKE", "PRICE_SHOCK"] as const;
// NEUTRAL: the event's price move was too small to call a direction
export const DIRECTIONS = ["UP", "DOWN", "NEUTRAL"] as const;
export const BIASES = ["LONG", "SHORT", "NEUTRAL"] as const;
export const SCANNER_STATES = ["RUNNING", "STARTING", "STALLED", "ENDED"] as const;
export const TREND_STATES = ["TREND_UP", "TREND_DOWN", "RANGE", "TRANSITION", "INSUFFICIENT", "NO_DATA"] as const;
export const TICKER_STATES = ["OK", "STALE", "PENDING", "ERROR", "BANNED", "UNAVAILABLE"] as const;
export const QV_STATES = [...TICKER_STATES, "MISSING"] as const;
export const SORTS = ["recent", "volume"] as const;
export const WINDOW_MINUTES = [15, 60, 240] as const; // null = the whole scanner run
export const TREND_INTERVALS = ["15m", "1h", "2h"] as const;
// One snapshot is assembled within at most this much time.
export const MAX_CYCLE_SPREAD_MS = 30_000;
// 24H volume freshness limits, measured from generated_ms with the assembly spread as margin.
export const QV_MAX_AGE_MS = 600_000 + MAX_CYCLE_SPREAD_MS;
export const TICKER_MAX_AGE_MS = 300_000 + MAX_CYCLE_SPREAD_MS;
const FUTURE_TOLERANCE_MS = 60_000;

// Binance contract names are upper-case letters/digits, but a few use CJK
// letters, so letters are matched by Unicode class. Always ends in USDT.
const SYMBOL_RE = /^[\p{Lu}\p{Lo}\p{Nd}]{1,24}USDT$/u;
const FLAG_RE = /^[A-Z][A-Z0-9_]{0,31}$/;
const CONFLICT_RE = /^(2H|1H)_(UP|DOWN)_(1H|15M)_(UP|DOWN)$/;
// UTC ISO-8601 with "Z", seconds precision, as the transform writes it.
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

const iso = z.string().regex(ISO_RE);
const symbol = z.string().regex(SYMBOL_RE);
// Bounded so JSON length is bounded: |x| < 1e15 prints in at most ~24 chars.
const bounded = z.number().finite().gt(-1e15).lt(1e15);
const nonNeg = bounded.min(0);
const trendState = z.enum(TREND_STATES);

export const publicRowSchema = z.strictObject({
  symbol,
  // detection time of the symbol's newest qualifying event
  detected_at: iso.nullable(),
  first_detected_at: iso.nullable(),
  event_count: z.number().int().min(1).max(100_000),
  types: z.array(z.enum(SIGNAL_TYPES)).min(1).max(SIGNAL_TYPES.length),
  // the newest event; every field below is that same event
  event: z.strictObject({
    type: z.enum(SIGNAL_TYPES),
    direction: z.enum(DIRECTIONS).nullable(),
    bias: z.enum(BIASES).nullable(),
    minute_at: iso.nullable(), // UTC open time of the event's 1m bar
    vr14: nonNeg.nullable(),
    quote_volume_1m_usdt: nonNeg.nullable(), // VR14 numerator
    change_1m_pct: bounded.nullable(), // simple % change of the event bar
  }),
  // latest known closed 1m bar (not the event bar) and changes against 15 / 60 / 120 minutes earlier
  price: z.strictObject({
    last_close: bounded.positive().nullable(),
    close_at: iso.nullable(), // close time of that bar
    change_15m_pct: bounded.nullable(),
    change_1h_pct: bounded.nullable(),
    change_2h_pct: bounded.nullable(),
  }),
  // trend structure state per interval; null while it is still being computed
  trends: z.strictObject({ "15m": trendState, "1h": trendState, "2h": trendState }).nullable(),
  structure_pending: z.boolean(),
  conflict: z.string().regex(CONFLICT_RE).nullable(), // e.g. 2H_UP_15M_DOWN
  aligned: z.boolean().nullable(), // 15M, 1H and 2H all trend the same way
  data_flags: z.array(z.string().regex(FLAG_RE)).max(MAX_DATA_FLAGS),
  qv_24h: z.strictObject({
    state: z.enum(QV_STATES),
    usdt: nonNeg.nullable(), // Binance rolling 24H quote volume, USDT
    at: iso.nullable(), // the symbol's ticker closeTime
  }),
  liquidity_warnings: z.array(z.string().regex(FLAG_RE)).max(MAX_LIQUIDITY_WARNINGS),
});

const ranking = z.array(symbol).max(TOP_N);

export const publicSnapshotSchema = z
  .strictObject({
    schema: z.literal(PUBLIC_SCHEMA),
    status: z.enum(["ok", "partial"]),
    generated_at: iso,
    generated_ms: z.number().int().min(1_600_000_000_000).max(4_000_000_000_000),
    scanner: z.strictObject({
      state: z.enum(SCANNER_STATES),
      last_decision_at: iso.nullable(),
      lag_s: nonNeg.nullable(),
      connections_up: z.number().int().min(0).max(64),
      connections_total: z.number().int().min(0).max(64),
      symbols_scanned: z.number().int().min(0).max(10_000).nullable(),
    }),
    filters: z.strictObject({
      tab: z.literal("main"),
      window_minutes: z.union([z.literal(15), z.literal(60), z.literal(240), z.null()]),
      vr14_min: bounded.positive(),
      min_qv_24h_usdt: bounded.positive(),
    }),
    volume_feed: z.strictObject({
      ticker_state: z.enum(TICKER_STATES),
      ticker_fetched_at: iso.nullable(),
    }),
    matching: z.number().int().min(0).max(10_000), // rows passing the filters before the top-30 cut
    rankings: z.strictObject({ recent: ranking, volume: ranking }),
    rows: z.array(publicRowSchema).max(MAX_ROWS),
  })
  .superRefine((s, ctx) => {
    const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message });
    if (new Date(s.generated_at).getTime() !== Math.floor(s.generated_ms / 1000) * 1000) {
      issue(["generated_at"], "generated_at does not match generated_ms");
    }
    if (s.scanner.connections_up > s.scanner.connections_total) issue(["scanner"], "connections_up > connections_total");
    // age of a time against generated_ms: within [-FUTURE_TOLERANCE_MS, maxAge]
    const fresh = (at: string | null, maxAge: number) => {
      if (at === null) return false;
      const age = s.generated_ms - Date.parse(at);
      return age <= maxAge && age >= -FUTURE_TOLERANCE_MS;
    };
    if (s.volume_feed.ticker_state === "OK" && !fresh(s.volume_feed.ticker_fetched_at, TICKER_MAX_AGE_MS)) {
      issue(["volume_feed"], "24H ticker marked OK but its snapshot time is missing or stale");
    }

    const bySymbol = new Map<string, (typeof s.rows)[number]>();
    s.rows.forEach((r, i) => {
      if (bySymbol.has(r.symbol)) issue(["rows", i, "symbol"], "duplicate row");
      bySymbol.set(r.symbol, r);
      // the snapshot's own display filters: unknown never passes
      if (r.event.vr14 === null || r.event.vr14 < s.filters.vr14_min) {
        issue(["rows", i, "event", "vr14"], "row below the VR14 filter");
      }
      if (r.qv_24h.state !== "OK" || r.qv_24h.usdt === null || r.qv_24h.usdt < s.filters.min_qv_24h_usdt) {
        issue(["rows", i, "qv_24h"], "row outside the 24H volume filter");
      } else if (!fresh(r.qv_24h.at, QV_MAX_AGE_MS)) {
        issue(["rows", i, "qv_24h", "at"], "24H volume is stale");
      }
      if ((r.trends === null) !== (r.aligned === null) || (r.trends === null && r.conflict !== null)) {
        issue(["rows", i], "conflict / aligned require trends");
      }
    });

    const used = new Set<string>();
    for (const sort of SORTS) {
      const list = s.rankings[sort];
      if (list.length > s.matching) issue(["rankings", sort], "more ranked rows than matching");
      if (new Set(list).size !== list.length) issue(["rankings", sort], "duplicate symbol in ranking");
      list.forEach((sym, i) => {
        used.add(sym);
        if (!bySymbol.has(sym)) issue(["rankings", sort, i], "ranked symbol has no row");
      });
      // ranking order: newest detection / highest VR14 first, unknown last
      const key = (sym: string) => {
        const r = bySymbol.get(sym);
        if (!r) return null;
        return sort === "recent" ? (r.detected_at ? Date.parse(r.detected_at) : null) : r.event.vr14;
      };
      for (let i = 1; i < list.length; i++) {
        const a = key(list[i - 1]);
        const b = key(list[i]);
        if (a === null ? b !== null : b !== null && b > a) issue(["rankings", sort, i], `ranking not ordered by ${sort}`);
      }
    }
    s.rows.forEach((r, i) => {
      if (!used.has(r.symbol)) issue(["rows", i], "row is in no ranking");
    });
  });

export type PublicRow = z.infer<typeof publicRowSchema>;
export type PublicSnapshot = z.infer<typeof publicSnapshotSchema>;
export type SortKey = (typeof SORTS)[number];
