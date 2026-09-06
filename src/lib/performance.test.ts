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
