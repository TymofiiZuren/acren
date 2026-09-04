import assert from "node:assert/strict";
import test from "node:test";
import { parseWorkFilter, irelandToday, isOverdue } from "./work-queue.ts";
test("queue filters reject arbitrary query values", () => {
  assert.equal(parseWorkFilter("overdue"), "overdue");
  assert.equal(parseWorkFilter("completed"), "completed");
  assert.equal(parseWorkFilter("status.eq.private"), "open");
  assert.equal(parseWorkFilter(undefined), "open");
});
test("target dates use Ireland's calendar rather than UTC at midnight", () => {
  assert.equal(irelandToday(new Date("2026-06-01T23:30:00Z")), "2026-06-02");
  assert.equal(irelandToday(new Date("2026-12-01T23:30:00Z")), "2026-12-01");
});
test("only unfinished work with a past date is overdue", () => {
  assert.equal(isOverdue("planned", "2026-09-03", "2026-09-04"), true);
  assert.equal(isOverdue("in_progress", "2026-09-04", "2026-09-04"), false);
  assert.equal(isOverdue("completed", "2026-09-03", "2026-09-04"), false);
  assert.equal(isOverdue("cancelled", "2026-09-03", "2026-09-04"), false);
  assert.equal(isOverdue("planned", null, "2026-09-04"), false);
});
