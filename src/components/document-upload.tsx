"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { fileDocument, type DocumentState } from "@/app/actions/documents";
import { MAX_DOCUMENT_BYTES } from "@/lib/documents";
import { SubmitButton } from "@/components/submit-button";

export function DocumentUpload({ clientId, requestId }: { clientId: string; requestId: string }) {
  const [state, action, pending] = useActionState<DocumentState, FormData>(fileDocument.bind(null, clientId, requestId), {});
  const [localError, setLocalError] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (state.error) errorRef.current?.focus(); }, [state]);
  if (state.message) return <p className="alert-success" role="status">{state.message}</p>;
  return <form action={action} className="space-y-4" onSubmit={(event) => { if (localError) event.preventDefault(); }}>
    <div className="space-y-2"><label className="field-label" htmlFor="document">File a PDF · maximum 750 KB</label>
      <input className="field-input file:mr-4 file:border-0 file:bg-transparent file:text-inherit" id="document" name="document" type="file" accept="application/pdf,.pdf" required disabled={pending} aria-describedby="document-help document-error" onChange={(event) => setLocalError((event.target.files?.[0]?.size ?? 0) > MAX_DOCUMENT_BYTES ? "Choose a PDF smaller than 750 KB." : "")} />
      <p id="document-help" className="text-sm leading-6 text-stone-600">Use a neutral filename without personal details. PDF header checks are not malware scanning. Use fictional documents only; no scanning service is connected.</p>
      <p ref={errorRef} tabIndex={-1} id="document-error" role="alert" className="field-error">{localError || state.error}</p>
    </div><SubmitButton pendingLabel="Filing document…">File document</SubmitButton>
  </form>;
}
