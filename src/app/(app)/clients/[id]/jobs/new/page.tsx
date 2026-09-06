import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import { PrivateLink as Link } from "@/components/private-link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { JobForm } from "@/components/job-form";

export const metadata: Metadata = { title: "Add job" };
export default async function NewJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireSession();
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const { data: client, error } = await supabase.from("clients").select("id,name,archived_at").eq("id", id).maybeSingle();
  if (error) throw new Error("Could not load client for new job");
  if (!client) notFound();
  return <div className="mx-auto max-w-3xl space-y-8 px-5 py-8 sm:px-8 lg:py-10">
    <Link href={`/clients/${id}#jobs`} className="button-quiet">← Back to client jobs</Link>
    <header className="space-y-3"><p className="eyebrow">Client work</p><h1 className="text-3xl font-medium tracking-tight sm:text-4xl">Add a job</h1><p className="break-words text-stone-600">For {client.name}</p></header>
    {client.archived_at ? <p className="panel">This client is archived. Restore the client before adding work.</p> : <JobForm clientId={id} requestId={randomUUID()} />}
  </div>;
}
