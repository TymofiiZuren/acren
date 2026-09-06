import type { Metadata } from "next";
import { PrivateLink as Link } from "@/components/private-link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ClientForm } from "@/components/client-form";
import { requireSession } from "@/lib/require-session";

export const metadata: Metadata = { title: "Edit client" };

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const { supabase } = await requireSession();
  const { data: client, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("Could not load client");
  if (!client) notFound();
  return <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 lg:py-10"><Link href={`/clients/${client.id}`} className="text-sm font-medium text-emerald-800 hover:underline">← Back to client profile</Link><h1 className="mt-5 text-3xl font-medium tracking-tight sm:text-4xl">Edit client</h1><p className="mb-8 mt-2 text-stone-600">Keep {client.name}&apos;s contact and herd details current.</p><ClientForm client={client} /></div>;
}
