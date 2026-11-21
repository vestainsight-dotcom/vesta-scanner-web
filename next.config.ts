import type { NextConfig } from "next";

// Demo PWA lives under /demo with its own service worker (/demo-sw.js) and its
// own cache names, so it can never touch another VESTA app's PWA on the same origin.
const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The demo uses no optimized images. Disabling Image Optimization keeps the
  // /_next/image endpoint (and the native image library behind it) out of use
  // when the demo is served with `next start`.
  images: { unoptimized: true },
  async headers() {
    return [
      {
        // always revalidated so updates reach installed apps
        source: "/demo-sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
      {
        source: "/demo/manifest.webmanifest",
        headers: [
          { key: "Content-Type", value: "application/manifest+json; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/demo/offline.html",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/", destination: "/demo", permanent: false },
      // clients that request /favicon.ico directly get the existing app icon
      { source: "/favicon.ico", destination: "/demo/icons/icon-192.png", permanent: false },
    ];
  },
};

export default nextConfig;
