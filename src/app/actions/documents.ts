"use server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/require-session";
import { DOCUMENT_BUCKET, documentObjectName, uuidPattern, validateDocument } from "@/lib/documents";

export type DocumentState = { error?: string; message?: string };
export async function fileDocument(clientId: string, requestId: string, _: DocumentState, form: FormData): Promise<DocumentState> {
  const { supabase, user } = await requireSession();
  if (!uuidPattern.test(clientId) || !uuidPattern.test(requestId)) return { error: "Refresh the page and try again." };
  const file = form.get("document");
  const error = await validateDocument(file);
  if (error || !(file instanceof File)) return { error: error ?? "Choose a PDF document." };
  const path = `${user.id}/${clientId}/${documentObjectName(requestId, file.name)}`;
  const { error: uploadError } = await supabase.storage.from(DOCUMENT_BUCKET).upload(path, file, {
    contentType: "application/pdf", cacheControl: "0", upsert: false,
  });
  if (uploadError) return { error: "Could not file this document. Check the list before retrying and make sure the client is still active. Choose the file again if needed." };
  revalidatePath(`/clients/${clientId}`);
  return { message: "Document filed privately. Refresh this page to file another." };
}
