import assert from "node:assert/strict";
import test from "node:test";
import { parseJobInput, jobTransitions, parseJobPage } from "./jobs.ts";

test("job input trims titles and keeps optional target dates date-only", () => {
  const form = new FormData();
  form.set("title", "  Prepare application  ");
  assert.deepEqual(parseJobInput(form).values, { title: "Prepare application", target_date: null });
  form.set("target_date", "2028-02-29");
  assert.equal(parseJobInput(form).ok, true);
});

test("job input rejects impossible dates, long titles and file fields", () => {
  const form = new FormData();
  form.set("title", "x".repeat(121));
  form.set("target_date", "2026-02-29");
  assert.deepEqual(Object.keys(parseJobInput(form).errors), ["title", "target_date"]);
  for (const date of ["today", "2026-2-01", "1999-12-31", "2101-01-01"]) {
    form.set("target_date", date);
    assert.ok(parseJobInput(form).errors.target_date);
  }
  form.set("title", new File(["test"], "test.txt"));
  form.set("target_date", new File(["test"], "date.txt"));
  assert.equal(parseJobInput(form).ok, false);
});

test("job stages require starting work before completion and allow corrections", () => {
  assert.deepEqual(jobTransitions.planned, ["in_progress", "cancelled"]);
  assert.deepEqual(jobTransitions.in_progress, ["completed", "cancelled"]);
  assert.deepEqual(jobTransitions.completed, ["in_progress"]);
  assert.deepEqual(jobTransitions.cancelled, ["planned"]);
});

test("job pagination is bounded and does not accept malformed input", () => {
  assert.equal(parseJobPage("2"), 2);
  for (const value of [undefined, "-1", "1.5", "Infinity", "10001", "x"]) assert.equal(parseJobPage(value), 1);
});
