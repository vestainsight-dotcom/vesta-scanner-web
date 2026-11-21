// vesta.scan.public.v2 contract, exercised with synthetic snapshots only.

import assert from "node:assert/strict";
import { test } from "node:test";
import { SIM_EPOCH_MS } from "../lib/data/sim-clock";
import { SCENARIOS, scenarioSnapshot } from "../lib/mock/scenarios";
import { PUBLIC_SCHEMA, publicSnapshotSchema, TOP_N, type PublicSnapshot } from "../lib/schema/public-v2";

type Any = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const normal = (): PublicSnapshot => structuredClone(scenarioSnapshot("normal", SIM_EPOCH_MS) as PublicSnapshot);
const isoS = (ms: number) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");

test("every scenario except 'invalid' passes the public schema", () => {
  for (const s of SCENARIOS) {
    const r = publicSnapshotSchema.safeParse(scenarioSnapshot(s, SIM_EPOCH_MS));
    assert.equal(r.success, s !== "invalid", `${s}: ${JSON.stringify(r.error?.issues?.[0])}`);
  }
});

test("schema id is unchanged: vesta.scan.public.v2", () => {
  assert.equal(PUBLIC_SCHEMA, "vesta.scan.public.v2");
  assert.equal(normal().schema, "vesta.scan.public.v2");
});

test("rankings: top 30 each, ordered, every row ranked", () => {
  const s = normal();
  assert.equal(s.rankings.recent.length, TOP_N);
  assert.equal(s.rankings.volume.length, TOP_N);
  assert.equal(s.rows.length, new Set([...s.rankings.recent, ...s.rankings.volume]).size);
});

test("schema refuses rows that break the snapshot's declared display filters", () => {
  const cases: ((s: PublicSnapshot) => void)[] = [
    (s) => (s.rows[0].event.vr14 = s.filters.vr14_min - 0.01),
    (s) => (s.rows[0].event.vr14 = null),
    (s) => (s.rows[0].qv_24h.usdt = s.filters.min_qv_24h_usdt - 0.01),
    (s) => (s.rows[0].qv_24h.state = "STALE"),
    (s) => (s.rows[0].qv_24h.at = isoS(s.generated_ms - 631_000)),
    (s) => (s.rows[0].qv_24h.at = isoS(s.generated_ms + 61_000)),
    (s) => (s.volume_feed.ticker_fetched_at = isoS(s.generated_ms - 331_000)),
  ];
  for (const mutate of cases) {
    const s = normal();
    mutate(s);
    assert.equal(publicSnapshotSchema.safeParse(s).success, false, mutate.toString());
  }
});

test("schema refuses broken rankings", () => {
  const rejects = (mutate: (s: PublicSnapshot) => void) => {
    const s = normal();
    mutate(s);
    assert.equal(publicSnapshotSchema.safeParse(s).success, false, mutate.toString());
  };
  rejects((s) => s.rankings.recent.reverse());
  rejects((s) => s.rankings.volume.reverse());
  rejects((s) => (s.rankings.recent[0] = "NOTAROWUSDT"));
  rejects((s) => s.rankings.volume.push(s.rankings.volume[0]));
  rejects((s) => s.rows.push({ ...s.rows[0], symbol: "EXTRAUSDT" }));
  rejects((s) => (s.matching = 10));
});

test("schema refuses unknown keys and odd values", () => {
  const rejects = (mutate: (s: Any) => void) => {
    const s = normal() as Any;
    mutate(s);
    assert.equal(publicSnapshotSchema.safeParse(s).success, false, mutate.toString());
  };
  rejects((s) => (s.run = "x"));
  rejects((s) => (s.rows[0].path = "/somewhere"));
  rejects((s) => (s.rows[0].event.vol_ratio = 3));
  rejects((s) => (s.rows[0].trends.extra = "TREND_UP"));
  rejects((s) => (s.rows[0].trends["1h"] = "BULLISH"));
  rejects((s) => (s.rows[0].conflict = "free text"));
  rejects((s) => (s.rows[0].symbol = "BTC/USDT"));
  rejects((s) => (s.filters.tab = "all"));
  rejects((s) => (s.generated_ms += 5000));
});
