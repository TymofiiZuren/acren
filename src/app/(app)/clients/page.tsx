import Link from "next/link";
import { connection } from "next/server";
import { PlusIcon } from "@/components/icons";
import { ClientDirectory } from "@/components/client-directory";
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
      <div><p className="eyebrow">Your practice, in one place</p><h1 className="pt-3 text-3xl font-medium tracking-tight sm:text-4xl">{archived ? "Archived clients" : "The client book"}</h1><p className="pt-3 text-stone-600">{archived ? "Out of the active book. Still in your care." : "Less time looking for details. More time with your clients."}</p></div>
      {!archived && <Link href="/clients/new" className="button-primary shrink-0 gap-2"><PlusIcon className="size-4" />Add client</Link>}
    </div>
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      <div className="panel"><p className="text-sm font-semibold text-stone-600">Active clients</p><p className="pt-3 text-3xl font-medium tabular-nums">{activeCount.error ? "—" : activeCount.count ?? 0}</p><p className="pt-2 text-xs text-stone-500">In your working client book</p></div>
      <div className="panel"><p className="text-sm font-semibold text-stone-600">Archived clients</p><p className="pt-3 text-3xl font-medium tabular-nums">{archivedCount.error ? "—" : archivedCount.count ?? 0}</p><p className="pt-2 text-xs text-stone-500">Retained, not deleted</p></div>
      <div className="panel col-span-2 sm:col-span-1"><p className="text-sm font-medium">Your book. Your workspace.</p><p className="pt-3 text-sm leading-6 text-stone-600">Contact details stay inside each client record, off the directory view.</p><Link href="/privacy-centre" className="inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4">Privacy centre →</Link></div>
    </div>
    {message && <div className="alert-success" role="status">{message}</div>}
    {archived && <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">Archiving does not erase personal data. Review retained records against your practice’s retention policy. Restore a client whenever work resumes.</div>}
    <ClientDirectory key={JSON.stringify([archived, notice, initial])} initial={initial} archived={archived} />
    <p className="text-xs leading-5 text-stone-500">Demo workspace · Use fictional data until your practice’s <Link className="font-semibold underline underline-offset-4" href="/privacy-centre">production privacy checklist</Link> is complete.</p>
  </div>;
}
