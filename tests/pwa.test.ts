// PWA: manifest, icons, isolation (scope / cache names / paths), and the
// service worker's caching rules, run in a vm sandbox with fake caches/fetch.
// The origin below is a reserved test name; nothing is fetched from it.

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const ROOT = new URL("../", import.meta.url);
const ORIGIN = "https://demo.example.test";
const read = (p: string) => readFileSync(new URL(p, ROOT), "utf-8");

function pngSize(path: string): [number, number] {
  const b = readFileSync(new URL(path, ROOT));
  assert.equal(b.subarray(1, 4).toString("latin1"), "PNG", path);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

test("manifest: scoped to /demo, standalone, valid icons under /demo", () => {
  const m = JSON.parse(read("public/demo/manifest.webmanifest"));
  assert.equal(m.id, "/demo");
  assert.equal(m.start_url, "/demo");
  assert.equal(m.scope, "/demo");
  assert.equal(m.display, "standalone");
  assert.match(m.name, /Demo/);
  assert.ok(m.short_name && m.short_name.length <= 12);
  const purposes = new Set<string>();
  for (const icon of m.icons) {
    assert.ok(icon.src.startsWith("/demo/icons/"), icon.src);
    const [w, h] = pngSize(`public${icon.src}`);
    assert.equal(`${w}x${h}`, icon.sizes, icon.src);
    purposes.add(icon.purpose);
  }
  assert.ok(purposes.has("maskable") && purposes.has("any"));
  assert.deepEqual(pngSize("public/demo/icons/apple-touch-icon-180.png"), [180, 180]);
});

test("isolation: every same-origin path stays under /demo, cache names use one unique prefix", () => {
  const sw = read("public/demo-sw.js");
  const manifest = read("public/demo/manifest.webmanifest");
  const board = read("components/scanner-board.tsx");
  // the page declares its own site icon (page-level `icons` replaces the layout's)
  assert.match(read("app/demo/page.tsx"), /icon: \[\{ url: "\/demo\/icons\/icon-192\.png"/);
  // every absolute path literal must belong to this app (or be a build asset / never-cached API path)
  const allowed = /^\/(demo([/?-]|$)|demo-sw\.js$|_next\/|api\/)/;
  for (const [name, src] of [["sw", sw], ["manifest", manifest], ["board", board]] as const) {
    for (const [, path] of src.matchAll(/["'`](\/[A-Za-z0-9_./-]*)["'`]/g)) {
      assert.match(path, allowed, `${name} references a path outside /demo: ${path}`);
    }
  }
  // every cache name is built from the single app-specific prefix
  assert.match(sw, /CACHE_PREFIX = "scanner-web-demo-"/);
  const names = [...sw.matchAll(/const (PRECACHE|STATIC) = `([^`]+)`/g)].map((m) => m[2]);
  assert.equal(names.length, 2);
  for (const cacheName of names) assert.match(cacheName, /^\$\{CACHE_PREFIX\}/);
  // activate only deletes its own prefix
  assert.match(sw, /n\.startsWith\(CACHE_PREFIX\)/);
  assert.match(board, /SW_URL = "\/demo-sw\.js"/);
  assert.match(board, /SW_SCOPE = "\/demo"/);
  assert.match(read("app/demo/page.tsx"), /manifest: "\/demo\/manifest\.webmanifest"/);
});

test("offline page holds no market data and loads nothing external", () => {
  const html = read("public/demo/offline.html");
  assert.doesNotMatch(html, /https?:\/\//);
  assert.doesNotMatch(html, /USDT|VR14|snapshot/i);
  assert.match(html, /\/demo\/icons\/icon-192\.png/);
});

// ---- service worker sandbox ----

type Listener = (event: unknown) => void;

function loadSw(opts: { network?: "up" | "down"; existingCaches?: string[] } = {}) {
  const listeners: Record<string, Listener> = {};
  const stores = new Map<string, Map<string, Response>>();
  for (const n of opts.existingCaches ?? []) stores.set(n, new Map());
  const fetched: string[] = [];
  const put: string[] = [];
  const keyOf = (r: Request | string) => (typeof r === "string" ? new URL(r, ORIGIN).href : r.url);
  const caches = {
    async open(name: string) {
      if (!stores.has(name)) stores.set(name, new Map());
      const s = stores.get(name)!;
      return {
        async match(r: Request | string) {
          return s.get(keyOf(r))?.clone();
        },
        async put(r: Request | string, res: Response) {
          put.push(new URL(keyOf(r)).pathname);
          s.set(keyOf(r), res);
        },
        async addAll(urls: string[]) {
          for (const u of urls) s.set(keyOf(u), new Response(`precached ${u}`));
        },
        async keys() {
          return [...s.keys()].map((k) => new Request(k));
        },
        async delete(r: Request) {
          return s.delete(keyOf(r));
        },
      };
    },
    async match(r: Request | string) {
      for (const s of stores.values()) {
        const hit = s.get(keyOf(r));
        if (hit) return hit.clone();
      }
      return undefined;
    },
    async keys() {
      return [...stores.keys()];
    },
    async delete(name: string) {
      return stores.delete(name);
    },
  };
  const fakeFetch = async (r: Request) => {
    fetched.push(new URL(r.url).pathname);
    if (opts.network === "down") throw new TypeError("Failed to fetch");
    const res = new Response(`network ${r.url}`, { status: 200 });
    Object.defineProperty(res, "type", { value: "basic" });
    return res;
  };
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (t: string, fn: Listener) => (listeners[t] = fn),
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
  };
  const ctx = vm.createContext({ self, caches, fetch: fakeFetch, URL, Request, Response, Promise, console });
  vm.runInContext(read("public/demo-sw.js"), ctx);

  const waitFor = async (type: string) => {
    let p: Promise<unknown> = Promise.resolve();
    listeners[type]({ waitUntil: (x: Promise<unknown>) => (p = x) });
    await p;
  };
  async function dispatch(path: string, init: { mode?: RequestMode; method?: string } = {}) {
    const request = new Request(new URL(path, ORIGIN), { method: init.method ?? "GET" });
    if (init.mode) Object.defineProperty(request, "mode", { value: init.mode });
    let responded: Promise<Response> | null = null;
    listeners.fetch({ request, respondWith: (x: Promise<Response>) => (responded = x) });
    return responded ? await (responded as Promise<Response>) : null;
  }
  return { ctx, install: () => waitFor("install"), activate: () => waitFor("activate"), dispatch, fetched, put, stores };
}

test("classify: API, HTML fetches, cross-origin and writes are never cached", () => {
  const { ctx } = loadSw();
  const classify = (url: string, mode: string = "cors", method = "GET") =>
    vm.runInContext("classify", ctx)({ url, mode, method }, ORIGIN);
  assert.equal(classify(`${ORIGIN}/api/anything`), "bypass");
  assert.equal(classify(`${ORIGIN}/api/anything`, "navigate"), "bypass");
  assert.equal(classify(`${ORIGIN}/api/anything`, "cors", "POST"), "bypass");
  assert.equal(classify(`${ORIGIN}/demo`, "navigate"), "navigate");
  assert.equal(classify(`${ORIGIN}/demo`, "cors"), "bypass");
  assert.equal(classify(`${ORIGIN}/demo?_rsc=abc`, "cors"), "bypass");
  assert.equal(classify(`${ORIGIN}/_next/static/chunks/app-123.js`), "static");
  assert.equal(classify(`${ORIGIN}/_next/image?url=x`), "bypass");
  assert.equal(classify(`${ORIGIN}/demo/icons/icon-192.png`), "precache");
  assert.equal(classify(`${ORIGIN}/demo/manifest.webmanifest?x=1`), "bypass");
  assert.equal(classify("https://www.tradingview.com/chart/?symbol=BINANCE:BTCUSDT.P"), "bypass");
  assert.equal(classify("https://fapi.binance.com/fapi/v1/ticker/24hr"), "bypass");
});

test("navigation is network-only; offline navigation shows the offline page", async () => {
  const up = loadSw();
  await up.install();
  assert.match(await (await up.dispatch("/demo", { mode: "navigate" }))!.text(), /^network /);
  assert.deepEqual(up.put, []);
  const down = loadSw({ network: "down" });
  await down.install();
  assert.equal(await (await down.dispatch("/demo", { mode: "navigate" }))!.text(), "precached /demo/offline.html");
});

test("hashed build assets are cache-first", async () => {
  const sw = loadSw();
  await sw.install();
  await sw.dispatch("/_next/static/chunks/a.js");
  await sw.dispatch("/_next/static/chunks/a.js");
  assert.deepEqual(sw.fetched, ["/_next/static/chunks/a.js"]);
  assert.deepEqual(sw.put, ["/_next/static/chunks/a.js"]);
});

test("activate never deletes another app's caches", async () => {
  const others = ["other-app-precache-v1", "other-app-static-v1", "scanner-web-other-v1"];
  const sw = loadSw({ existingCaches: [...others, "scanner-web-demo-static-v0"] });
  await sw.install();
  await sw.activate();
  const names = [...sw.stores.keys()];
  for (const o of others) assert.ok(names.includes(o), `${o} was deleted`);
  assert.ok(!names.includes("scanner-web-demo-static-v0"), "own old cache should be cleaned");
});

test("next.config: service worker and manifest are always revalidated; / redirects to /demo", async () => {
  const { default: config } = await import("../next.config");
  const rules = await config.headers!();
  const get = (src: string, key: string) =>
    rules.find((r) => r.source === src)?.headers.find((h) => h.key === key)?.value;
  assert.match(get("/demo-sw.js", "Cache-Control") ?? "", /no-store/);
  assert.match(get("/demo-sw.js", "Content-Type") ?? "", /javascript/);
  assert.match(get("/demo/manifest.webmanifest", "Content-Type") ?? "", /manifest\+json/);
  // Image Optimization stays disabled: no /_next/image optimizer, no native image library at runtime
  assert.equal(config.images?.unoptimized, true);
  const redirects = await config.redirects!();
  assert.deepEqual(redirects.map((r) => [r.source, r.destination]), [
    ["/", "/demo"],
    ["/favicon.ico", "/demo/icons/icon-192.png"],
  ]);
  assert.ok(existsSync(new URL("public/demo-sw.js", ROOT)));
});
