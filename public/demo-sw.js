// VESTA Scanner Web — demo service worker (scope /demo).
//
// Isolation: own file name, own scope (/demo) and own cache-name prefix
// ("scanner-web-demo-"), which does not overlap any other VESTA app's caches;
// on activate it only ever deletes caches with its own prefix.
//
// Caches ONLY static, non-market resources:
//   - /_next/static/*  (content-hashed build assets, immutable)
//   - /demo/icons/*, the manifest and the offline fallback page
// Never cached / never intercepted: /api/* (no API exists in this app; the rule
// guards any future one), the /demo HTML itself, any non-GET request, any
// cross-origin request (TradingView links, any market API).
// When a navigation fails because the device is offline, the precached offline
// page is shown.

const CACHE_PREFIX = "scanner-web-demo-";
const VERSION = "v1";
const PRECACHE = `${CACHE_PREFIX}precache-${VERSION}`;
const STATIC = `${CACHE_PREFIX}static-${VERSION}`;
const OFFLINE_URL = "/demo/offline.html";
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/demo/manifest.webmanifest",
  "/demo/icons/icon-192.png",
  "/demo/icons/icon-512.png",
  "/demo/icons/apple-touch-icon-180.png",
];
const STATIC_MAX_ENTRIES = 80;

/** Decide how a request is handled: "navigate" | "precache" | "static" | "bypass". */
function classify(request, origin) {
  if (request.method !== "GET") return "bypass";
  const url = new URL(request.url);
  if (url.origin !== origin) return "bypass";
  if (url.pathname.startsWith("/api/")) return "bypass";
  if (request.mode === "navigate") return "navigate";
  if (PRECACHE_URLS.includes(url.pathname) && url.search === "") return "precache";
  if (url.pathname.startsWith("/_next/static/")) return "static";
  return "bypass";
}

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok && res.type === "basic") {
    await cache.put(request, res.clone());
    if (cacheName === STATIC) trim(STATIC, STATIC_MAX_ENTRIES);
  }
  return res;
}

async function networkOnlyNavigation(request) {
  try {
    return await fetch(request); // never stored
  } catch (err) {
    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;
    throw err;
  }
}

if (typeof self !== "undefined" && typeof self.addEventListener === "function") {
  self.addEventListener("install", (event) => {
    event.waitUntil(
      caches.open(PRECACHE).then((c) => c.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()),
    );
  });

  self.addEventListener("activate", (event) => {
    event.waitUntil(
      caches
        .keys()
        .then((names) =>
          Promise.all(
            names
              .filter((n) => n.startsWith(CACHE_PREFIX) && n !== PRECACHE && n !== STATIC)
              .map((n) => caches.delete(n)),
          ),
        )
        .then(() => self.clients.claim()),
    );
  });

  self.addEventListener("fetch", (event) => {
    const kind = classify(event.request, self.location.origin);
    if (kind === "navigate") event.respondWith(networkOnlyNavigation(event.request));
    else if (kind === "precache") event.respondWith(cacheFirst(event.request, PRECACHE));
    else if (kind === "static") event.respondWith(cacheFirst(event.request, STATIC));
    // "bypass": no respondWith -> the browser handles it normally, uncached by us
  });
}
