// Documentation stays consistent with the code: links resolve, commands exist,
// scenario lists match, license and brand notices are in place.

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { SCENARIOS } from "../lib/mock/scenarios";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const read = (p: string) => readFileSync(join(ROOT, p), "utf-8");

function markdownFiles(dir = ROOT, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    if (["node_modules", ".next", ".git"].includes(n)) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) markdownFiles(p, out);
    else if (n.endsWith(".md")) out.push(relative(ROOT, p));
  }
  return out;
}

const DOCS = [
  "README.md", "CONTRIBUTING.md", "SECURITY.md", "CODE_OF_CONDUCT.md", "LICENSE", "NOTICE",
  "docs/BRANDING.md", "docs/THIRD_PARTY.md", "docs/COMMUNITY.md", "docs/ROADMAP.md", "docs/BTC_RELATIONSHIPS.md",
  "docs/ARCHITECTURE.md", "docs/GOOD_FIRST_ISSUES.md",
  ".github/pull_request_template.md", ".github/ISSUE_TEMPLATE/bug_report.yml",
  ".github/ISSUE_TEMPLATE/feature_request.yml", ".github/ISSUE_TEMPLATE/research_proposal.yml",
];

test("all planned documentation files exist", () => {
  for (const f of DOCS) assert.ok(existsSync(join(ROOT, f)), f);
});

test("relative markdown links and images resolve to existing files", () => {
  const LINK = /!?\[[^\]]*\]\(([^)\s]+)\)/g;
  for (const f of markdownFiles()) {
    for (const [, target] of read(f).matchAll(LINK)) {
      if (/^(https?:|mailto:|#)/.test(target)) continue;
      const path = target.split("#")[0];
      assert.ok(existsSync(join(ROOT, dirname(f), path)), `${f} → ${target}`);
    }
  }
});

test("in-page anchors used in the README exist", () => {
  const readme = read("README.md");
  for (const [, anchor] of readme.matchAll(/\]\(#([^)]+)\)/g)) {
    const slug = (h: string) => h.trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s/g, "-");
    const headings = [...readme.matchAll(/^#+\s+(.+)$/gm)].map(([, h]) => slug(h));
    assert.ok(headings.includes(decodeURIComponent(anchor)), anchor);
  }
});

test("every npm command in the docs is a real script", () => {
  const scripts = Object.keys(JSON.parse(read("package.json")).scripts);
  const builtIn = new Set(["install", "test", "start", "query"]);
  for (const f of markdownFiles()) {
    // commands in code spans or at the start of a code line, not prose like "installed by npm from"
    for (const [, cmd] of read(f).matchAll(/(?:^|`|&& )npm (?:run )?([a-z:]+)/gm)) {
      assert.ok(scripts.includes(cmd) || builtIn.has(cmd), `${f}: npm ${cmd}`);
    }
  }
  assert.match(JSON.parse(read("package.json")).scripts.dev, /-p 3210/);
});

test("scenario lists in the docs match the code", () => {
  for (const f of ["README.md", "docs/ARCHITECTURE.md", ".github/ISSUE_TEMPLATE/bug_report.yml"]) {
    const text = read(f);
    for (const s of SCENARIOS) assert.ok(text.includes(s), `${f} is missing scenario ${s}`);
  }
});

test("LICENSE is the unmodified Apache License 2.0 text", () => {
  const license = read("LICENSE");
  assert.equal(
    createHash("sha256").update(license).digest("hex"),
    "cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30",
  );
  assert.match(license, /Apache License\s+Version 2\.0, January 2004/);
});

test("copyright and brand exclusion are stated consistently", () => {
  assert.match(read("NOTICE"), /^VESTA Scanner Web\nCopyright 2026 VESTA Lab\n/);
  for (const f of ["README.md", "NOTICE", "docs/BRANDING.md"]) {
    assert.match(read(f).replace(/\*/g, ""), /not (licensed|covered)|does not grant|excluded/i, f);
  }
  // every icon in the repository is listed as brand artwork
  const branding = read("docs/BRANDING.md");
  for (const icon of readdirSync(join(ROOT, "public/demo/icons"))) {
    assert.ok(branding.includes(`public/demo/icons/${icon}`), icon);
  }
  // no unverified legal claims
  for (const f of markdownFiles().concat(["NOTICE"])) {
    assert.doesNotMatch(read(f), /®|registered trademark|\b(Inc|Ltd|LLC|Co\.)\b/i, f);
  }
});

test("brand policy covers screenshots and the favicon use of the icons", () => {
  const branding = read("docs/BRANDING.md");
  assert.match(branding, /Screenshots in `docs\/images\/` show VESTA brand elements/);
  assert.match(branding, /site icon \(favicon\)/);
});

test("third-party notice matches the image-optimization setting", () => {
  const thirdParty = read("docs/THIRD_PARTY.md");
  assert.match(thirdParty, /LGPL-3\.0-or-later/);
  assert.match(thirdParty, /images: \{ unoptimized: true \}/);
  assert.match(read("next.config.ts"), /images: \{ unoptimized: true \}/);
  assert.doesNotMatch(thirdParty, /is not exercised by the demo/);
});

test("docs describe the fictional mock figures, not production-like ones", () => {
  const architecture = read("docs/ARCHITECTURE.md");
  assert.match(architecture, /2 of 3 market connections/);
  for (const f of markdownFiles()) assert.doesNotMatch(read(f), /\b522\b|3 of 4 market/, f);
});

test("pending items are marked, not invented", () => {
  assert.match(read("SECURITY.md"), /PENDING/);
  assert.doesNotMatch(read("CODE_OF_CONDUCT.md"), /PENDING|\[INSERT CONTACT METHOD\]/);
});

test("the Code of Conduct contact is stated in both languages and nowhere else", () => {
  const contact = ["vestainsight", "gmail.com"].join("@");
  const coc = read("CODE_OF_CONDUCT.md");
  const en = coc.split("\n").find((l) => l.includes("responsible for enforcement at")) ?? "";
  const zh = coc.split("\n").find((l) => l.includes("違反準則的情況")) ?? "";
  assert.ok(en.includes(`[${contact}](mailto:${contact})`), "English enforcement line");
  assert.ok(zh.includes(`[${contact}](mailto:${contact})`), "Chinese summary line");
  for (const f of markdownFiles().filter((f) => f !== "CODE_OF_CONDUCT.md")) {
    assert.ok(!read(f).includes(contact), `${f} must not contain the contact address`);
  }
});

test("docs never describe the BTC relationship classes as validated or live", () => {
  const text = read("docs/BTC_RELATIONSHIPS.md");
  assert.match(text, /No classification method is implemented or validated/);
  assert.match(text, /draft/i);
  for (const f of markdownFiles()) {
    assert.doesNotMatch(read(f), /validated (classification|engine) (is|was) (included|deployed)/i, f);
  }
});
