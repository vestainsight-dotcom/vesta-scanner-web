// Locale-neutral formatting for numbers and times. Words live in lib/i18n.
// Times are shown in UTC+8 (Asia/Taipei) on both server and browser so the
// first browser render matches the server HTML; in demo mode they are
// simulated times and the UI says so.

export function tradingViewUrl(symbol: string): string {
  return `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(`BINANCE:${symbol}.P`)}`;
}

export function formatPrice(p: number | null): string {
  if (p === null) return "—";
  if (p >= 1000) return p.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return p.toLocaleString("en-US", { maximumSignificantDigits: 6 });
}

export function formatPct(p: number | null): string {
  if (p === null) return "—";
  const s = p.toFixed(2);
  return `${p > 0 ? "+" : ""}${s === "-0.00" ? "0.00" : s}%`;
}

export function formatUsdt(v: number | null): string {
  if (v === null) return "—";
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return v.toFixed(0);
}

/** VR14 as "17.7x"; unknown -> null (the UI shows its "no data" word). */
export function formatVr14(v: number | null): string | null {
  return v === null ? null : `${v.toFixed(1)}x`;
}

export const DISPLAY_TZ = "Asia/Taipei";
export const DISPLAY_TZ_LABEL = "UTC+8";

const HMS = new Intl.DateTimeFormat("en-GB", {
  timeZone: DISPLAY_TZ,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});
const HM = new Intl.DateTimeFormat("en-GB", { timeZone: DISPLAY_TZ, hour: "2-digit", minute: "2-digit", hour12: false });
const DATE = new Intl.DateTimeFormat("en-CA", { timeZone: DISPLAY_TZ, year: "numeric", month: "2-digit", day: "2-digit" });

export const formatTime = (iso: string) => HMS.format(new Date(iso));
export const formatHm = (iso: string) => HM.format(new Date(iso));
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${DATE.format(d)} ${HMS.format(d)}`;
}

/** Split an age in seconds into the largest units, for localized "x ago" text. */
export type AgeParts =
  | { unit: "s"; n: number }
  | { unit: "m"; n: number }
  | { unit: "h"; n: number; m: number }
  | { unit: "d"; n: number };

export function ageParts(s: number): AgeParts {
  if (s < 60) return { unit: "s", n: Math.max(0, s) };
  if (s < 3600) return { unit: "m", n: Math.floor(s / 60) };
  if (s < 172_800) return { unit: "h", n: Math.floor(s / 3600), m: Math.floor((s % 3600) / 60) };
  return { unit: "d", n: Math.floor(s / 86_400) };
}
