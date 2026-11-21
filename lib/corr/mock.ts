// PLACEHOLDER classes for the BTC-relationship UI prototype. They are assigned
// by a fixed rotation over the mock symbol list — NOT computed from any price
// data, NOT a research result, NOT validated. `calc_version: "placeholder"`
// marks them as such.

import { MOCK_SYMBOLS } from "@/lib/mock/scenarios";
import { SIM_EPOCH_MS } from "@/lib/data/sim-clock";
import { BUCKETS, CORR_CLASSES, CORR_SCHEMA_DRAFT, REFERENCE_SYMBOL, type CorrSnapshot } from "./public-v1-draft";

export function mockCorrSnapshot(): CorrSnapshot {
  return {
    schema: CORR_SCHEMA_DRAFT,
    draft: true,
    as_of: new Date(SIM_EPOCH_MS).toISOString().replace(".000Z", "Z"),
    window: "30d",
    calc_version: "placeholder",
    // BTCUSDT is the reference, never classified; some others stay unclassified on purpose
    entries: MOCK_SYMBOLS.filter((s, i) => s !== REFERENCE_SYMBOL && i % 7 !== 6)
      .map((symbol, i) => ({
        symbol,
        class: CORR_CLASSES[i % 3],
        corr_bucket: BUCKETS[(i + 2) % 3],
        beta_bucket: BUCKETS[i % 3],
      })),
  };
}

export function corrBySymbol(s: CorrSnapshot): Map<string, CorrSnapshot["entries"][number]> {
  return new Map(s.entries.map((e) => [e.symbol, e]));
}
