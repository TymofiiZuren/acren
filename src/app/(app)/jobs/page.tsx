import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { jobLabels, parseJobPage } from "@/lib/jobs";
import { irelandToday, isOverdue, parseWorkFilter, workFilters } from "@/lib/work-queue";

export const metadata: Metadata = { title: "Work queue" };
export default async function JobsPage({ searchParams }: { searchParams: Promise<{ filter?: string; page?: string }> }) {
  const { supabase } = await requireSession();
  const search = await searchParams;
  const filter = parseWorkFilter(search.filter);
  const page = parseJobPage(search.page);
  const today = irelandToday(new Date());
  let query = supabase.from("jobs").select("id,client_id,title,status,target_date", { count: "exact" });
  if (filter === "open" || filter === "overdue") query = query.in("status", ["planned", "in_progress"]);
  else if (filter !== "all") query = query.eq("status", filter);
  if (filter === "overdue") query = query.lt("target_date", today);
  const [result, open, completed, overdue] = await Promise.all([
    query.order("target_date", { ascending: true, nullsFirst: false }).order("id").range((page - 1) * 20, page * 20 - 1),
    supabase.from("jobs").select("id", { count: "exact", head: true }).in("status", ["planned", "in_progress"]),
    supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("jobs").select("id", { count: "exact", head: true }).in("status", ["planned", "in_progress"]).lt("target_date", today),
  ]);
  const pages = Math.max(1, Math.ceil((result.count ?? 0) / 20));
  if (!result.error && page > pages) redirect(`/jobs?filter=${filter}&page=${pages}`);
  const ids = [...new Set(result.data?.map((job) => job.client_id) ?? [])];
  const clients = ids.length ? await supabase.from("clients").select("id,name,archived_at").in("id", ids) : null;
  const failure = result.error || clients?.error;
  return <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
    <header className="flex flex-wrap items-end justify-between gap-5"><div className="space-y-3"><p className="eyebrow">Your practice · Work</p><h1 className="text-3xl font-medium tracking-tight sm:text-4xl">Work queue</h1><p className="text-stone-600">Every client’s work, in one place. Earliest targets first.</p></div><Link className="button-primary" href="/clients">Choose a client to add work</Link></header>
    <div className="grid gap-4 sm:grid-cols-3">{([["Open work", open], ["Completed", completed], ["Overdue targets", overdue]] as const).map(([label, metric]) => {
      return <section key={label} className="panel space-y-3"><h2 className="text-sm text-stone-600">{label}</h2><p className="text-3xl tabular-nums">{metric.error ? "Unavailable" : metric.count ?? 0}</p></section>;
    })}</div>
    <section className="panel space-y-6" aria-label="Job queue">
      <nav aria-label="Job status filters" className="flex flex-wrap gap-2">{Object.entries(workFilters).map(([value, label]) => <Link key={value} prefetch={false} className="nav-link" aria-current={filter === value ? "page" : undefined} href={`/jobs?filter=${value}`}>{label}</Link>)}</nav>
      <p className="text-sm text-stone-600">Includes retained work for archived clients, labelled below. Targets are your planning dates, not official scheme deadlines.</p>
      {failure ? <p role="alert" className="alert-error">Work could not be loaded. Refresh to try again.</p> : !result.data?.length ? <div className="space-y-3 py-6"><h2 className="text-xl font-medium">No jobs in this view</h2><p className="text-sm text-stone-600">Choose another status or add work from a client profile.</p><Link className="button-secondary" href={`/jobs?filter=${filter}`}>Return to first page</Link></div> : <ul className="divide-y divide-stone-200">{result.data.map((job) => {
        const client = clients?.data?.find((item) => item.id === job.client_id);
        return <li key={job.id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0 space-y-2"><h2 className="break-words font-medium">{job.title}</h2><p className="break-words text-sm text-stone-600">{client?.name ?? "Client unavailable"}{client?.archived_at ? " · Archived client" : ""}</p><p className="text-sm text-stone-600">{jobLabels[job.status]} · {job.target_date ? `Target ${new Intl.DateTimeFormat("en-IE", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${job.target_date}T00:00:00Z`))}` : "No target date"}{isOverdue(job.status, job.target_date, today) && <span className="font-semibold text-red-700"> · Overdue</span>}</p></div><Link prefetch={false} className="button-secondary shrink-0" href={`/clients/${job.client_id}#jobs`}>Open client work<span className="sr-only"> for {job.title}</span></Link></li>;
      })}</ul>}
      {!failure && <nav aria-label="Queue pages" className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-stone-600">{result.count ?? 0} matching jobs · Page {page} of {pages}</p><div className="flex gap-2">{page > 1 && <Link className="button-quiet" prefetch={false} href={`/jobs?filter=${filter}&page=${page - 1}`}>Previous</Link>}{page < pages && <Link className="button-quiet" prefetch={false} href={`/jobs?filter=${filter}&page=${page + 1}`}>Next</Link>}</div></nav>}
    </section>
    <p className="text-xs leading-5 text-stone-500">Overdue means an unfinished job with a target before today in Ireland. Refresh to update these counts. Completing work does not submit an application, issue an invoice or send a reminder.</p>
  </div>;
}
