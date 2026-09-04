import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { CopyDetail } from "@/components/copy-detail";
import { contactLinks } from "@/lib/directory-options";
import { ClientJobs } from "@/components/client-jobs";
import { ClientDocuments } from "@/components/client-documents";

export const metadata: Metadata = { title: "Client profile" };

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-IE", { dateStyle: "medium", timeZone: "Europe/Dublin" }).format(new Date(value));
}

export default async function ClientProfile({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ jobPage?: string; documentPage?: string; notice?: string }> }) {
  const { supabase } = await requireSession();
  const { id } = await params;
  const { jobPage, documentPage, notice } = await searchParams;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const { data: client, error } = await supabase.from("clients").select("id,name,herd_number,county,phone,email,archived_at,created_at,updated_at").eq("id", id).maybeSingle();
  if (error) throw new Error("Could not load client profile");
  if (!client) notFound();
  const { data: events, error: historyError } = await supabase.from("client_events")
    .select("id,action,changed_fields,occurred_at").eq("client_id", id)
    .order("occurred_at", { ascending: false }).order("id").limit(20);
  const actions = { created: "Client added", updated: "Details updated", archived: "Client archived", restored: "Client restored" };
  const fieldNames: Record<string, string> = { name: "Name", herd_number: "Herd number", county: "County", phone: "Phone", email: "Email", archived_at: "Archive status" };
  const links = contactLinks(client.email, client.phone);
  return <div className="mx-auto max-w-4xl space-y-8 px-5 py-8 sm:px-8 lg:py-10">
    <Link className="button-quiet" href={client.archived_at ? "/clients?status=archived" : "/clients"}>← Back to client book</Link>
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><p className="eyebrow">Client profile · {client.archived_at ? "Archived" : "Active"}</p><h1 className="break-words pt-3 text-3xl font-medium tracking-tight sm:text-4xl">{client.name}</h1><p className="pt-3 text-stone-600">{client.herd_number} · {client.county}</p></div><Link className="button-primary shrink-0" href={`/clients/${client.id}/edit`}>Edit details</Link></header>
    {client.archived_at && <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">Archived on {dateLabel(client.archived_at)}. These details are still retained. Restore this client from the archived directory when work resumes.</p>}
    <nav aria-label="Client profile sections" className="section-links"><a className="button-quiet" href="#client-information">Client information</a><a className="button-quiet" href="#jobs">Jobs</a><a className="button-quiet" href="#documents">Documents</a><a className="button-quiet" href="#activity">Activity</a></nav>
    <section id="client-information" className="panel space-y-5 scroll-mt-6" aria-labelledby="client-information-title">
      <h2 id="client-information-title" className="text-xl font-medium">Client information</h2>
      <dl className="divide-y divide-stone-200">{([["County", client.county], ["Herd number", client.herd_number], ["Phone", client.phone], ["Email", client.email], ["Status", client.archived_at ? "Archived" : "Active"]] as const).map(([label, value]) => <div key={label} className="grid gap-2 py-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6"><dt className="text-sm text-stone-600">{label}</dt><dd className="min-w-0 space-y-2"><p className="break-words font-medium [overflow-wrap:anywhere]">{value}</p>{(label === "Herd number" || label === "Phone" || label === "Email") && <CopyDetail value={value} label={label} />}</dd></div>)}</dl>
      <div className="flex flex-wrap gap-3">{links.phone && <a className="button-secondary" href={links.phone}>Call client</a>}{links.email && <a className="button-secondary" href={links.email}>Email client</a>}</div>
      <p className="text-xs leading-5 text-stone-500">Opens your phone or email app. Acren does not place calls or send messages automatically. Copied details remain in your device clipboard and may be accessible to other apps.</p>
    </section>
    <section className="panel space-y-4"><h2 className="text-xl font-medium">Record information</h2><dl className="grid gap-4 sm:grid-cols-2"><div><dt className="text-sm text-stone-600">Added to client book</dt><dd className="pt-1 font-medium">{dateLabel(client.created_at)}</dd></div><div><dt className="text-sm text-stone-600">Last updated</dt><dd className="pt-1 font-medium">{dateLabel(client.updated_at)}</dd></div></dl><p className="text-xs leading-5 text-stone-500">Dates shown in Irish time. Changes are listed in Recent activity below.</p></section>
    <ClientJobs clientId={id} archived={!!client.archived_at} requestedPage={jobPage} notice={notice} />
    <ClientDocuments clientId={id} archived={!!client.archived_at} requestedPage={documentPage} />
    <section id="activity" className="panel space-y-5 scroll-mt-6" aria-labelledby="history-title">
      <div className="space-y-2"><h2 id="history-title" className="text-xl font-medium">Recent activity</h2><p className="text-sm leading-6 text-stone-600">The latest 20 recorded changes, newest first. Written automatically by the database; entries cannot be edited in your account.</p></div>
      {historyError ? <p className="alert-error" role="alert">Activity could not be loaded. Refresh the page to try again. Your client details are still available above.</p> : !events?.length ? <p className="text-sm leading-6 text-stone-600">No recorded activity yet. History starts with changes made after activity tracking was enabled; earlier changes are not reconstructed.</p> : <ol className="divide-y divide-stone-100">{events.map((event) => <li key={event.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:justify-between sm:gap-6"><div className="space-y-1"><p className="font-semibold">{actions[event.action]}</p>{event.changed_fields.length > 0 && <p className="text-sm text-stone-600">Changed: {event.changed_fields.map((field) => fieldNames[field] ?? "Client detail").join(", ")}</p>}</div><time dateTime={event.occurred_at} className="shrink-0 text-sm text-stone-600">{new Intl.DateTimeFormat("en-IE", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Dublin" }).format(new Date(event.occurred_at))}</time></li>)}</ol>}
      <p className="text-xs leading-5 text-stone-500">Times shown in Ireland’s time zone. History stores event types and field names, not previous contact details. This is a change log, not a record of who viewed data.</p>
    </section>
    <p className="text-sm leading-6 text-stone-600">Keep details accurate and review retained data regularly. <Link className="font-semibold underline underline-offset-4" href="/privacy-centre">Visit the privacy centre</Link>.</p>
  </div>;
}
