import type { Metadata, Viewport } from "next";
import { DemoApp } from "@/components/demo-app";
import { DEFAULT_LOCALE, MESSAGES } from "@/lib/i18n/messages";

const m = MESSAGES[DEFAULT_LOCALE];

export const metadata: Metadata = {
  title: m.meta.title,
  description: m.meta.description,
  // a demo with simulated data: keep it out of search results
  robots: { index: false, follow: false },
  // PWA, scoped to /demo only
  manifest: "/demo/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Scanner Demo", statusBarStyle: "default" },
  // page-level `icons` replaces the layout's, so the site icon is declared here too
  icons: {
    icon: [{ url: "/demo/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/demo/icons/apple-touch-icon-180.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = { themeColor: "#f4f4f5" };

// Fully static: the first render is the default scenario at the fixed simulated
// epoch, so the server HTML and the first browser render are identical.
export default function DemoPage() {
  return <DemoApp />;
}
