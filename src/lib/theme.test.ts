import assert from "node:assert/strict";
import test from "node:test";
import { parseTheme, themeCookieOptions } from "./theme.ts";
test("theme accepts only known choices and defaults consistently", () => {
  assert.equal(parseTheme("light"), "light");
  for (const value of [undefined, "dark", "system", "<script>", new File([], "x")]) assert.equal(parseTheme(value), "dark");
});
test("theme preference is scoped and contains no account information", () => {
  assert.deepEqual(themeCookieOptions(true), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 15552000 });
});
