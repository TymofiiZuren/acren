import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("database-backed workspace pages are not prefetched as a navigation burst", async () => {
  const source = await readFile(new URL("../components/workspace-nav.tsx", import.meta.url), "utf8");
  assert.match(source, /<Link[^>]+prefetch=\{false\}/);
});
