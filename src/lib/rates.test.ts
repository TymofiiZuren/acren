import assert from "node:assert/strict";
import test from "node:test";
import { parseRateInput } from "./rates.ts";

function form(price = "150.25", unit = "fixed", name = "Application review") {
  const data = new FormData();
  data.set("name", name); data.set("price", price); data.set("unit", unit);
  return data;
}
test("rates convert decimal EUR to exact whole cents", () => {
  assert.deepEqual(parseRateInput(form()), { ok: true, values: { name: "Application review", price_cents: 15025, unit: "fixed" } });
  for (const [price, cents] of [["0", 0], ["0.29", 29], ["1.1", 110], ["1000000.00", 100000000]] as const) {
    const result = parseRateInput(form(price));
    assert.ok(result.ok); assert.equal(result.values.price_cents, cents);
  }
});
test("rates reject malformed amounts and unsupported inputs", () => {
  for (const price of ["", "-1", "1e3", "1,200", "1.001", "NaN", "Infinity", "1000000.01"]) assert.equal(parseRateInput(form(price)).ok, false);
  assert.equal(parseRateInput(form("1", "unknown")).ok, false);
  assert.equal(parseRateInput(form("1", "fixed", " ")).ok, false);
  assert.equal(parseRateInput(form("1", "fixed", "a".repeat(121))).ok, false);
  const data = form(); data.set("price", new File(["1"], "price.txt"));
  assert.equal(parseRateInput(data).ok, false);
});
