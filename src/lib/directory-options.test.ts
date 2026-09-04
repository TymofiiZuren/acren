import assert from "node:assert/strict";
import test from "node:test";
import { parseDirectoryOptions, contactLinks } from "./directory-options.ts";

test("filters default safely and accept county and supported sort", () => {
  assert.deepEqual(parseDirectoryOptions("", "name"), { county: "", sort: "name", pageSize: 25 });
  assert.deepEqual(parseDirectoryOptions("Cork", "recent"), { county: "Cork", sort: "recent", pageSize: 25 });
  assert.equal(parseDirectoryOptions("Invalid", "name"), null);
  assert.equal(parseDirectoryOptions("Cork", "consultant_id"), null);
});
test("page sizes are limited to compact, standard and large lists", () => {
  for (const size of [10, 25, 50]) assert.equal(parseDirectoryOptions("", "name", String(size))?.pageSize, size);
  for (const size of ["0", "-1", "100000", "25.5", "", "025", null, {}, new Blob()]) {
    assert.equal(parseDirectoryOptions("", "name", size), null);
  }
});
test("contact links do not permit injected email headers or arbitrary URI schemes", () => {
  assert.deepEqual(contactLinks("a@example.test", "+353 (87) 123-4567"), { email: "mailto:a%40example.test", phone: "tel:+353871234567" });
  assert.equal(contactLinks("a@example.test?bcc=other@test.com", "javascript:alert(1)").email, undefined);
  assert.equal(contactLinks("a@example.test\r\nbcc:x@y.com", "123").email, undefined);
  assert.equal(contactLinks("a@example.test", "123").phone, undefined);
});
