// The security scan passes on this repository and catches planted problems.
// Every planted value is synthetic: secret-shaped strings are assembled from
// fragments at runtime and only written to temp directories, so no
// secret-shaped string, real hostname or private name exists in this file.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const SCRIPT = new URL("../scripts/security-scan.mjs", import.meta.url).pathname;
const run = (...args: string[]) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf-8" });
const j = (...p: string[]) => p.join("");

function tempProject(files: Record<string, string>, deps: Record<string, string> = { next: "1" }) {
  const dir = mkdtempSync(join(tmpdir(), "scan-"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ private: true, dependencies: deps }));
  for (const [path, content] of Object.entries(files)) {
    const parts = path.split("/");
    if (parts.length > 1) mkdirSync(join(dir, ...parts.slice(0, -1)), { recursive: true });
    writeFileSync(join(dir, ...parts), content);
  }
  return dir;
}

const rulesIn = (stderr: string) => new Set([...stderr.matchAll(/\[([a-z0-9:@/.-]+)\]/g)].map((m) => m[1].split(":")[0]));

test("repository passes the scan with generic rules only (fresh public checkout)", () => {
  const r = run("--no-local");
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /generic rules only/);
});

test("repository passes the scan in default mode (local rules if present)", () => {
  const r = run();
  assert.equal(r.status, 0, r.stderr);
});

