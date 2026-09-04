import type { ClientInput } from "./validation.ts";

const fields: (keyof ClientInput)[] = ["name", "herd_number", "county", "phone", "email"];
export function hasClientChanges(original: ClientInput, current: ClientInput) {
  return fields.some((field) => original[field] !== current[field]);
}
