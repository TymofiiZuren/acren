import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

test("database-backed workspace pages are not prefetched as a navigation burst", async () => {
  const source = await readFile(new URL("../components/workspace-nav.tsx", import.meta.url), "utf8");
  assert.match(source, /<Link[^>]+prefetch=\{false\}/);
});

test("protected routes use the no-prefetch link boundary", async () => {
  const root = new URL("../app/(app)/", import.meta.url);
  const entries = await readdir(root, { recursive: true });
  const routeFiles = entries.filter((entry) => entry.endsWith(".tsx"));
  const privateComponents = [
    "billing-forms.tsx",
    "client-advisor.tsx",
    "client-directory.tsx",
    "client-form.tsx",
    "client-invoices.tsx",
    "client-jobs.tsx",
    "job-form.tsx",
    "rate-form.tsx",
  ];

  for (const entry of routeFiles) {
    const source = await readFile(new URL(entry, root), "utf8");
    assert.doesNotMatch(source, /from ["']next\/link["']/, `${entry} bypasses PrivateLink`);
  }
  for (const entry of privateComponents) {
    const source = await readFile(new URL(`../components/${entry}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /from ["']next\/link["']/, `${entry} bypasses PrivateLink`);
  }
});

test("protected renders verify signed claims without an Auth user lookup", async () => {
  const source = await readFile(new URL("require-session.ts", import.meta.url), "utf8");
  assert.match(source, /auth\.getClaims\(\)/);
  assert.doesNotMatch(source, /auth\.getUser\(\)/);
});

test("public and authentication pages bypass session refresh middleware", async () => {
  const source = await readFile(new URL("../proxy.ts", import.meta.url), "utf8");
  for (const route of ["clients", "jobs", "rates", "billing", "invoices", "privacy-centre"]) {
    assert.match(source, new RegExp(`/${route}/:path\\*`));
  }
  assert.doesNotMatch(source, /\/\(\(\?!_next/);
});

test("the root layout stays static and restores only a device-local theme", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const switcher = await readFile(new URL("../components/theme-switch.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(layout, /next\/headers|await cookies\(\)/);
  assert.match(layout, /localStorage\.getItem/);
  assert.match(switcher, /localStorage\.setItem/);
  assert.doesNotMatch(switcher, /actions\/theme|await cookies\(\)/);
});

test("public links do not trigger speculative route requests", async () => {
  const files = [
    "../app/page.tsx",
    "../app/privacy/page.tsx",
    "../app/(auth)/layout.tsx",
    "../components/auth-form.tsx",
  ];
  for (const file of files) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    for (const link of source.matchAll(/<Link\b[^>]*>/g)) {
      assert.match(link[0], /prefetch=\{false\}/, `${file} contains a speculative link`);
    }
  }
});

test("login remains static while preserving the confirmation notice", async () => {
  const page = await readFile(new URL("../app/(auth)/login/page.tsx", import.meta.url), "utf8");
  const actions = await readFile(new URL("../app/actions/auth.ts", import.meta.url), "utf8");
  assert.doesNotMatch(page, /searchParams/);
  assert.match(page, /id="confirm"/);
  assert.match(page, /target:block/);
  assert.match(actions, /redirect\("\/login#confirm"\)/);
});
