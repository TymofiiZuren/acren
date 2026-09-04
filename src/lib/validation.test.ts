import assert from "node:assert/strict";
import test from "node:test";
import { parseClientInput } from "./validation.ts";

test("normalises a valid client record", () => {
  const input = new FormData();
  input.set("name", "  Aoife Murphy ");
  input.set("herd_number", " c-10001 ");
  input.set("county", "Cork");
  input.set("phone", "+353 87 111 1111");
  input.set("email", " AOIFE@EXAMPLE.COM ");

  const result = parseClientInput(input);
  assert.equal(result.ok, true);
  assert.deepEqual(result.values, {
    name: "Aoife Murphy",
    herd_number: "C-10001",
    county: "Cork",
    phone: "+353871111111",
    email: "aoife@example.com",
  });
});

test("returns field errors for malformed input", () => {
  const result = parseClientInput(new FormData());
  assert.equal(result.ok, false);
  assert.deepEqual(Object.keys(result.errors).sort(), ["county", "email", "herd_number", "name", "phone"]);
});

test("rejects unsupported counties and file uploads in text fields", () => {
  const input = new FormData();
  input.set("county", "not a county");
  input.set("name", new File(["test"], "test.txt"));
  const result = parseClientInput(input);
  assert.equal(result.ok, false);
  assert.ok(result.errors.county);
  assert.ok(result.errors.name);
});

test("client input applies the selected phone format on the server", () => {
  const form = new FormData();
  for (const [key, value] of Object.entries({name:"Demo",herd_number:"DEMO-1",county:"Cork",phone:"087 123 4567",email:"demo@example.test",phone_format:"IE"})) form.set(key,value);
  const valid = parseClientInput(form);
  assert.equal(valid.ok,true);
  assert.equal(valid.values.phone,"+353871234567");
  assert.equal("phone_format" in valid.values,false);
  form.set("phone_format","GB");
  form.set("phone","+353871234567");
  assert.equal(parseClientInput(form).ok,false);
  form.set("phone_format",new File(["IE"],"format.txt"));
  assert.equal(parseClientInput(form).ok,false);
  form.set("phone_format", "local");
  assert.equal(parseClientInput(form).ok, false);
  form.set("phone_format", "US");
  form.set("phone", "20255501001");
  assert.equal(parseClientInput(form).ok, false);
  form.set("phone", "2025550100");
  assert.equal(parseClientInput(form).values.phone, "+12025550100");
});
