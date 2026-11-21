// Default adapter: serves synthetic snapshots (lib/mock/scenarios.ts) at the
// simulated clock's time. Every snapshot goes through the public schema, the
// same gate real data would pass, so the "invalid" scenario is rejected here.

import { publicSnapshotSchema } from "@/lib/schema/public-v2";
import { DEFAULT_SCENARIO, scenarioSnapshot, type Scenario } from "@/lib/mock/scenarios";
import { SchemaValidationError, type Latest, type ScannerDataAdapter } from "./adapter";
import { fixedClock, type Clock } from "./sim-clock";

export function validateSnapshot(raw: unknown): Latest["snapshot"] {
  const r = publicSnapshotSchema.safeParse(raw);
  if (!r.success) {
    throw new SchemaValidationError(
      r.error.issues.map((i) => ({ path: i.path.join(".") || "(root)", message: i.message })),
    );
  }
  return r.data;
}

export function createMockAdapter(
  opts: { scenario?: Scenario; clock?: Clock } = {},
): ScannerDataAdapter {
  const scenario = opts.scenario ?? DEFAULT_SCENARIO;
  const clock = opts.clock ?? fixedClock();
  return {
    kind: "mock",
    async getLatest(): Promise<Latest> {
      return { source: "mock", snapshot: validateSnapshot(scenarioSnapshot(scenario, clock.now())) };
    },
  };
}
