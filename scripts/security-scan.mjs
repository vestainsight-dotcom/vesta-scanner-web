#!/usr/bin/env node
// Local pre-publication security scan. Read-only; no network.
//
//   node scripts/security-scan.mjs                 # source tree
//   node scripts/security-scan.mjs --build         # + the built client bundle (.next/static)
//   node scripts/security-scan.mjs --no-local      # generic rules only (ignore security.local.json)
//   node scripts/security-scan.mjs --local <file>  # use another local rules file
//   node scripts/security-scan.mjs --root <dir>    # scan another directory (used by the tests)
//   node scripts/security-scan.mjs --maintainer    # + maintainer pre-push checks (noreply identity,
//                                                  #   no credentials in remote URLs)
//
// Exits 1 on any finding. Prints file:line and the rule name only, never the
// matched text, so a real secret would not be echoed into logs.
//
// Rules in this file are generic. Maintainers can add environment-specific
// terms (names of private hosts, repositories, services) in an OPTIONAL,
// git-ignored file `security.local.json` at the project root:
//
//   { "terms": ["some-private-name"], "forbiddenPaths": ["private-dir/"] }
//
// `terms` are matched case-insensitively as plain substrings in every text file
// and in the client bundle; `forbiddenPaths` are path prefixes that must not
// exist. The file itself is never scanned or printed, and the scan fails if it
// is tracked by git or not ignored. Without it, the generic rules still apply.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const argValue = (flag) => {
  const i = process.argv.indexOf(flag);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const ROOT = resolve(argValue("--root") ?? new URL("..", import.meta.url).pathname);
const LOCAL_FILE_NAME = "security.local.json";
const LOCAL_PATH = resolve(argValue("--local") ?? join(ROOT, LOCAL_FILE_NAME));
const USE_LOCAL = !process.argv.includes("--no-local");
const SELF = new Set(["scripts/security-scan.mjs", LOCAL_FILE_NAME]);
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "out"]);
const TEXT_EXT = /\.(ts|tsx|js|mjs|cjs|json|md|css|html|webmanifest|txt|yml|yaml|toml|env|example)$|^\.[a-z]+$|^(LICENSE|NOTICE)$/i;

