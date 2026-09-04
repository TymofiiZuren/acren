"use server";

import { readDirectory, type DirectoryResult } from "@/lib/client-directory";
import { parseSearch } from "@/lib/privacy";
import { requireSession } from "@/lib/require-session";
import { parseDirectoryOptions } from "@/lib/directory-options";

export async function searchDirectory(archived: boolean, _: DirectoryResult, formData: FormData): Promise<DirectoryResult> {
  await requireSession();
  const parsed = parseSearch(formData.has("clear") ? "" : formData.get("q") ?? "", formData.get("page") ?? 0);
  const options = formData.has("clear") ? { county: "", sort: "name" as const, pageSize: 25 as const } : parseDirectoryOptions(formData.get("county") ?? "", formData.get("sort") ?? "name", formData.get("pageSize") ?? "25");
  if (!parsed || !options) return { county: "", sort: "name", pageSize: 25, clients: [], count: 0, page: 0, term: "", error: "Check your filters and results-per-page selection. Search supports up to 120 letters, numbers, spaces, apostrophes, dots, slashes or hyphens." };
  return readDirectory(archived === true, parsed.term, parsed.page, options);
}