test("generic rules catch planted credentials, addresses, paths, calls and files", () => {
  const fake = {
    jwt: j("ey", "J", "a".repeat(20), ".", "b".repeat(12)),
    aws: j("AK", "IA", "ABCDEFGHIJKLMNOP"),
    db: j("postgres", "://user:pw", "@", "db.example.test:5432/app"),
    bearer: j("Bear", "er ", "c".repeat(24)),
    secret: j("api", "_key = \"", "d".repeat(16), "\""),
  };
  const dir = tempProject(
    {
      "lib/bad.ts": [
        `const k = "${fake.jwt}";`,
        `const a = "${fake.aws}";`,
        `const d = "${fake.db}";`,
        `const h = { authorization: "${fake.bearer}" };`,
        `const ${fake.secret};`,
        `const host = "https://${j("acme-demo", ".netlify", ".app")}";`,
        `const ip = "${j("10", ".1", ".2", ".3")}";`,
        `const p = "${j("/o", "pt/", "x")}";`,
        `const n = "${j("build-box", ".inter", "nal")}";`,
        `void fetch(host);`,
        `const e = process.env.${j("SOME_", "SECRET")};`,
        `${j("place", "Order")}({});`,
      ].join("\n"),
      [j(".e", "nv")]: "X=1",
      [j("vercel", ".json")]: "{}",
      Dockerfile: "FROM scratch",
      [j(".np", "mrc")]: "registry=x",
      [j("keys/id_", "rsa")]: "x",
    },
    { next: "1", [j("left-pad-", "private")]: "1" },
  );
  try {
    const r = run("--root", dir);
    assert.equal(r.status, 1);
    const rules = rulesIn(r.stderr);
    for (const rule of [
      "jwt", "aws-key", "database-url", "bearer-token", "generic-secret-assignment", "deployment-host", "ipv4",
      "internal-path", "internal-hostname", "network-call", "env-read", "trading-endpoint", "forbidden-file",
      "unexpected-dependency",
    ]) {
      assert.ok(rules.has(rule), `${rule} not detected:\n${r.stderr}`);
    }
    // findings name the rule, never echo the matched values
    for (const v of Object.values(fake)) assert.ok(!r.stderr.includes(v) && !r.stdout.includes(v));
    assert.doesNotMatch(r.stderr, /aaaaaaaaaaaa|ABCDEFGHIJKLMNOP|cccccccccccc/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("optional local rules add private terms and paths without ever printing them", () => {
  const term = j("acme-", "internal-", "sync");
  const dir = tempProject({
    "lib/notes.ts": `// talks to the ${term.toUpperCase()} service\n`,
    "private-pipeline/run.txt": "x",
    "security.local.json": JSON.stringify({ terms: [term], forbiddenPaths: ["private-pipeline/"] }),
  });
  try {
    const withLocal = run("--root", dir);
    assert.equal(withLocal.status, 1);
    const rules = rulesIn(withLocal.stderr);
    assert.ok(rules.has("local-term"), withLocal.stderr);
    assert.ok(rules.has("local-forbidden-path"), withLocal.stderr);
    assert.match(withLocal.stderr, /generic \+ local rules/);
    assert.ok(!withLocal.stderr.toLowerCase().includes(term) && !withLocal.stdout.toLowerCase().includes(term));
    // the local rules file itself is never reported as a finding
    assert.doesNotMatch(withLocal.stderr, /security\.local\.json:\d/);

    const generic = run("--root", dir, "--no-local");
    assert.equal(generic.status, 0, generic.stderr);
    assert.match(generic.stdout, /generic rules only/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the published contact address is accepted only in CODE_OF_CONDUCT.md", () => {
  const contact = j("vestainsight", "@", "gmail.com");
  const ok = tempProject({ "CODE_OF_CONDUCT.md": `report to ${contact}\n` });
  const elsewhere = tempProject({ "README.md": `mail ${contact}\n`, "lib/x.ts": `// ${contact}\n` });
  const other = tempProject({ "CODE_OF_CONDUCT.md": `report to ${j("someone", "@", "gmail.com")}\n` });
  try {
    assert.equal(run("--root", ok).status, 0);
    const bad = run("--root", elsewhere);
    assert.equal(bad.status, 1);
    assert.match(bad.stderr, /README\.md:1 {2}\[email\]/);
    assert.match(bad.stderr, /lib\/x\.ts:1 {2}\[email\]/);
    // any other address in the Code of Conduct is still flagged
    assert.match(run("--root", other).stderr, /CODE_OF_CONDUCT\.md:1 {2}\[email\]/);
  } finally {
    for (const d of [ok, elsewhere, other]) rmSync(d, { recursive: true, force: true });
  }
});

test("an unreadable local rules file fails closed", () => {
  const dir = tempProject({ "security.local.json": "{ not json" });
  try {
    const r = run("--root", dir);
    assert.equal(r.status, 1);
    assert.ok(rulesIn(r.stderr).has("local-rules-unreadable"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("contributor clones pass; identity checks run only with --maintainer", () => {
  const dir = tempProject({ ".gitignore": "security.local.json\n", "README.md": "demo\n" });
  const git = (...a: string[]) => spawnSync("git", ["-C", dir, ...a], { encoding: "utf-8" });
  try {
    // a typical contributor clone: a remote, their own address, their own commit
    git("init", "-q", "-b", "main");
    git("config", "user.name", "Contributor");
    git("config", "user.email", "dev@example.test");
    git("remote", "add", "origin", "https://github.com/example/demo.git");
    git("add", "-A");
    git("commit", "-q", "-m", "contributor change");
    const contributor = run("--root", dir);
    assert.equal(contributor.status, 0, contributor.stderr);

    // the maintainer's pre-push check flags the non-noreply identity
    const maintainer = run("--root", dir, "--maintainer");
    assert.equal(maintainer.status, 1);
    const rules = rulesIn(maintainer.stderr);
    assert.ok(rules.has("non-noreply-author"), maintainer.stderr);
    assert.ok(rules.has("local-user.email-not-noreply"), maintainer.stderr);
    assert.ok(!rules.has("git-remote-credentials"), maintainer.stderr);

    // credentials embedded in a remote URL are flagged, never echoed
    const pw = j("p", "w", "1234567");
    git("remote", "set-url", "origin", j("https://", "user:", pw, "@", "github.com/example/demo.git"));
    const withCreds = run("--root", dir, "--maintainer");
    assert.ok(rulesIn(withCreds.stderr).has("git-remote-credentials"), withCreds.stderr);
    assert.ok(!withCreds.stderr.includes(pw) && !withCreds.stdout.includes(pw));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("git guard: the local rules file must be ignored and never tracked", () => {
  const dir = tempProject({ "security.local.json": JSON.stringify({ terms: [] }) });
  const git = (...a: string[]) => spawnSync("git", ["-C", dir, ...a], { encoding: "utf-8" });
  try {
    git("init", "-q", "-b", "main");
    git("config", "user.email", "0+test@users.noreply.github.com");
    const notIgnored = run("--root", dir);
    assert.ok(rulesIn(notIgnored.stderr).has("local-rules-not-ignored"), notIgnored.stderr);

    writeFileSync(join(dir, ".gitignore"), "security.local.json\n");
    const ignored = run("--root", dir);
    assert.equal(ignored.status, 0, ignored.stderr);

    git("add", "-f", "security.local.json");
    const tracked = run("--root", dir);
    assert.ok(rulesIn(tracked.stderr).has("local-rules-tracked"), tracked.stderr);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
