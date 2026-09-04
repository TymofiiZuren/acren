import "server-only";
import { requireSession } from "@/lib/require-session";
import type { DirectoryOptions } from "@/lib/directory-options";

export type DirectoryRow = { id: string; name: string; herd_number: string; county: string };
export type DirectoryResult = DirectoryOptions & { clients: DirectoryRow[]; count: number; page: number; term: string; error?: string };

export async function readDirectory(archived: boolean, term = "", page = 0, options: DirectoryOptions = { county: "", sort: "name", pageSize: 25 }): Promise<DirectoryResult> {
  const { supabase } = await requireSession();
  const column = options.sort === "recent" ? "updated_at" : options.sort === "newest" ? "created_at" : "name";
  let query = supabase.from("clients").select("id,name,herd_number,county", { count: "exact" }).order(column, { ascending: options.sort === "name" }).order("id");
  if (options.county) query = query.eq("county", options.county);
  query = archived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  // Callers validate the bounded term before interpolating PostgREST filter syntax.
  if (term) query = query.or(`name.ilike.%${term}%,herd_number.ilike.%${term}%`);
  const { data, count, error } = await query.range(page * options.pageSize, (page + 1) * options.pageSize - 1);
  if (error) return { ...options, clients: [], count: 0, page, term, error: "We couldn’t load your client book. Please try again." };
  const lastPage = Math.max(0, Math.ceil((count ?? 0) / options.pageSize) - 1);
  if (page > lastPage) return readDirectory(archived, term, lastPage, options);
  return { ...options, clients: data ?? [], count: count ?? 0, page, term };
}
