import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
function color(token: string, source = css) {
  const match = source.match(new RegExp(`--${token}: (#[0-9a-f]{6});`));
  assert.ok(match, `Missing design token ${token}`);
  return match[1];
}
function luminance(hex: string) {
  const c = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255)
    .map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
}
function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
test("dark field boundaries remain distinguishable", () => {
  assert.ok(contrast(color("color-stone-300"), color("color-surface")) >= 3);
});
test("fine text and primary button labels retain readable contrast", () => {
  assert.ok(contrast(color("color-stone-500"), color("color-surface")) >= 4.5);
  assert.ok(contrast("#ffffff", color("color-accent")) >= 4.5);
});
test("light theme keeps text and control boundaries readable", () => {
  const light = css.match(/html\[data-theme="light"\] \{([\s\S]*?)\}/)?.[1];
  assert.ok(light);
  assert.ok(contrast(color("color-stone-300", light), color("color-surface", light)) >= 3);
  assert.ok(contrast(color("color-stone-500", light), color("color-surface", light)) >= 4.5);
  assert.ok(contrast(color("color-stone-950", light), color("color-surface", light)) >= 4.5);
});
