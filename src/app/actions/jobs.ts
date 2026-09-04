"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { parseJobInput, jobLabels, type JobErrors, type JobStatus } from "@/lib/jobs";

export type JobFormState = { error?: string; errors?: JobErrors; message?: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createJob(clientId: string, requestId: string, _: JobFormState, form: FormData): Promise<JobFormState> {
  const { supabase } = await requireSession();
  if (!uuid.test(clientId) || !uuid.test(requestId)) return { error: "Refresh the page before adding this job." };
  const parsed = parseJobInput(form);
  if (!parsed.ok) return { errors: parsed.errors };
  const { error } = await supabase.from("jobs").insert({ id: requestId, client_id: clientId, ...parsed.values });
  if (error?.code === "23505") {
    // A retry may follow a committed save whose response was lost. Only accept an
    // exact payload match visible through this caller's RLS-protected session.
    const { data } = await supabase.from("jobs").select("client_id,title,target_date").eq("id", requestId).maybeSingle();
    if (!data || data.client_id !== clientId || data.title !== parsed.values.title || data.target_date !== parsed.values.target_date) {
      return { error: "This form has already been used. Return to the client profile and check its jobs before adding another." };
    }
  } else if (error) {
    return { error: "We couldn’t add this job. Check that the client is still active, then try again." };
  }
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/jobs");
  redirect(`/clients/${clientId}?notice=job-added#jobs`);
}

export async function changeJobStatus(clientId: string, jobId: string, version: number, _: JobFormState, form: FormData): Promise<JobFormState> {
  const { supabase } = await requireSession();
  const status = form.get("status");
  if (!uuid.test(clientId) || !uuid.test(jobId) || !Number.isSafeInteger(version) || version < 1 ||
    typeof status !== "string" || !Object.hasOwn(jobLabels, status)) return { error: "Refresh the page and choose a valid job status." };
  const { data, error } = await supabase.from("jobs").update({ status: status as JobStatus })
    .eq("id", jobId).eq("client_id", clientId).eq("version", version).select("id").maybeSingle();
  if (error) return { error: "Status wasn’t changed. Refresh to check the latest status and whether the client is archived." };
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/jobs");
  if (!data) return { error: "This job changed or is no longer available. Review the latest details before trying again." };
  return { message: `Saved: ${jobLabels[status as JobStatus]}.` };
}
