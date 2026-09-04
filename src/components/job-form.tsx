"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { createJob, type JobFormState } from "@/app/actions/jobs";
import { SubmitButton } from "@/components/submit-button";

export function JobForm({ clientId, requestId }: { clientId: string; requestId: string }) {
  const [state, action, pending] = useActionState<JobFormState, FormData>(createJob.bind(null, clientId, requestId), {});
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const summary = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state.error || state.errors) summary.current?.focus(); }, [state]);
  return <form action={action} className="panel space-y-6">
    {(state.error || state.errors) && <div ref={summary} tabIndex={-1} role="alert" className="alert-error">
      <p>{state.error ?? "Check the highlighted job details."}</p>
      {state.errors && <ul className="list-disc space-y-1 pl-5 pt-2">{Object.entries(state.errors).map(([field, message]) => <li key={field}><a className="underline" href={`#${field}`}>{message}</a></li>)}</ul>}
    </div>}
    <div className="space-y-2"><label className="field-label" htmlFor="title">Job title (required)</label>
      <input className="field-input" id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required disabled={pending} aria-invalid={!!state.errors?.title} aria-describedby="title-help title-error" />
      <p id="title-help" className="text-sm leading-6 text-stone-600">Describe the work briefly, for example “Prepare application”. Do not include sensitive personal details.</p>
      <p id="title-error" className="field-error">{state.errors?.title}</p>
    </div>
    <div className="space-y-2"><label className="field-label" htmlFor="target_date">Target date (optional)</label>
      <input className="field-input" id="target_date" name="target_date" type="date" min="2000-01-01" max="2100-12-31" value={date} onChange={(e) => setDate(e.target.value)} disabled={pending} aria-invalid={!!state.errors?.target_date} aria-describedby="date-help date-error" />
      <p id="date-help" className="text-sm leading-6 text-stone-600">Your own planning date, not a verified scheme deadline. No reminder will be sent.</p>
      <p id="date-error" className="field-error">{state.errors?.target_date}</p>
    </div>
    <p className="text-sm leading-6 text-stone-600">Jobs start as Planned. The title and date are fixed after creation in this first version; cancel and replace an incorrect job. Drafts are not saved when you leave this page.</p>
    <div className="flex flex-wrap justify-end gap-3"><Link className="button-secondary" href={`/clients/${clientId}#jobs`}>Cancel</Link><SubmitButton pendingLabel="Adding job…">Add job</SubmitButton></div>
  </form>;
}
