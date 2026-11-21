// i18n: both dictionaries have the same shape, cover every code the schema can
// send, and components hold no hard-coded UI text.

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { CORR_CLASSES } from "../lib/corr/public-v1-draft";
import { DEFAULT_LOCALE, LOCALES, MESSAGES, isLocale } from "../lib/i18n/messages";
import { SCENARIOS } from "../lib/mock/scenarios";
import { DELAY_AFTER_S, type FreshnessReason } from "../lib/scanner/freshness";
import { conflictLabel, eventLabel } from "../lib/scanner/labels";
import { DIRECTIONS, BIASES, SIGNAL_TYPES, TREND_STATES } from "../lib/schema/public-v2";

const CJK = /[㐀-鿿！-｠]/;
const ROOT = new URL("../", import.meta.url);

function shape(v: unknown, path = ""): string[] {
  if (typeof v === "function") return [`${path}:fn`];
  if (v && typeof v === "object") return Object.keys(v).sort().flatMap((k) => shape((v as Record<string, unknown>)[k], `${path}.${k}`));
  return [`${path}:${typeof v}`];
}

function strings(v: unknown, path = ""): [string, string][] {
  if (typeof v === "string") return [[path, v]];
  if (v && typeof v === "object") return Object.entries(v).flatMap(([k, x]) => strings(x, `${path}.${k}`));
  return [];
}

test("locales: zh-Hant (default) and en", () => {
  assert.deepEqual([...LOCALES], ["zh-Hant", "en"]);
  assert.equal(DEFAULT_LOCALE, "zh-Hant");
  assert.ok(isLocale("en") && !isLocale("fr") && !isLocale(null));
});

test("en has exactly the same keys and value kinds as zh-Hant", () => {
  assert.deepEqual(shape(MESSAGES.en), shape(MESSAGES["zh-Hant"]));
});

test("every code the schema can send has a word in both locales", () => {
  const reasons: (FreshnessReason | "OFFLINE")[] = [
    "LIVE", "CLOCK", "DELAYED", "STARTING", "STALLED", "ENDED", "CONNECTIONS", "TICKER", "INCOMPLETE", "OFFLINE",
  ];
  for (const l of LOCALES) {
    const m = MESSAGES[l];
    for (const t of SIGNAL_TYPES) assert.ok(m.event.types[t], `${l} type ${t}`);
    for (const d of DIRECTIONS.filter((d) => d !== "NEUTRAL")) assert.ok(m.event.directions[d], `${l} dir ${d}`);
    for (const b of BIASES) assert.ok(m.bias[b], `${l} bias ${b}`);
    for (const t of TREND_STATES) assert.ok(m.trend[t], `${l} trend ${t}`);
    for (const r of reasons) {
      assert.ok(m.status.labels[r], `${l} label ${r}`);
      assert.equal(typeof m.status.detail[r], "function");
    }
    for (const s of SCENARIOS) assert.ok(m.demo.scenarios[s], `${l} scenario ${s}`);
    for (const c of CORR_CLASSES) assert.ok(m.corr.classes[c], `${l} corr ${c}`);
  }
});

test("English strings contain no Chinese (except the deliberate bilingual banner line)", () => {
  for (const [path, s] of strings(MESSAGES.en)) {
    if (path === ".demo.bannerTitleEn") continue;
    assert.ok(!CJK.test(s), `${path}: ${s}`);
  }
  // functions too
  const m = MESSAGES.en;
  assert.ok(!CJK.test(m.status.detail.DELAYED("5 min") + m.time.ago({ unit: "h", n: 2, m: 3 })));
});

test("demo banner says DEMO MODE in both languages, in both locales", () => {
  for (const l of LOCALES) {
    const b = MESSAGES[l].demo.bannerTitle + MESSAGES[l].demo.bannerTitleEn;
    assert.match(b, /DEMO MODE — Simulated Market Data/);
    assert.match(b, /展示模式 — 所有市場資料均為模擬資料/);
  }
});

test("LIVE is never shown as plain 'live' in the demo", () => {
  assert.match(MESSAGES["zh-Hant"].status.labels.LIVE, /模擬/);
  assert.match(MESSAGES.en.status.labels.LIVE, /simulated/i);
});

test("the '3 minutes' in the texts matches DELAY_AFTER_S", () => {
  assert.equal(DELAY_AFTER_S, 180);
  assert.match(MESSAGES["zh-Hant"].status.notLiveNote, /3 分鐘/);
  assert.match(MESSAGES.en.status.notLiveNote, /3 minutes/);
});

test("labels: event and conflict wording per locale", () => {
  const zh = MESSAGES["zh-Hant"];
  const en = MESSAGES.en;
  assert.equal(eventLabel(zh, "VOLUME_PRICE", "UP"), "價量上漲");
  assert.equal(eventLabel(zh, "VOLUME_SPIKE", "DOWN"), "爆量 下跌");
  assert.equal(eventLabel(en, "PRICE_SHOCK", "UP"), "Price shock up");
  assert.equal(eventLabel(en, "VOLUME_PRICE", null), "Volume-price");
  assert.equal(conflictLabel(zh, "2H_UP_15M_DOWN"), "2H 多頭／15M 空頭");
  assert.equal(conflictLabel(en, "2H_UP_15M_DOWN"), "2H up / 15M down");
});

test("components hold no hard-coded Chinese UI text", () => {
  const dir = new URL("components/", ROOT);
  for (const f of readdirSync(dir)) {
    const src = readFileSync(new URL(f, dir), "utf-8").replace(/\/\/.*$/gm, "");
    assert.ok(!CJK.test(src), `components/${f} contains CJK text outside lib/i18n`);
  }
});
