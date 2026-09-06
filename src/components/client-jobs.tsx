import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { jobLabels, parseJobPage } from "@/lib/jobs";
import { JobStatusForm } from "@/components/job-status-form";
import { formatRate, rateUnits } from "@/lib/rates";

export async function ClientJobs({ clientId, archived, requestedPage, notice }: { clientId: string; archived: boolean; requestedPage?: string; notice?: string }) {
  const { supabase } = await requireSession();
  const requested = parseJobPage(requestedPage);
  const { data: jobs, error, count } = await supabase.from("jobs").select("id,title,target_date,status,version", { count: "exact" })
    .eq("client_id", clientId).order("created_at", { ascending: false }).order("id").range((requested - 1) * 10, requested * 10 - 1);
  const pages = Math.max(1, Math.ceil((count ?? 0) / 10));
  const page = Math.min(requested, pages);
  if ((count ?? 0) > 0 && requested > pages) redirect(`/clients/${clientId}?jobPage=${pages}#jobs`);
  const [billing, recommendations, history] = jobs?.length ? await Promise.all([
    supabase.from("invoices").select("id,job_id,status").in("job_id", jobs.map((job) => job.id)).neq("status", "void"),
    supabase.from("work_recommendations").select("job_id,rate_name,unit,quantity,estimate_cents").in("job_id", jobs.map((job) => job.id)),
    supabase.from("job_events").select("id,job_id,status,version,occurred_at")
      .eq("client_id", clientId).in("job_id", jobs.map((job) => job.id)).order("occurred_at", { ascending: false }).order("id").limit(20),
  ]) : [null, null, null];
  return <section id="jobs" className="panel scroll-mt-8 space-y-6" aria-labelledby="jobs-title">
    <div className="flex flex-wrap items-center justify-between gap-4"><div className="space-y-2"><h2 id="jobs-title" className="text-xl font-medium">Client jobs</h2><p className="text-sm leading-6 text-stone-600">Track the work before it becomes an invoice.</p></div>{!archived && <Link prefetch={false} className="button-secondary" href={`/clients/${clientId}/jobs/new`}>Add job</Link>}</div>
    {notice === "job-added" && <p role="status" className="text-sm font-semibold text-emerald-800">Job added.</p>}
    {notice === "recommended" && <p role="status" className="text-sm font-semibold text-emerald-800">Recommendation saved as planned work. No invoice or client acceptance recorded.</p>}
    {archived && <p className="text-sm leading-6 text-stone-600">Jobs are read-only while this client is archived. Restore the client to resume work.</p>}
    {error ? <p className="alert-error" role="alert">Jobs could not be loaded. Refresh to try again.</p> : !jobs?.length ? <p className="text-sm text-stone-600">No jobs yet. Add the first piece of work when you’re ready.</p> : <>
      <p className="text-sm text-stone-600">{count} {count === 1 ? "job" : "jobs"} · Page {page} of {pages} · Newest first</p>
      <ul className="divide-y divide-stone-200">{jobs.map((job) => <li key={job.id} className="space-y-4 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><h3 className="min-w-0 break-words font-medium">{job.title}</h3><span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-semibold">{jobLabels[job.status]}</span></div>
        <p className="text-sm text-stone-600">{job.target_date ? `Target: ${new Intl.DateTimeFormat("en-IE", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${job.target_date}T00:00:00Z`))}` : "No target date"}</p>
        {recommendations?.error ? <p role="alert" className="text-sm text-stone-600">Work estimates could not be loaded.</p> : recommendations?.data?.filter(r=>r.job_id===job.id).map(r=><p key={r.job_id} className="text-sm text-stone-600">Advisor recommendation · {r.rate_name} · Quantity {r.quantity} ({rateUnits[r.unit].toLowerCase()}) · Estimated {formatRate(r.estimate_cents)} excluding VAT. Original estimate; the final invoice may differ.</p>)}
        {billing?.error ? <p className="text-sm text-stone-600">Billing status unavailable. Refresh before changing this job.</p> : billing?.data?.some(i=>i.job_id===job.id) ? <Link className="button-secondary" href={`/invoices/${billing.data.find(i=>i.job_id===job.id)!.id}`}>View invoice · Work locked</Link> : !archived && <><JobStatusForm clientId={clientId} jobId={job.id} status={job.status} version={job.version} />{job.status==='completed'&&<Link className="button-primary" href={`/invoices/new?job=${job.id}`}>Create invoice</Link>}</>}
      </li>)}</ul>
      {pages > 1 && <nav className="flex flex-wrap items-center gap-3" aria-label="Job pages">{page > 1 && <Link prefetch={false} className="button-secondary" href={`/clients/${clientId}?jobPage=${page - 1}#jobs`}>Previous jobs</Link>}{page < pages && <Link prefetch={false} className="button-secondary" href={`/clients/${clientId}?jobPage=${page + 1}#jobs`}>Next jobs</Link>}</nav>}
      <details className="space-y-4"><summary className="cursor-pointer py-3 font-semibold">Recent job activity</summary>
        <p className="text-sm leading-6 text-stone-600">Latest 20 events for jobs on this page, newest first. Recorded by the database; your account cannot edit this history. Times shown in Ireland’s time zone.</p>
        {history?.error ? <p role="alert" className="alert-error">Job activity could not be loaded. Refresh to try again.</p> : <ol className="space-y-3">{history?.data?.map((event) => <li key={event.id} className="space-y-1 text-sm"><p className="break-words font-semibold">{jobs.find((job) => job.id === event.job_id)?.title} · {event.version === 1 ? "Added as Planned" : jobLabels[event.status]}</p><time className="text-stone-600" dateTime={event.occurred_at}>{new Intl.DateTimeFormat("en-IE", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Dublin" }).format(new Date(event.occurred_at))}</time></li>)}</ol>}
      </details>
    </>}
    <p className="text-xs leading-5 text-stone-500">Target dates are for internal planning. Completing a job does not submit an application. Work linked to an invoice is locked.</p>
  </section>;
}
