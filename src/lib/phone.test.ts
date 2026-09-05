import assert from "node:assert/strict";
import test from "node:test";
import { normalisePhone, phoneFormatFor, phoneCountries, formatPhoneInput, phoneTooLong, phoneEditFits, acceptPhoneEdit } from "./phone.ts";

test("accepted phone edits preserve exactly what was typed without inserting formatting", () => {
  let draft = "";
  for (const digit of "2025550100") {
    const next = draft + digit;
    assert.equal(acceptPhoneEdit(draft, next, "US"), next);
    draft = next;
  }
  assert.equal(acceptPhoneEdit(draft, draft + "1", "US"), null);
  assert.equal(acceptPhoneEdit(draft, "2025550190", "US"), "2025550190");
  assert.equal(acceptPhoneEdit(draft, "202555010", "US"), "202555010");
  assert.equal(acceptPhoneEdit("", "+1 202 555 0100", "US"), "+1 202 555 0100");
  assert.equal(acceptPhoneEdit(draft, "2025550100999", "US"), null);
  assert.equal(acceptPhoneEdit("0".repeat(20), "0".repeat(19), "IE"), "0".repeat(19));
});

test("phone edits refuse extra digits but allow correction and formatted pastes", () => {
  assert.equal(phoneEditFits("20255501001", "US"), false);
  assert.equal(phoneEditFits("(202) 555-0100", "US"), true);
  assert.equal(phoneEditFits("+1 202 555 0100", "US"), true);
  assert.equal(phoneEditFits("+1 202 555 0100 999", "US"), false);
  assert.equal(phoneEditFits("", "US"), true);
  assert.equal(phoneEditFits("202", "US"), true);
  assert.equal(phoneEditFits("0".repeat(30), "IE"), false);
  assert.equal(phoneEditFits("020 7946 0000", "GB"), true);
  assert.equal(phoneEditFits("087 123 4567", "IE"), true);
  assert.equal(phoneEditFits("02 1234 5678", "IT"), true);
});

test("country selector covers the world with full names and matching calling codes", () => {
  assert.ok(phoneCountries.length > 200);
  assert.equal(new Set(phoneCountries.map(country => country.id)).size, phoneCountries.length);
  assert.ok(phoneCountries.some(country => country.name === "United Kingdom" && country.code === "44"));
  for (const country of phoneCountries) {
    assert.match(country.code, /^\d{1,3}$/);
    assert.ok(country.name.length > 2);
  }
  assert.equal(normalisePhone("+33 1 23 45 67 89", "FR"), "+33123456789");
  assert.equal(normalisePhone("+39 02 1234 5678", "IT"), "+390212345678");
  assert.equal(normalisePhone("+1 202 555 0100", "US"), "+12025550100");
  assert.equal(normalisePhone("+33 1 23 45 67 89", "DE"), null);
  assert.equal(normalisePhone("01 23 45 67 89", "FR"), "+33123456789");
});

test("Ireland and UK accept national spacing and normalise international notation", () => {
  assert.equal(normalisePhone("087 123 4567", "IE"), "+353871234567");
  assert.equal(normalisePhone("+353 (87) 123-4567", "IE"), "+353871234567");
  assert.equal(normalisePhone("00353 87 123 4567", "IE"), "+353871234567");
  assert.equal(normalisePhone("020 7946 0000", "GB"), "+442079460000");
  assert.equal(normalisePhone("+1 (202) 555-0100", "US"), "+12025550100");
});

test("phone entry rejects mismatched codes, extensions, unsafe input and oversized values", () => {
  for (const [phone, format] of [["+44 20 7946 0000", "IE"], ["087 123 4567", "international"], ["0871234567 ext 2", "IE"], ["+353<script>", "IE"], ["+" + "1".repeat(16), "international"], ["001234", "IE"], ["0000000000", "IE"], ["0871234567", "unknown"], ["++353871234567", "IE"]]) {
    assert.equal(normalisePhone(phone, format), null, `${phone} / ${format}`);
  }
});

test("Ireland is the default and removed modes cannot bypass validation", () => {
  assert.equal(normalisePhone("0000000000", "local"), null);
  assert.equal(normalisePhone("+353 87 111 1111", "local"), null);
  assert.equal(normalisePhone("+12025550100", "international"), null);
  assert.equal(phoneFormatFor(""), "IE");
  assert.equal(phoneFormatFor("087 123 4567"), "IE");
  assert.equal(phoneFormatFor("+353871234567"), "IE");
  assert.equal(phoneFormatFor("+442079460000"), "GB");
  assert.equal(phoneFormatFor("+12025550100"), "US");
});

test("national formatting and digit limits follow the selected country", () => {
  assert.equal(formatPhoneInput("0871234567", "IE"), "087 123 4567");
  assert.equal(formatPhoneInput("2025550100", "US"), "(202) 555-0100");
  assert.equal(phoneTooLong("20255501001", "US"), true);
  assert.equal(phoneTooLong("2025550100", "US"), false);
  assert.equal(normalisePhone("20255501001", "US"), null);
  assert.equal(normalisePhone("202555", "US"), null);
  assert.equal(normalisePhone("0000000000", "IE"), null);
  assert.equal(normalisePhone("+1 202 555 0100", "CA"), null);
  assert.equal(normalisePhone("089 123 4567", "IE"), "+353891234567");
  assert.equal(formatPhoneInput("020 7946 0000 ext 2", "GB"), "020 7946 0000 ext 2");
  assert.equal(formatPhoneInput("++442079460000", "GB"), "++442079460000");
});

test("display never invents an international prefix for placeholders", () => {
  assert.equal(formatPhoneInput("0000000000", "IE"), "0000000000");
  assert.equal(formatPhoneInput("003", "IE"), "003");
  assert.equal(normalisePhone(formatPhoneInput("0000000000", "IE"), "IE"), null);
});

test("valid matching international numbers display nationally without repeating the dropdown code", () => {
  for (const value of ["+353871234567", "00353871234567"]) {
    const display = formatPhoneInput(value, "IE");
    assert.equal(display, "087 123 4567");
    assert.equal(normalisePhone(display, "IE"), "+353871234567");
  }
  assert.equal(formatPhoneInput("+12025550100", "US"), "(202) 555-0100");
  assert.equal(formatPhoneInput("+390212345678", "IT"), "02 1234 5678");
  const mismatch = formatPhoneInput("+442079460000", "IE");
  assert.equal(mismatch, "+442079460000");
  assert.equal(normalisePhone(mismatch, "IE"), null);
});
