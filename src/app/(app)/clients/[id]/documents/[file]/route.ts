import { requireSession } from "@/lib/require-session";
import { DOCUMENT_BUCKET, uuidPattern, validDocumentObject } from "@/lib/documents";

export async function GET(_: Request, { params }: { params: Promise<{ id: string; file: string }> }) {
  const { supabase, user } = await requireSession();
  const { id, file } = await params;
  const privateHeaders = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" };
  if (!uuidPattern.test(id) || !validDocumentObject(file)) return new Response("Document unavailable", { status: 404, headers: privateHeaders });
  const { data, error } = await supabase.storage.from(DOCUMENT_BUCKET).download(`${user.id}/${id}/${file}`);
  if (error || !data) return new Response("Document unavailable", { status: 404, headers: privateHeaders });
  return new Response(data, { headers: {
    ...privateHeaders, "Content-Type": "application/octet-stream",
    "Content-Disposition": `attachment; filename="${file.slice(38)}"`,
    "Content-Security-Policy": "default-src 'none'; sandbox",
  } });
}
