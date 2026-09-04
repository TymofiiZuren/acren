import assert from "node:assert/strict";
import test from "node:test";
import { parseSearch, noticeMessage, securityHeaders, sessionCookieOptions } from "./privacy.ts";

test("search accepts Irish names, bounds pages, and rejects filter syntax", () => {
  assert.deepEqual(parseSearch(" Seán O’Brien ", "2"), { term: "Seán O’Brien", page: 2 });
  for (const term of ["a%,id.gt.0", "x_", 'a"', "a".repeat(121)]) assert.equal(parseSearch(term, 0), null);
  for (const page of [-1, 1.5, Infinity, "oops", 100001]) assert.equal(parseSearch("", page), null);
});

test("notices never display user-supplied messages", () => {
  assert.equal(noticeMessage("added"), "Client added.");
  assert.equal(noticeMessage("Your account is blocked: call this number"), undefined);
});

test("browser policy blocks framing, referrers and unnecessary device access", () => {
  const headers = Object.fromEntries(securityHeaders().map(({ key, value }) => [key, value]));
  assert.equal(headers["Referrer-Policy"], "no-referrer");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.match(headers["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.match(headers["Content-Security-Policy"], /object-src 'none'/);
  assert.match(headers["Permissions-Policy"], /camera=\(\)/);
});

test("session cookies cannot be read by scripts and require HTTPS in production", () => {
  assert.deepEqual(sessionCookieOptions(true), { httpOnly: true, sameSite: "lax", secure: true, path: "/" });
  assert.equal(sessionCookieOptions(false).httpOnly, true);
  assert.equal(sessionCookieOptions(false).secure, false);
});
