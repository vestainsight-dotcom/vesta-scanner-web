// Simulated clock for the demo. It starts at a fixed, clearly fictional moment
// (SIM_EPOCH_MS, in 2030) when the page loads and then advances at real speed,
// so "x seconds ago" behaves naturally while no time on screen can be mistaken
// for a real market moment. The UI labels every time as simulated.

export const SIM_EPOCH_MS = Date.UTC(2030, 0, 1, 1, 0, 0); // 2030-01-01 09:00:00 UTC+8

export interface Clock {
  now(): number;
}

/** A clock pinned to SIM_EPOCH_MS at `realStartMs` that then ticks with `realNow`. */
export function simClock(realStartMs: number, realNow: () => number = Date.now): Clock {
  return { now: () => SIM_EPOCH_MS + Math.max(0, realNow() - realStartMs) };
}

/** A clock that never moves (tests, server render). */
export const fixedClock = (ms: number = SIM_EPOCH_MS): Clock => ({ now: () => ms });
