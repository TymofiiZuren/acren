"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { parseRateInput, type RateErrors } from "@/lib/rates";

export type RateFormState = { error?: string; errors?: RateErrors; message?: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createRate(requestId: string, _: RateFormState, form: FormData): Promise<RateFormState> {
  const { supabase } = await requireSession();
  if (!uuid.test(requestId)) return { error: "Refresh the form before adding this rate." };
  const parsed = parseRateInput(form);
  if (!parsed.ok) return { errors: parsed.errors };
  const { error } = await supabase.from("rates").insert({ id: requestId, ...parsed.values });
  if (error?.code === "23505") {
    const { data } = await supabase.from("rates").select("name,unit,price_cents").eq("id", requestId).maybeSingle();
    if (!data || data.name !== parsed.values.name || data.unit !== parsed.values.unit || data.price_cents !== parsed.values.price_cents) return { error: "This form was already used. Review the rate card before adding another rate." };
  } else if (error) return { error: "The rate could not be saved. Your entries are still here; please try again." };
  revalidatePath("/rates");
  redirect("/rates?notice=added");
}

export async function retireRate(id: string, _: RateFormState, form: FormData): Promise<RateFormState> {
  const { supabase } = await requireSession();
  if (!uuid.test(id) || form.get("confirm") !== "yes") return { error: "Confirm that you want to retire this rate." };
  const { data, error } = await supabase.from("rates").update({ retired: true }).eq("id", id).eq("retired", false).select("id").maybeSingle();
  if (error) return { error: "Could not retire this rate. Please try again." };
  revalidatePath("/rates");
  if (!data) return { error: "This rate is already retired or no longer available. Refresh the list." };
  return { message: "Rate retired. Its details have been retained." };
}
