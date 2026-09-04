"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { parseClientInput, type ClientInput, type FieldErrors } from "@/lib/validation";

export type ClientFormState = {
  error?: string;
  errors?: FieldErrors;
  values?: ClientInput;
};

export async function createClientRecord(_: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const { supabase } = await requireSession();
  const parsed = parseClientInput(formData);
  if (!parsed.ok) return { errors: parsed.errors, values: parsed.values };

  const { error } = await supabase.from("clients").insert(parsed.values);
  if (error?.code === "23505") return { error: "A client with that herd number already exists.", values: parsed.values };
  if (error) return { error: "We couldn’t save this client. Please try again.", values: parsed.values };

  revalidatePath("/clients");
  redirect("/clients?notice=added");
}

export async function updateClientRecord(id: string, _: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const { supabase } = await requireSession();
  const parsed = parseClientInput(formData);
  if (!parsed.ok) return { errors: parsed.errors, values: parsed.values };

  const { data, error } = await supabase.from("clients").update(parsed.values).eq("id", id).select("id").maybeSingle();
  if (error?.code === "23505") return { error: "A client with that herd number already exists.", values: parsed.values };
  if (error) return { error: "We couldn’t update this client. Please try again.", values: parsed.values };
  if (!data) notFound();

  revalidatePath("/clients");
  revalidatePath("/jobs");
  redirect("/clients?notice=updated");
}

export async function archiveClient(id: string) {
  const { supabase } = await requireSession();
  const { data, error } = await supabase.from("clients").update({ archived_at: new Date().toISOString() }).eq("id", id).select("id").maybeSingle();
  if (error) throw new Error("Could not archive client");
  if (!data) notFound();
  revalidatePath("/clients");
  revalidatePath("/jobs");
  redirect("/clients?notice=archived");
}

export async function restoreClient(id: string) {
  const { supabase } = await requireSession();
  const { data, error } = await supabase.from("clients").update({ archived_at: null }).eq("id", id).select("id").maybeSingle();
  if (error) throw new Error("Could not restore client");
  if (!data) notFound();
  revalidatePath("/clients");
  revalidatePath("/jobs");
  redirect("/clients?status=archived&notice=restored");
}
