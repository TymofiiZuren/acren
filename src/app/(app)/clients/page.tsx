import Link from "next/link";
import { connection } from "next/server";
import { PlusIcon } from "@/components/icons";
import { ClientDirectory } from "@/components/client-directory";
import { WorkspaceMetrics } from "@/components/workspace-metrics";
import { readDirectory } from "@/lib/client-directory";
import { noticeMessage } from "@/lib/privacy";
import { requireSession } from "@/lib/require-session";

type Search = { status?: string; notice?: string };

export default async function ClientsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await connection();
  const { status, notice } = await searchParams;
  const archived = status === "archived";
  const { supabase } = await requireSession();
  const [initial, activeCount, archivedCount] = await Promise.all([
    readDirectory(archived),
    supabase.from("clients").select("id", { count: "exact", head: true }).is("archived_at", null),
    supabase.from("clients").select("id", { count: "exact", head: true }).not("archived_at", "is", null),
  ]);
  const message = noticeMessage(notice);

  return <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="eyebrow">Practice / Clients</p><h1 className="pt-3 text-3xl font-medium tracking-tight sm:text-4xl">{archived ? "Archived clients" : "Client book"}</h1><p className="pt-3 text-stone-600">{archived ? "Retained client records. Archive is not permanent deletion." : "Find a client, review their details and manage the work."}</p></div>
      {!archived && <Link href="/clients/new" className="button-primary shrink-0 gap-2"><PlusIcon className="size-4" />Add client</Link>}
    </div>
    <WorkspaceMetrics items={[
      { label: "Active clients", value: activeCount.error ? "Unavailable" : activeCount.count ?? 0, detail: "In your working client book" },
      { label: "Archived clients", value: archivedCount.error ? "Unavailable" : archivedCount.count ?? 0, detail: "Retained, not deleted" },
      { label: "Total clients", value: activeCount.error || archivedCount.error ? "Unavailable" : (activeCount.count ?? 0) + (archivedCount.count ?? 0), detail: "Active and archived records" },
    ]} />
    {message && <div className="alert-success" role="status">{message}</div>}
    {archived && <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">Archiving does not erase personal data. Review retained records against your practice’s retention policy. Restore a client whenever work resumes.</div>}
    <ClientDirectory key={JSON.stringify([archived, notice, initial])} initial={initial} archived={archived} />
    <p className="text-xs leading-5 text-stone-500">Demo workspace · Use fictional data until your practice’s <Link className="font-semibold underline underline-offset-4" href="/privacy-centre">production privacy checklist</Link> is complete.</p>
  </div>;
}
