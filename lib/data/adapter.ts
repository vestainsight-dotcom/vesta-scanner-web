// Public data-access interface of the frontend. Components only talk to a
// ScannerDataAdapter, never to a backend directly.
//
// P1: the only implementation is the mock adapter (lib/data/mock-adapter.ts).
// No network adapter exists in this repository yet.

import type { PublicSnapshot } from "@/lib/schema/public-v2";

export type DataSource = "mock";

export interface Latest {
  source: DataSource;
  snapshot: PublicSnapshot; // always validated against vesta.scan.public.v2
}

export interface ScannerDataAdapter {
  readonly kind: DataSource;
  /** Resolves with a validated snapshot; rejects with SchemaValidationError if the data breaks the contract. */
  getLatest(): Promise<Latest>;
}

export class SchemaValidationError extends Error {
  readonly issues: { path: string; message: string }[];
  constructor(issues: { path: string; message: string }[]) {
    super(`snapshot failed vesta.scan.public.v2 validation (${issues.length} issue(s))`);
    this.name = "SchemaValidationError";
    this.issues = issues;
  }
}

/**
 * RESERVED, NOT IMPLEMENTED. Shape of a future read-only HTTP adapter (a later,
 * separately approved phase). It would only ever issue unauthenticated GETs to
 * a public read endpoint and validate every response with the same schema.
 * No implementation, URL or credential belongs in this repository in P1.
 */
export interface HttpAdapterConfig {
  /** Public, read-only GET endpoint returning a vesta.scan.public.v2 snapshot. */
  readonly endpoint: string;
  /** Minimum interval between requests, ms. */
  readonly minIntervalMs: number;
}
