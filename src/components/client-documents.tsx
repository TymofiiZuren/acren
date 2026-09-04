import { randomUUID } from "node:crypto";
import Link from "next/link";
import { requireSession } from "@/lib/require-session";
import { DOCUMENT_BUCKET, validDocumentObject } from "@/lib/documents";
import { DocumentUpload } from "@/components/document-upload";
import { parseJobPage } from "@/lib/jobs";

export async function ClientDocuments({ clientId, archived, requestedPage }: { clientId: string; archived: boolean; requestedPage?: string }) {
  const { supabase, user } = await requireSession();
  const page = parseJobPage(requestedPage);
  const { data, error } = await supabase.storage.from(DOCUMENT_BUCKET).list(`${user.id}/${clientId}`, { limit: 21, offset: (page - 1) * 20, sortBy: { column: "created_at", order: "desc" } });
  const files = data?.slice(0, 20).filter((file) => file.id && validDocumentObject(file.name)) ?? [];
  return <section id="documents" className="panel space-y-6" aria-labelledby="documents-title">
    <header className="flex flex-wrap items-center justify-between gap-3"><h2 id="documents-title" className="text-xl font-medium">Client documents</h2><span className="eyebrow">Private filing</span></header>
    <p className="text-sm leading-6 text-stone-600">Files stay with this client. Downloads require your signed-in account; they are not public links. Downloaded copies are your responsibility to protect.</p>
    {error ? <p className="alert-error" role="alert">Documents could not be loaded. Refresh to try again.</p> : files.length ? <ul className="divide-y divide-stone-200">{files.map((file) => <li className="flex flex-wrap items-center justify-between gap-4 py-4" key={file.id}><div className="min-w-0 space-y-1"><p className="break-all text-sm font-medium">{file.name.slice(38)}</p><p className="text-xs text-stone-500">PDF · {file.created_at ? new Intl.DateTimeFormat("en-IE", { dateStyle: "medium", timeZone: "Europe/Dublin" }).format(new Date(file.created_at)) : "Filed"}</p></div><a className="button-quiet" href={`/clients/${clientId}/documents/${encodeURIComponent(file.name)}`} download>Download<span className="sr-only"> {file.name.slice(38)}</span></a></li>)}</ul> : <p className="text-sm text-stone-600">No documents on this page.</p>}
    {(page > 1 || (data?.length ?? 0) > 20) && <nav aria-label="Document pages" className="flex flex-wrap gap-3">{page > 1 && <Link prefetch={false} className="button-secondary" href={`/clients/${clientId}?documentPage=${page - 1}#documents`}>Previous documents</Link>}{(data?.length ?? 0) > 20 && <Link prefetch={false} className="button-secondary" href={`/clients/${clientId}?documentPage=${page + 1}#documents`}>Next documents</Link>}</nav>}
    {archived ? <p className="text-sm text-stone-600">Restore this client to file new documents. Existing files remain retained.</p> : <DocumentUpload clientId={clientId} requestId={randomUUID()} />}
    <p className="text-xs leading-5 text-stone-500">Files cannot be overwritten or permanently deleted by ordinary accounts. Archiving is not erasure. An approved retention and erasure process is required before live use.</p>
  </section>;
}
