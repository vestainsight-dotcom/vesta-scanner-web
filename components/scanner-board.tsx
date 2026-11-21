"use client";

// Scanner board, reused from the VESTA Scanner page (same layout and styling).
// Differences in this public demo: data only from a ScannerDataAdapter (mock),
// all words from lib/i18n, every time labelled as simulated, a scenario picker,
// a schema-rejection state, and an optional BTC-relation prototype column.

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SchemaValidationError, type Latest } from "@/lib/data/adapter";
import { createMockAdapter, validateSnapshot } from "@/lib/data/mock-adapter";
import { SIM_EPOCH_MS, simClock, type Clock } from "@/lib/data/sim-clock";
import { corrBySymbol, mockCorrSnapshot } from "@/lib/corr/mock";
import { CORR_CLASSES, type CorrClass, type CorrEntry } from "@/lib/corr/public-v1-draft";
import { useI18n } from "@/lib/i18n/context";
import type { Messages } from "@/lib/i18n/messages";
import { DEFAULT_SCENARIO, SCENARIOS, isScenario, scenarioSnapshot, type Scenario } from "@/lib/mock/scenarios";
import { freshness, type FreshnessLevel } from "@/lib/scanner/freshness";
import {
  DISPLAY_TZ_LABEL,
  ageParts,
  formatDateTime,
  formatHm,
  formatPct,
  formatPrice,
  formatTime,
  formatUsdt,
  formatVr14,
  tradingViewUrl,
} from "@/lib/scanner/format";
import { conflictLabel, eventLabel, warningLabels } from "@/lib/scanner/labels";
import type { PublicRow, PublicSnapshot, SortKey } from "@/lib/schema/public-v2";

export const POLL_MS = 30_000;
const TICK_MS = 5_000;
export const SW_URL = "/demo-sw.js";
export const SW_SCOPE = "/demo";

type BannerLevel = FreshnessLevel | "OFFLINE";
type ViewState = { kind: "ok"; latest: Latest } | { kind: "invalid"; error: SchemaValidationError } | { kind: "none" };

const TONE: Record<BannerLevel, string> = {
  OFFLINE: "border-foreground/30 bg-foreground/[0.05]",
  LIVE: "border-[#16a34a]/40 bg-[#16a34a]/[0.06]",
  PARTIAL: "border-[#d97706]/50 bg-[#d97706]/[0.06]",
  STOPPED: "border-[#d97706]/50 bg-[#d97706]/[0.06]",
  DELAYED: "border-[#dc2626]/45 bg-[#dc2626]/[0.06]",
  CLOCK: "border-[#dc2626]/45 bg-[#dc2626]/[0.06]",
};
const DOT: Record<BannerLevel, string> = {
  OFFLINE: "bg-foreground/50",
  LIVE: "bg-[#16a34a]",
  PARTIAL: "bg-[#d97706]",
  STOPPED: "bg-[#d97706]",
  DELAYED: "bg-[#dc2626]",
  CLOCK: "bg-[#dc2626]",
};
const CORR_TONE: Record<CorrClass, string> = {
  BTC_LINKED: "border-accent-tech/50 text-accent-tech",
  HIGH_BETA: "border-[#d97706]/50 text-[#b45309]",
  INDEPENDENT: "border-foreground/25 text-foreground/70",
};
const UP = "text-[#15803d]";
const DOWN = "text-[#b91c1c]";

/** Synchronous load, used for the first render (server and browser agree). */
function loadSync(scenario: Scenario, simNowMs: number): ViewState {
  try {
    return { kind: "ok", latest: { source: "mock", snapshot: validateSnapshot(scenarioSnapshot(scenario, simNowMs)) } };
  } catch (e) {
    if (e instanceof SchemaValidationError) return { kind: "invalid", error: e };
    return { kind: "none" };
  }
}

const ago = (m: Messages, s: number) => m.time.ago(ageParts(s));
const age = (m: Messages, s: number) => m.time.age(ageParts(s));