// [rule, regex] — generic rules, applied to every text file in the source tree
const CONTENT_RULES = [
  // credentials and tokens
  ["jwt", /eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/],
  ["private-key", /-----BEGIN [A-Z ]*(PRIVATE KEY|OPENSSH)/],
  ["aws-key", /\b(AKIA|ASIA)[0-9A-Z]{16}\b/],
  ["github-token", /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}/],
  ["google-api-key", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["slack-token", /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ["stripe-key", /\b[sr]k_(live|test)_[A-Za-z0-9]{10,}/],
  ["llm-api-key", /\bsk-(ant-|proj-)?[A-Za-z0-9_-]{20,}/],
  ["npm-token", /\bnpm_[A-Za-z0-9]{30,}|_authToken\s*=/],
  ["bearer-token", /\bBearer\s+[A-Za-z0-9._~+/-]{16,}/],
  ["generic-secret-assignment", /\b(secret|token|passw(or)?d|api[_-]?key|client[_-]?secret|webhook[_-]?secret|service[_-]?role[_-]?key)\s*[:=]\s*["'`][^"'`\s]{8,}["'`]/i],
  // connection strings and webhooks
  ["database-url", /\b(postgres(ql)?|mysql|mariadb|mongodb(\+srv)?|redis|rediss|amqp):\/\/[^\s"'`]+/i],
  ["credentials-in-url", /\bhttps?:\/\/[^\s/:@"'`]+:[^\s/@"'`]+@/],
  ["webhook-url", /hooks\.slack\.com\/services|discord(app)?\.com\/api\/webhooks|api\.telegram\.org\/bot\d/i],
  // trading execution (this project must never place orders)
  ["trading-endpoint", /\/(fapi|dapi)\/v\d\/(order|batchOrders|leverage|positionSide)|\/api\/v3\/order|\b(placeOrder|newOrder|createOrder|cancelOrder)\s*\(/],
  // private addresses, internal paths, deployment hosts
  ["ipv4", /\b(?!127\.0\.0\.1\b)(?!0\.0\.0\.0\b)(\d{1,3}\.){3}\d{1,3}\b/],
  ["internal-path", /\/(opt|srv|root)\/|\/Users\/|\/home\/[a-z]|[A-Za-z]:\\Users\\/],
  ["internal-hostname", /\b[a-z0-9-]+\.(internal|intranet|corp|lan)\b/i],
  ["deployment-host", /\.(vercel\.app|netlify\.app|pages\.dev|workers\.dev|fly\.dev|herokuapp\.com|onrender\.com|azurewebsites\.net|appspot\.com|amplifyapp\.com|railway\.app)\b/i],
  // personal data and environment
  ["email", /[A-Za-z0-9._%+-]+@(?!users\.noreply\.github\.com)(?!example\.)[A-Za-z0-9-]+\.[A-Za-z0-9.-]*[a-z]{2,}\b/],
  ["env-read", /process\.env\.(?!NODE_ENV\b)[A-Z_]+|import\.meta\.env\./],
];
// network calls are allowed only in the service worker (same-origin static assets)
const NETWORK_RULE = ["network-call", /\bfetch\s*\(|XMLHttpRequest|new WebSocket|new EventSource|navigator\.sendBeacon/];
const NETWORK_ALLOWED = new Set(["public/demo-sw.js"]);
// rules also applied to the built client bundle
const BUNDLE_RULES = new Set([
  "jwt", "private-key", "aws-key", "github-token", "google-api-key", "slack-token", "stripe-key", "llm-api-key",
  "npm-token", "bearer-token", "database-url", "credentials-in-url", "webhook-url", "trading-endpoint",
  "internal-path", "deployment-host",
]);

// files that must never exist in the project: secrets and deployment configuration
const FORBIDDEN_FILES = [
  /(^|\/)\.env(\..*)?$/, /\.(pem|key|p12|pfx|jks|keystore)$/, /(^|\/)id_(rsa|dsa|ecdsa|ed25519)(\.pub)?$/,
  /(^|\/)\.npmrc$/, /(^|\/)\.netrc$/, /(^|\/)credentials(\.json)?$/, /(^|\/)service[-_]?account.*\.json$/,
  /^vercel\.json$/, /^netlify\.toml$/, /^fly\.toml$/, /^wrangler\.toml$/, /^render\.yaml$/, /^app\.yaml$/,
  /^Procfile$/, /^CNAME$/, /(^|\/)Dockerfile$/, /(^|\/)docker-compose\.ya?ml$/, /^\.github\/workflows\//,
  /(^|\/)\.vercel\//, /(^|\/)\.netlify\//,
];
// Published contact addresses: each is accepted by the email rule ONLY in the one
// file that publishes it, and still flagged anywhere else. All other rules apply.
const PUBLIC_CONTACTS = new Map([["CODE_OF_CONDUCT.md", ["vestainsight@gmail.com"]]]);
const ALLOWED_DEPS = new Set([
  "next", "react", "react-dom", "zod",
  "@tailwindcss/postcss", "@types/node", "@types/react", "@types/react-dom", "eslint", "eslint-config-next",
  "tailwindcss", "typescript",
]);

const findings = [];
const add = (file, line, rule) => findings.push(`${file}${line ? `:${line}` : ""}  [${rule}]`);

// ---- optional local rules (never printed) ----
let localTerms = [];
let localPaths = [];
let localLoaded = false;
if (USE_LOCAL && existsSync(LOCAL_PATH)) {
  try {
    const cfg = JSON.parse(readFileSync(LOCAL_PATH, "utf-8"));
    const strings = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim().length >= 3) : []);
    localTerms = strings(cfg.terms).map((t) => t.toLowerCase());
    localPaths = strings(cfg.forbiddenPaths);
    localLoaded = true;
  } catch {
    add(LOCAL_FILE_NAME, 0, "local-rules-unreadable"); // fail closed
  }
}
const localHit = (text) => {
  const lower = text.toLowerCase();
  return localTerms.some((t) => lower.includes(t));
};

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(relative(ROOT, p));
  }
  return out;
}

const files = walk(ROOT);
for (const f of files) {
  for (const re of FORBIDDEN_FILES) if (re.test(f)) add(f, 0, "forbidden-file");
  for (const p of localPaths) if (f.startsWith(p)) add(f, 0, "local-forbidden-path");
  if (SELF.has(f) || !TEXT_EXT.test(f.split("/").pop()) || f === "package-lock.json") continue;
  const lines = readFileSync(join(ROOT, f), "utf-8").split("\n");
  const contacts = PUBLIC_CONTACTS.get(f) ?? [];
  lines.forEach((text, i) => {
    const emailText = contacts.reduce((t, a) => t.split(a).join(""), text);
    for (const [rule, re] of CONTENT_RULES) if (re.test(rule === "email" ? emailText : text)) add(f, i + 1, rule);
    if (!NETWORK_ALLOWED.has(f) && !f.startsWith("tests/") && NETWORK_RULE[1].test(text)) add(f, i + 1, NETWORK_RULE[0]);
    if (localTerms.length && localHit(text)) add(f, i + 1, "local-term");
  });
}

// dependencies: only the allowlist; lockfile only from the public registry
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));
for (const d of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) {
  if (!ALLOWED_DEPS.has(d)) add("package.json", 0, `unexpected-dependency:${d}`);
}
if (pkg.private !== true) add("package.json", 0, "package-not-private");
const lock = existsSync(join(ROOT, "package-lock.json")) ? readFileSync(join(ROOT, "package-lock.json"), "utf-8") : "";
if (/"resolved": "(?!https:\/\/registry\.npmjs\.org\/)/.test(lock)) add("package-lock.json", 0, "non-npm-registry");
if (lock && localTerms.length && localHit(lock)) add("package-lock.json", 0, "local-term");

// git: if a repository exists, the local rules file must stay untracked and ignored.
// With --maintainer, also check the maintainer's publishing setup before a push:
// remote URLs carry no embedded credentials, and every commit and the repo-local
// user.email use a GitHub noreply address. Contributors' clones are not held to this.
const MAINTAINER = process.argv.includes("--maintainer");
if (existsSync(join(ROOT, ".git"))) {
  const git = (...a) => execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  const gitOk = (...a) => {
    try {
      git(...a);
      return true;
    } catch {
      return false;
    }
  };
  if (MAINTAINER) {
    for (const line of git("remote", "-v").split("\n").filter(Boolean)) {
      if (/:\/\/[^/@\s]+@/.test(line)) add(".git/config", 0, "git-remote-credentials");
    }
    let commits = [];
    try {
      commits = git("rev-list", "--all").split("\n").filter(Boolean);
    } catch {
      commits = []; // no commits yet
    }
    for (const c of commits) {
      const email = git("show", "-s", "--format=%ae%n%ce", c).split("\n");
      for (const e of email) if (!e.endsWith("@users.noreply.github.com")) add(`.git ${c.slice(0, 8)}`, 0, "non-noreply-author");
    }
    let local = "";
    try {
      local = git("config", "--local", "user.email");
    } catch {
      local = "";
    }
    if (!local.endsWith("@users.noreply.github.com")) add(".git/config", 0, "local-user.email-not-noreply");
  }
  if (gitOk("ls-files", "--error-unmatch", LOCAL_FILE_NAME)) add(LOCAL_FILE_NAME, 0, "local-rules-tracked");
  if (!gitOk("check-ignore", "-q", "--no-index", LOCAL_FILE_NAME)) add(".gitignore", 0, "local-rules-not-ignored");
}

// built client bundle: no secrets, internal paths, deployment hosts or local terms shipped to browsers
if (process.argv.includes("--build")) {
  const dir = join(ROOT, ".next", "static");
  if (!existsSync(dir)) add(".next/static", 0, "missing-build (run npm run build first)");
  else {
    const walkAll = (d, out = []) => {
      for (const n of readdirSync(d)) {
        const p = join(d, n);
        if (statSync(p).isDirectory()) walkAll(p, out);
        else out.push(p);
      }
      return out;
    };
    for (const p of walkAll(dir)) {
      if (p.endsWith(".map")) add(relative(ROOT, p), 0, "bundle-source-map");
      if (!/\.(js|css|json|html)$/.test(p)) continue;
      const text = readFileSync(p, "utf-8");
      for (const [rule, re] of CONTENT_RULES) if (BUNDLE_RULES.has(rule) && re.test(text)) add(relative(ROOT, p), 0, `bundle-${rule}`);
      if (localTerms.length && localHit(text)) add(relative(ROOT, p), 0, "bundle-local-term");
    }
  }
}

const mode =
  (!USE_LOCAL ? "generic rules only" : localLoaded ? "generic + local rules" : "generic rules (no local rules file)") +
  (MAINTAINER ? ", maintainer checks" : "");
if (findings.length) {
  console.error(`security scan: ${findings.length} finding(s) [${mode}]`);
  for (const f of findings) console.error("  " + f);
  process.exit(1);
}
console.log(`security scan: OK (${files.length} files${process.argv.includes("--build") ? " + client bundle" : ""}) [${mode}]`);
