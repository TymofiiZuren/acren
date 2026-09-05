export type ClientInput = {
  name: string;
  herd_number: string;
  county: string;
  phone: string;
  email: string;
};
import { counties } from "./counties.ts";
import { normalisePhone } from "./phone.ts";
export type FieldErrors = Partial<Record<keyof ClientInput, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HERD_NUMBER = /^[A-Za-z0-9\s/-]{3,32}$/;

export function parseClientInput(formData: FormData) {
  const text = (key: string) => { const value = formData.get(key); return typeof value === "string" ? value.trim() : ""; };
  const values: ClientInput = {
    name: text("name"),
    herd_number: text("herd_number").toUpperCase(),
    county: text("county"),
    phone: text("phone"),
    email: text("email").toLowerCase(),
  };
  const errors: FieldErrors = {};

  if (!values.name || values.name.length > 120) errors.name = "Enter a name of 120 characters or fewer.";
  if (!HERD_NUMBER.test(values.herd_number)) errors.herd_number = "Enter a valid herd number (3–32 letters or numbers).";
  if (!counties.includes(values.county)) errors.county = "Select a county.";
  const phone = normalisePhone(values.phone, formData.get("phone_format") ?? "IE");
  if (!phone) errors.phone = "Enter a valid phone number for the selected country. Check its length and prefix; extensions are not supported.";
  else values.phone = phone;
  if (!EMAIL.test(values.email) || values.email.length > 254) errors.email = "Enter a valid email address.";

  return Object.keys(errors).length ? { ok: false as const, values, errors } : { ok: true as const, values, errors };
}
