// Turn scanner codes into words of the current locale.

import type { Messages } from "@/lib/i18n/messages";
import type { PublicRow } from "@/lib/schema/public-v2";

export function eventLabel(m: Messages, type: string, direction: string | null): string {
  const t = m.event.types[type] ?? type;
  const d = direction ? m.event.directions[direction] ?? "" : "";
  return m.event.label(type, t, d);
}

/** e.g. 2H_UP_15M_DOWN -> "2H 多頭／15M 空頭" / "2H up / 15M down" */
export function conflictLabel(m: Messages, code: string): string {
  const [a, ad, b, bd] = code.split("_");
  return `${a} ${m.conflictDir[ad] ?? ad}${m.conflictSep}${b} ${m.conflictDir[bd] ?? bd}`;
}

/** Warning chips of one row: data flags and liquidity warnings, de-duplicated. */
export function warningLabels(m: Messages, r: PublicRow): string[] {
  return [...new Set([...r.data_flags, ...r.liquidity_warnings].map((f) => m.flags[f] ?? f))];
}
