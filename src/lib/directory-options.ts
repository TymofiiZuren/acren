import { counties } from "./counties.ts";

export const sortOptions = { name: "Name A–Z", reverse: "Name Z–A", recent: "Recently updated", newest: "Newest added" };
export const pageSizes = [10, 25, 50] as const;
export type DirectoryOptions = { county: string; sort: keyof typeof sortOptions; pageSize: typeof pageSizes[number] };
export function parseDirectoryOptions(county: unknown, sort: unknown, pageSize: unknown = "25"): DirectoryOptions | null {
  if (typeof county !== "string" || (county !== "" && !counties.includes(county))) return null;
  if (typeof sort !== "string" || !Object.hasOwn(sortOptions, sort)) return null;
  if (typeof pageSize !== "string" || !pageSizes.some((size) => String(size) === pageSize)) return null;
  return { county, sort: sort as DirectoryOptions["sort"], pageSize: Number(pageSize) as DirectoryOptions["pageSize"] };
}

export function contactLinks(email: string, phone: string) {
  const validEmail = /^[a-zA-Z0-9.!#$%&'*+/=^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/.test(email);
  const number = phone.replace(/[()\s-]/g, "");
  return {
    email: validEmail ? `mailto:${encodeURIComponent(email)}` : undefined,
    phone: /^\+?\d{7,15}$/.test(number) ? `tel:${number}` : undefined,
  };
}
