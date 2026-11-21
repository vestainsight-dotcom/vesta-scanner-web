// BTC relationship prototype: a separate DRAFT contract, placeholder data only.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { mockCorrSnapshot } from "../lib/corr/mock";
import { CORR_CLASSES, CORR_SCHEMA_DRAFT, corrSnapshotSchema } from "../lib/corr/public-v1-draft";
import { MOCK_SYMBOLS } from "../lib/mock/scenarios";
import { PUBLIC_SCHEMA } from "../lib/schema/public-v2";

test("draft contract is separate from the scanner contract", () => {
  assert.equal(CORR_SCHEMA_DRAFT, "vesta.corr.public.v1");
  assert.notEqual(CORR_SCHEMA_DRAFT, PUBLIC_SCHEMA);
  assert.deepEqual([...CORR_CLASSES], ["BTC_LINKED", "HIGH_BETA", "INDEPENDENT"]);
  const v2 = readFileSync(new URL("../lib/schema/public-v2.ts", import.meta.url), "utf-8");
  assert.doesNotMatch(v2, /corr|BTC_LINKED|HIGH_BETA/i, "v2 schema must not gain correlation fields");
});

test("placeholder snapshot: valid, flagged draft + placeholder, only mock symbols, some unclassified", () => {
  const s = mockCorrSnapshot();
  assert.equal(corrSnapshotSchema.safeParse(s).success, true);
  assert.equal(s.draft, true);
  assert.equal(s.calc_version, "placeholder");
  const known = new Set(MOCK_SYMBOLS);
  for (const e of s.entries) assert.ok(known.has(e.symbol), e.symbol);
  assert.ok(s.entries.length < MOCK_SYMBOLS.length);
  for (const c of CORR_CLASSES) assert.ok(s.entries.some((e) => e.class === c), c);
});

test("draft schema rejects raw metrics and non-draft snapshots", () => {
  const s = mockCorrSnapshot() as unknown as Record<string, unknown> & { entries: Record<string, unknown>[] };
  assert.equal(corrSnapshotSchema.safeParse({ ...s, draft: false }).success, false);
  const raw = structuredClone(s);
  raw.entries[0].pearson_30d = 0.83;
  assert.equal(corrSnapshotSchema.safeParse(raw).success, false);
});

test("BTCUSDT (the reference) is never classified; duplicates are refused", () => {
  const s = mockCorrSnapshot();
  assert.ok(!s.entries.some((e) => e.symbol === "BTCUSDT"));
  const withRef = { ...s, entries: [...s.entries, { ...s.entries[0], symbol: "BTCUSDT" }] };
  assert.equal(corrSnapshotSchema.safeParse(withRef).success, false);
  const dup = { ...s, entries: [...s.entries, s.entries[0]] };
  assert.equal(corrSnapshotSchema.safeParse(dup).success, false);
});
