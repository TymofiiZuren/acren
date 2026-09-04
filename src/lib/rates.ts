export const rateUnits = { fixed: "Per job", hour: "Per hour", unit: "Per unit" } as const;
export type RateUnit = keyof typeof rateUnits;
export type RateErrors = Partial<Record<"name" | "price" | "unit", string>>;
export type RateInput = { name: string; price_cents: number; unit: RateUnit };

export function parseRateInput(form: FormData): { ok: true; values: RateInput } | { ok: false; errors: RateErrors } {
  const text = (key: string) => typeof form.get(key) === "string" ? (form.get(key) as string).trim() : "";
  const name = text("name"), price = text("price"), unit = text("unit");
  const errors: RateErrors = {};
  if (!name || name.length > 120) errors.name = "Enter a service name of 1–120 characters.";
  if (!Object.hasOwn(rateUnits, unit)) errors.unit = "Choose per job, per hour or per unit.";
  const match = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(price);
  const cents = match ? Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0")) : -1;
  if (cents < 0 || cents > 100000000) errors.price = "Enter EUR 0–1,000,000 with at most two decimal places, without commas.";
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, values: { name, price_cents: cents, unit: unit as RateUnit } };
}

export function formatRate(cents: number) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(cents / 100);
}