export function ScannerBoard() {
  const { m } = useI18n();
  const [scenario, setScenario] = useState<Scenario>(DEFAULT_SCENARIO);
  const [view, setView] = useState<ViewState>(() => loadSync(DEFAULT_SCENARIO, SIM_EPOCH_MS));
  const [now, setNow] = useState(SIM_EPOCH_MS); // simulated; starts where the server render did
  const [fetchError, setFetchError] = useState(false);
  const [sort, setSort] = useState<SortKey>("recent");
  const [online, setOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCorr, setShowCorr] = useState(false);
  const [corrFilter, setCorrFilter] = useState<CorrClass | "ALL">("ALL");
  const clockRef = useRef<Clock | null>(null);
  const scenarioRef = useRef<Scenario>(DEFAULT_SCENARIO);
  const corr = useMemo(() => corrBySymbol(mockCorrSnapshot()), []);

  const poll = useCallback(async () => {
    const clock = clockRef.current;
    if (!clock) return;
    try {
      const latest = await createMockAdapter({ scenario: scenarioRef.current, clock }).getLatest();
      setView({ kind: "ok", latest });
      setFetchError(false);
    } catch (e) {
      if (e instanceof SchemaValidationError) setView({ kind: "invalid", error: e });
      else setFetchError(true); // keep the last data; its age decides the banner
    }
    setNow(clock.now());
  }, []);

  useEffect(() => {
    const clock = simClock(Date.now());
    clockRef.current = clock;
    const q = new URLSearchParams(window.location.search).get("scenario");
    const first = setTimeout(() => {
      if (isScenario(q) && q !== scenarioRef.current) {
        scenarioRef.current = q;
        setScenario(q);
      }
      void poll();
    }, 0);
    const tick = setInterval(() => setNow(clock.now()), TICK_MS);
    const timer = setInterval(() => {
      if (document.visibilityState !== "hidden") void poll();
    }, POLL_MS);
    const onOnline = () => {
      setOnline(true);
      void poll();
    };
    const onOffline = () => setOnline(false);
    const firstOnline = setTimeout(() => setOnline(navigator.onLine), 0);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      clearTimeout(first);
      clearTimeout(firstOnline);
      clearInterval(tick);
      clearInterval(timer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [poll]);

  useEffect(() => {
    // PWA: static-asset service worker, production builds only (dev HMR must not be cached)
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE, updateViaCache: "none" }).catch(() => {});
  }, []);

  const chooseScenario = (s: Scenario) => {
    scenarioRef.current = s;
    setScenario(s);
    try {
      const u = new URL(window.location.href);
      u.searchParams.set("scenario", s);
      window.history.replaceState(null, "", u);
    } catch {
      // URL update is a convenience only
    }
    void poll();
  };

  const refresh = async () => {
    setRefreshing(true);
    await poll();
    setRefreshing(false);
  };

  const picker = (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={m.demo.scenario}>
      <span className="font-mono text-[11px] tracking-widest text-foreground/50 uppercase">{m.demo.scenario}</span>
      {SCENARIOS.map((s) => (
        <Pill key={s} active={scenario === s} onClick={() => chooseScenario(s)} testId={`scenario-${s}`}>
          {m.demo.scenarios[s]}
        </Pill>
      ))}
    </div>
  );

  const demoBanner = (
    <div
      data-testid="demo-banner"
      className="rounded-xl border border-accent-tech/50 bg-accent-tech/[0.07] px-4 py-3 text-sm text-foreground/80"
    >
      <strong className="block font-medium text-foreground">{m.demo.bannerTitle}</strong>
      <span className="block text-xs text-foreground/60">{m.demo.bannerTitleEn}</span>
      <span className="mt-1 block">{m.demo.bannerBody}</span>
      <span className="mt-1 block font-mono text-[11px] tracking-wide text-foreground/55">
        {m.demo.simClock} {formatDateTime(new Date(now).toISOString())} {DISPLAY_TZ_LABEL}
      </span>
    </div>
  );

  if (view.kind !== "ok") {
    return (
      <section className="mt-12 flex min-w-0 flex-col gap-4">
        {demoBanner}
        {picker}
        {view.kind === "invalid" ? (
          <div
            role="alert"
            data-testid="schema-error"
            className="rounded-xl border border-[#dc2626]/45 bg-[#dc2626]/[0.06] px-4 py-4 text-sm"
          >
            <strong className="block font-medium text-foreground">{m.errors.schemaTitle}</strong>
            <span className="mt-1 block text-foreground/70">
              {m.errors.schemaBody(
                view.error.issues.length,
                `${view.error.issues[0]?.path} — ${view.error.issues[0]?.message}`,
              )}
            </span>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-foreground/20 px-5 py-6 text-sm text-foreground/60">
            {m.errors.noData}
          </p>
        )}
      </section>
    );
  }

  const snap = view.latest.snapshot;
  const f = freshness(snap, now);
  const level: BannerLevel = online ? f.level : "OFFLINE";
  const reason = online ? f.reason : "OFFLINE";
  const label = m.status.labels[reason];
  const detail = m.status.detail[reason](age(m, Math.max(0, f.age_s)));
  const bySymbol = new Map(snap.rows.map((r) => [r.symbol, r]));
  const ranked = snap.rankings[sort].map((s) => bySymbol.get(s)).filter((r): r is PublicRow => !!r);
  const rows =
    showCorr && corrFilter !== "ALL" ? ranked.filter((r) => corr.get(r.symbol)?.class === corrFilter) : ranked;

  return (
    <section className="mt-12 flex min-w-0 flex-col gap-4">
      {demoBanner}
      {picker}

      <div
        role="status"
        data-level={level}
        data-testid="status-banner"
        className={`flex flex-col gap-1 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${TONE[level]}`}
      >
        <div className="flex items-start gap-2.5 sm:items-center">
          <span aria-hidden="true" className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full sm:mt-0 ${DOT[level]}`} />
          <span className="shrink-0 text-sm font-medium whitespace-nowrap text-foreground">{label}</span>
          <span className="text-sm text-foreground/65">{detail}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] tracking-wide text-foreground/55">
          <span>
            {m.status.lastUpdate(formatDateTime(snap.generated_at))}
            {m.time.tz(DISPLAY_TZ_LABEL)}
          </span>
          {fetchError && online && <span className="text-[#b45309]">{m.status.fetchFailed}</span>}
          {(fetchError || !online || f.level !== "LIVE") && (
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="rounded-full border border-foreground/20 px-2 py-0.5 text-foreground/70 transition-colors hover:border-accent-tech/60 hover:text-foreground disabled:opacity-50"
            >
              {refreshing ? m.status.refreshing : m.status.refresh}
            </button>
          )}
        </div>
      </div>

      <FilterLine snap={snap} shown={rows.length} m={m} />

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={m.sort.group}>
        <span className="font-mono text-[11px] tracking-widest text-foreground/50 uppercase">{m.sort.label}</span>
        {(["recent", "volume"] as const).map((k) => (
          <Pill key={k} active={sort === k} onClick={() => setSort(k)}>
            {m.sort[k]}
          </Pill>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-foreground/70">
          <input
            type="checkbox"
            checked={showCorr}
            onChange={(e) => setShowCorr(e.target.checked)}
            className="accent-[#4f5fd6]"
            data-testid="corr-toggle"
          />
          {m.corr.toggle}
        </label>
        {showCorr && (
          <div
            data-testid="corr-banner"
            className="flex flex-col gap-2 rounded-xl border border-dashed border-[#d97706]/50 bg-[#d97706]/[0.05] px-4 py-3 text-xs text-foreground/70"
          >
            <span>
              <strong className="font-medium text-foreground">{m.corr.bannerTitle}</strong>
              <span className="mt-0.5 block">{m.corr.bannerBody}</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {(["ALL", ...CORR_CLASSES] as const).map((c) => (
                <Pill key={c} active={corrFilter === c} onClick={() => setCorrFilter(c)}>
                  {c === "ALL" ? m.corr.filterAll : m.corr.classes[c]}
                </Pill>
              ))}
            </div>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <p
          data-testid="empty-state"
          className="rounded-xl border border-dashed border-foreground/20 px-4 py-6 text-sm text-foreground/55"
        >
          {snap.volume_feed.ticker_state !== "OK" ? m.empty.ticker : m.empty.none}
        </p>
      ) : (
        <Board
          rows={rows}
          now={now}
          dim={f.level === "DELAYED" || f.level === "CLOCK"}
          sort={sort}
          m={m}
          corr={showCorr ? corr : null}
        />
      )}

      <dl className="mt-2 grid gap-x-8 gap-y-2 text-xs leading-relaxed text-foreground/55 sm:grid-cols-2">
        <Def term={m.defs.filterTerm} sep={m.defs.sep}>
          {m.defs.filter(snap.filters.vr14_min, formatUsdt(snap.filters.min_qv_24h_usdt))}
        </Def>
        <Def term="VR14" sep={m.defs.sep}>
          {m.defs.vr14}
        </Def>
        <Def term={m.defs.qvTerm} sep={m.defs.sep}>
          {m.defs.qv}
        </Def>
        <Def term={m.defs.priceTerm} sep={m.defs.sep}>
          {m.defs.price}
        </Def>
        <Def term={m.defs.trendTerm} sep={m.defs.sep}>
          {m.defs.trend}
        </Def>
        <Def term={m.defs.conflictTerm} sep={m.defs.sep}>
          {m.defs.conflict}
        </Def>
        <Def term={m.defs.qv24Term} sep={m.defs.sep}>
          {m.defs.qv24}
        </Def>
        <Def term={m.defs.detectedTerm} sep={m.defs.sep}>
          {m.defs.detected}
        </Def>
      </dl>
      {f.level !== "LIVE" && <p className="text-xs text-foreground/45">{m.status.notLiveNote}</p>}
    </section>
  );
}

function Pill({
  active,
  onClick,
  children,
  testId,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      data-testid={testId}
      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
        active
          ? "border-accent-tech bg-accent-tech/[0.08] text-foreground"
          : "border-foreground/15 text-foreground/60 hover:border-accent-tech/50 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function FilterLine({ snap, shown, m }: { snap: PublicSnapshot; shown: number; m: Messages }) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] tracking-wide text-foreground/55">
      <span>
        {m.filter.rule(snap.filters.vr14_min, formatUsdt(snap.filters.min_qv_24h_usdt), snap.filters.window_minutes)}
      </span>
      <span>{m.filter.matching(snap.matching, shown)}</span>
      {snap.scanner.symbols_scanned !== null && <span>{m.filter.scanned(snap.scanner.symbols_scanned)}</span>}
      <span>{m.filter.connections(snap.scanner.connections_up, snap.scanner.connections_total)}</span>
      {snap.volume_feed.ticker_fetched_at && (
        <span>{m.filter.ticker(formatTime(snap.volume_feed.ticker_fetched_at))}</span>
      )}
    </div>
  );
}

function Def({ term, sep, children }: { term: string; sep: string; children: ReactNode }) {
  return (
    <div>
      <dt className="inline font-medium text-foreground/70">
        {term}
        {sep}
      </dt>
      <dd className="inline">{children}</dd>
    </div>
  );
}

const TH = "px-3 py-3 font-mono text-[10px] font-normal tracking-widest whitespace-nowrap text-foreground/55 uppercase";
const STICKY = "sticky left-0 z-10 bg-background";
const signColor = (p: number | null) => (p === null || p === 0 ? "text-foreground/60" : p > 0 ? UP : DOWN);

function Board({
  rows,
  now,
  dim,
  sort,
  m,
  corr,
}: {
  rows: PublicRow[];
  now: number;
  dim: boolean;
  sort: SortKey;
  m: Messages;
  corr: Map<string, CorrEntry> | null;
}) {
  const sorted = (k: SortKey) => (sort === k ? "text-accent-tech" : "");
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span aria-hidden="true" className="font-mono text-[10px] tracking-widest text-foreground/40 uppercase sm:hidden">
        {m.table.swipe}
      </span>
      <div
        role="region"
        aria-label={m.table.region(m.sort[sort])}
        tabIndex={0}
        data-testid="board"
        className={`overflow-x-auto overscroll-x-contain rounded-xl border border-foreground/15 bg-foreground/[0.02] ${
          dim ? "opacity-60" : ""
        }`}
      >
        <table className="w-full min-w-max border-collapse text-left text-sm tabular-nums">
          <thead>
            <tr>
              <th scope="col" className={`${TH} ${STICKY}`}>
                {m.table.symbol}
              </th>
              <th scope="col" className={TH}>{m.table.event}</th>
              {corr && <th scope="col" className={TH}>{m.table.btcRel}</th>}
              <th scope="col" className={`${TH} text-right ${sorted("volume")}`}>{m.table.vr14}</th>
              <th scope="col" className={`${TH} text-right`}>{m.table.qv1m}</th>
              <th scope="col" className={`${TH} text-right`}>{m.table.chg1m}</th>
              <th scope="col" className={`${TH} text-right`}>{m.table.price}</th>
              <th scope="col" className={`${TH} text-right`}>15M</th>
              <th scope="col" className={`${TH} text-right`}>1H</th>
              <th scope="col" className={`${TH} text-right`}>2H</th>
              <th scope="col" className={`${TH} ${sorted("recent")}`}>{m.table.detected}</th>
              <th scope="col" className={TH}>{m.table.hints}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <Row key={r.symbol} r={r} rank={i + 1} now={now} m={m} corr={corr} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TrendCell({
  change,
  state,
  pending,
  m,
}: {
  change: number | null;
  state: string | null;
  pending: boolean;
  m: Messages;
}) {
  const chip =
    state === "TREND_UP"
      ? "border-[#16a34a]/40 text-[#15803d]"
      : state === "TREND_DOWN"
        ? "border-[#dc2626]/40 text-[#b91c1c]"
        : "border-foreground/15 text-foreground/55";
  return (
    <td className="px-3 py-2.5 text-right whitespace-nowrap">
      <span className={signColor(change)}>{formatPct(change)}</span>
      <div className="mt-0.5">
        {state ? (
          <span className={`rounded-full border px-1.5 py-px text-[11px] ${chip}`}>{m.trend[state] ?? state}</span>
        ) : (
          <span className="text-[11px] text-foreground/40">{pending ? m.table.pending : "—"}</span>
        )}
      </div>
    </td>
  );
}

function Row({
  r,
  rank,
  now,
  m,
  corr,
}: {
  r: PublicRow;
  rank: number;
  now: number;
  m: Messages;
  corr: Map<string, CorrEntry> | null;
}) {
  const e = r.event;
  const dirColor = e.direction === "UP" ? UP : e.direction === "DOWN" ? DOWN : "text-foreground/70";
  const warnings = warningLabels(m, r);
  const c = corr?.get(r.symbol);
  const detectedAge = r.detected_at ? Math.round((now - Date.parse(r.detected_at)) / 1000) : 0;
  return (
    <tr className="border-t border-foreground/10 align-top">
      <td className={`px-3 py-2.5 whitespace-nowrap ${STICKY}`}>
        <span className="mr-2 font-mono text-[11px] text-foreground/40">{rank}</span>
        <a
          href={tradingViewUrl(r.symbol)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground transition-colors hover:text-accent-tech"
          title={m.table.tvTitle(r.symbol)}
        >
          {r.symbol}
          <span aria-hidden="true" className="ml-1 text-[11px] text-foreground/40">
            ↗
          </span>
        </a>
        <div className="text-xs text-foreground/50">{m.table.qv24h(formatUsdt(r.qv_24h.usdt))}</div>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <span className={`font-medium ${dirColor}`}>{eventLabel(m, e.type, e.direction)}</span>
        <div className="text-xs text-foreground/55">
          {e.bias && m.bias[e.bias]}
          {r.event_count > 1 && <span className="ml-1">{m.table.times(r.event_count)}</span>}
        </div>
      </td>
      {corr && (
        <td className="px-3 py-2.5 whitespace-nowrap">
          {c ? (
            <span className={`rounded-full border border-dashed px-2 py-0.5 text-[11px] ${CORR_TONE[c.class]}`}>
              {m.corr.classes[c.class]}
            </span>
          ) : (
            <span className="text-xs text-foreground/40">{m.corr.unclassified}</span>
          )}
        </td>
      )}
      <td className="px-3 py-2.5 text-right text-base font-medium whitespace-nowrap text-foreground">
        {formatVr14(e.vr14) ?? m.table.noData}
      </td>
      <td className="px-3 py-2.5 text-right whitespace-nowrap text-foreground/80">{formatUsdt(e.quote_volume_1m_usdt)}</td>
      <td className="px-3 py-2.5 text-right whitespace-nowrap">
        <span className={signColor(e.change_1m_pct)}>{formatPct(e.change_1m_pct)}</span>
        {e.minute_at && <div className="text-xs text-foreground/45">{m.table.bar(formatHm(e.minute_at))}</div>}
      </td>
      <td className="px-3 py-2.5 text-right whitespace-nowrap text-foreground/85">
        {formatPrice(r.price.last_close)}
        {r.price.close_at && <div className="text-xs text-foreground/45">{m.table.close(formatHm(r.price.close_at))}</div>}
      </td>
      <TrendCell change={r.price.change_15m_pct} state={r.trends?.["15m"] ?? null} pending={r.structure_pending} m={m} />
      <TrendCell change={r.price.change_1h_pct} state={r.trends?.["1h"] ?? null} pending={r.structure_pending} m={m} />
      <TrendCell change={r.price.change_2h_pct} state={r.trends?.["2h"] ?? null} pending={r.structure_pending} m={m} />
      <td className="px-3 py-2.5 whitespace-nowrap">
        {r.detected_at ? (
          <>
            <span className="text-foreground/80">{formatTime(r.detected_at)}</span>
            <div className="text-xs text-foreground/50">{ago(m, detectedAge)}</div>
          </>
        ) : (
          <span className="text-foreground/40">—</span>
        )}
      </td>
      <td className="max-w-[18rem] px-3 py-2.5">
        {!r.conflict && warnings.length === 0 ? (
          <span className="text-xs text-foreground/35">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {r.conflict && (
              <span
                className="rounded-full border border-[#dc2626]/40 bg-[#dc2626]/[0.06] px-2 py-0.5 text-[11px] whitespace-nowrap text-foreground/80"
                title={m.table.conflictTitle(conflictLabel(m, r.conflict))}
              >
                {m.table.conflict}
              </span>
            )}
            {warnings.map((w) => (
              <span
                key={w}
                className="rounded-full border border-[#d97706]/40 bg-[#d97706]/[0.06] px-2 py-0.5 text-[11px] whitespace-nowrap text-foreground/75"
              >
                {w}
              </span>
            ))}
          </div>
        )}
      </td>
    </tr>
  );
}
