import test from "node:test";
import assert from "node:assert/strict";
import { hasClientChanges } from "./form-changes.ts";

test("detects edits in every client field and reverting to the original", () => {
  const original = { name: "Test", herd_number: "TEST01", county: "Cork", phone: "0000000000", email: "test@example.test" };
  assert.equal(hasClientChanges(original, { ...original }), false);
  for (const field of Object.keys(original)) assert.equal(hasClientChanges(original, { ...original, [field]: "changed" }), true);
  assert.equal(hasClientChanges(original, { ...original, name: "Test " }), true);
});
