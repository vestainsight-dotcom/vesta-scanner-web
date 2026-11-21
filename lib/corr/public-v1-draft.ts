// DRAFT — vesta.corr.public.v1 (BTC relationship classes). NOT FINAL, NOT IN USE.
//
// A proposed read-only contract for a future, separately approved phase. It is
// independent of vesta.scan.public.v2 (which is unchanged) and is joined to
// scanner rows by `symbol` in the browser. No classification method is defined
// or validated here; this file only fixes the shape the UI would consume.
//
// Design notes for discussion:
// - Only coarse buckets are published, never raw research metrics.
// - `calc_version` and `window` make every class traceable to how it was made.
// - Unknown keys are rejected, as in the scanner contract.

import { z } from "zod";

export const CORR_SCHEMA_DRAFT = "vesta.corr.public.v1";
export const CORR_CLASSES = ["BTC_LINKED", "HIGH_BETA", "INDEPENDENT"] as const;
export const BUCKETS = ["LOW", "MID", "HIGH"] as const;
export const CORR_WINDOWS = ["7d", "30d", "90d"] as const;
/** Every class is relative to this symbol, so it never has a class itself. */
export const REFERENCE_SYMBOL = "BTCUSDT";

const SYMBOL_RE = /^[\p{Lu}\p{Lo}\p{Nd}]{1,24}USDT$/u;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

export const corrEntrySchema = z.strictObject({
  symbol: z.string().regex(SYMBOL_RE),
  class: z.enum(CORR_CLASSES),
  corr_bucket: z.enum(BUCKETS),
  beta_bucket: z.enum(BUCKETS),
});

export const corrSnapshotSchema = z.strictObject({
  schema: z.literal(CORR_SCHEMA_DRAFT),
  draft: z.literal(true), // removed only when the contract is approved
  as_of: z.string().regex(ISO_RE),
  window: z.enum(CORR_WINDOWS),
  calc_version: z.string().regex(/^[a-z0-9.\-]{1,32}$/),
  entries: z
    .array(corrEntrySchema)
    .max(1_000)
    .refine((es) => es.every((e) => e.symbol !== REFERENCE_SYMBOL), "the reference symbol cannot be classified")
    .refine((es) => new Set(es.map((e) => e.symbol)).size === es.length, "duplicate symbol"),
});

export type CorrClass = (typeof CORR_CLASSES)[number];
export type CorrEntry = z.infer<typeof corrEntrySchema>;
export type CorrSnapshot = z.infer<typeof corrSnapshotSchema>;
