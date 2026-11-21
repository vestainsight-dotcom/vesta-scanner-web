// Freshness is always computed from generated_ms against the reader's clock,
// never cached, so an old snapshot can never be shown as fresh.
// Locale-free: returns codes; the UI turns them into words (lib/i18n).

import type { PublicSnapshot } from "@/lib/schema/public-v2";

export const DELAY_AFTER_S = 180; // older than 3 minutes -> DELAYED
const CLOCK_SKEW_S = 60; // snapshot this far in the future -> clock problem, not fresh

export type FreshnessLevel = "LIVE" | "PARTIAL" | "STOPPED" | "DELAYED" | "CLOCK";
/** Why a snapshot is not LIVE (or LIVE). */
export type FreshnessReason =
  | "LIVE"
  | "CLOCK"
  | "DELAYED"
  | "STARTING"
  | "STALLED"
  | "ENDED"
  | "CONNECTIONS"
  | "TICKER"
  | "INCOMPLETE";

export interface Freshness {
  level: FreshnessLevel;
  reason: FreshnessReason;
  age_s: number;
}

export function freshness(
  snap: Pick<PublicSnapshot, "generated_ms" | "status" | "scanner"> & Partial<Pick<PublicSnapshot, "volume_feed">>,
  nowMs: number,
): Freshness {
  const age_s = Math.round((nowMs - snap.generated_ms) / 1000);
  if (age_s < -CLOCK_SKEW_S) return { level: "CLOCK", reason: "CLOCK", age_s };
  if (age_s > DELAY_AFTER_S) return { level: "DELAYED", reason: "DELAYED", age_s };
  if (snap.scanner.state !== "RUNNING") {
    return { level: "STOPPED", reason: snap.scanner.state, age_s };
  }
  if (snap.scanner.connections_total === 0 || snap.scanner.connections_up < snap.scanner.connections_total) {
    return { level: "PARTIAL", reason: "CONNECTIONS", age_s };
  }
  if (snap.volume_feed && snap.volume_feed.ticker_state !== "OK") {
    return { level: "PARTIAL", reason: "TICKER", age_s };
  }
  if (snap.status !== "ok") return { level: "PARTIAL", reason: "INCOMPLETE", age_s };
  return { level: "LIVE", reason: "LIVE", age_s };
}
