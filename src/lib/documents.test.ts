import assert from "node:assert/strict";
import test from "node:test";
import { validateDocument, documentObjectName, validDocumentObject, MAX_DOCUMENT_BYTES } from "./documents.ts";

test("accepts bounded PDF uploads and normalizes neutral filenames", async () => {
  const file = new File(["%PDF-1.7\nfictional\n%%EOF"], "Example Form.PDF", { type: "application/pdf" });
  assert.equal(await validateDocument(file), null);
  const object = documentObjectName("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", file.name);
  assert.equal(object, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa--Example-Form.pdf");
  assert.equal(validDocumentObject(object), true);
});
test("rejects disguised files, empty uploads, oversized documents and path traversal", async () => {
  assert.ok(await validateDocument(null));
  assert.ok(await validateDocument(new File([], "empty.pdf", { type: "application/pdf" })));
  assert.ok(await validateDocument(new File(["<html>"], "fake.pdf", { type: "application/pdf" })));
  assert.ok(await validateDocument(new File(["%PDF-1.7"], "fake.html", { type: "text/html" })));
  assert.ok(await validateDocument(new File([new Uint8Array(MAX_DOCUMENT_BYTES + 1)], "large.pdf", { type: "application/pdf" })));
  assert.equal(validDocumentObject("../../another-client/file.pdf"), false);
  assert.equal(validDocumentObject('a.pdf\r\nX-Header: bad'), false);
});
