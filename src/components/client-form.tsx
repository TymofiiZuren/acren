"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { createClientRecord, updateClientRecord, type ClientFormState } from "@/app/actions/clients";
import { SubmitButton } from "@/components/submit-button";
import type { Client } from "@/lib/database.types";
import { counties } from "@/lib/counties";
import { hasClientChanges } from "@/lib/form-changes";

function FieldError({ id, children }: { id: string; children?: string }) { return children ? <p id={id} className="field-error">{children}</p> : null; }

export function ClientForm({ client }: { client?: Client }) {
  const action = client ? updateClientRecord.bind(null, client.id) : createClientRecord;
  const [state, formAction, pending] = useActionState<ClientFormState, FormData>(action, {});
  const form = useRef<HTMLFormElement>(null);
  const leaveDialog = useRef<HTMLDialogElement>(null);
  const continueLeave = useRef<(() => void) | null>(null);
  const leaving = useRef(false);
  const summary = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state.error || state.errors) summary.current?.focus(); }, [state]);
  const [values, setValues] = useState({ name: client?.name ?? "", herd_number: client?.herd_number ?? "", county: client?.county ?? "", phone: client?.phone ?? "", email: client?.email ?? "" });
  const [original] = useState(values);
  const dirty = hasClientChanges(original, values);
  useEffect(() => {
    if (!dirty || pending) return;
    const warn = (event: BeforeUnloadEvent) => { if (!leaving.current) { event.preventDefault(); event.returnValue = ""; } };
    const confirmLeave = (event: Event) => {
      if (leaving.current) return;
      if (event instanceof MouseEvent) {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
        if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download")) return;
        const target = new URL(link.href);
        if (target.pathname === location.pathname && target.search === location.search) return;
        continueLeave.current = () => link.click();
      } else {
        const target = event.target;
        if (target === form.current || !(target instanceof HTMLFormElement) || target.dataset.preserveDraft === "true") return;
        continueLeave.current = () => target.requestSubmit();
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      leaveDialog.current?.showModal();
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", confirmLeave, true);
    document.addEventListener("submit", confirmLeave, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", confirmLeave, true);
      document.removeEventListener("submit", confirmLeave, true);
    };
  }, [dirty, pending]);

  return (
    <form ref={form} action={formAction} onReset={(event) => event.preventDefault()} className="rounded-lg border border-stone-200 bg-surface p-5 sm:p-8">
      <dialog ref={leaveDialog} aria-labelledby="leave-title" aria-describedby="leave-description" className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-stone-200 p-6 shadow-xl backdrop:bg-black/70">
        <h2 id="leave-title" className="text-xl font-medium">Leave without saving?</h2><p id="leave-description" className="py-4 text-sm leading-6 text-stone-600">Your changes have not been saved. Stay here to finish editing, or leave and discard this draft.</p><div className="flex flex-wrap gap-3"><button type="button" className="button-primary" onClick={() => leaveDialog.current?.close()}>Keep editing</button><button type="button" className="button-secondary" onClick={() => { leaving.current = true; leaveDialog.current?.close(); continueLeave.current?.(); }}>Leave without saving</button></div>
      </dialog>
      <div className="mb-6 border-b border-stone-100 pb-6"><p className="eyebrow">Client details</p><p className="pt-2 text-sm leading-6 text-stone-600">Keep only the details needed for your work. All five fields are required for this client book.</p></div>
      {(state.error || state.errors) && <div ref={summary} tabIndex={-1} className="alert-error mb-6" role="alert"><p>{state.error ?? "Check the highlighted details below."}</p>{state.errors && <ul className="list-disc space-y-1 pl-5 pt-2">{Object.entries(state.errors).map(([field, message]) => <li key={field}><a href={`#${field}`} className="underline">{message}</a></li>)}</ul>}</div>}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="name">Client name</label>
          <input className="field-input" id="name" name="name" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} maxLength={120} required aria-invalid={!!state.errors?.name} aria-describedby={state.errors?.name ? "name-error" : undefined} />
          <FieldError id="name-error">{state.errors?.name}</FieldError>
        </div>
        <div>
          <label className="field-label" htmlFor="herd_number">Herd number</label>
          <input className="field-input uppercase" id="herd_number" name="herd_number" value={values.herd_number} onChange={(event) => setValues({ ...values, herd_number: event.target.value })} maxLength={32} required aria-invalid={!!state.errors?.herd_number} aria-describedby={state.errors?.herd_number ? "herd-error" : undefined} />
          <FieldError id="herd-error">{state.errors?.herd_number}</FieldError>
        </div>
        <div>
          <label className="field-label" htmlFor="county">County</label>
          <select className="field-input" id="county" name="county" value={values.county} onChange={(event) => setValues({ ...values, county: event.target.value })} required aria-invalid={!!state.errors?.county} aria-describedby={state.errors?.county ? "county-error" : undefined}>
            <option value="" disabled>Select a county</option>
            {counties.map((county) => <option key={county}>{county}</option>)}
          </select>
          <FieldError id="county-error">{state.errors?.county}</FieldError>
        </div>
        <div>
          <label className="field-label" htmlFor="phone">Phone</label>
          <input className="field-input" id="phone" name="phone" type="tel" value={values.phone} onChange={(event) => setValues({ ...values, phone: event.target.value })} maxLength={32} required aria-invalid={!!state.errors?.phone} aria-describedby={state.errors?.phone ? "phone-error" : undefined} />
          <FieldError id="phone-error">{state.errors?.phone}</FieldError>
        </div>
        <div>
          <label className="field-label" htmlFor="email">Email</label>
          <input className="field-input" id="email" name="email" type="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} maxLength={254} required aria-invalid={!!state.errors?.email} aria-describedby={state.errors?.email ? "email-error" : undefined} />
          <FieldError id="email-error">{state.errors?.email}</FieldError>
        </div>
      </div>
      <p role="status" className="pt-5 text-sm text-stone-600">{pending ? "Saving your details…" : dirty ? "Unsaved changes. Save before leaving this page." : client ? "You’re viewing the saved details." : "Your new client has not been saved yet."}</p>
      <p className="pt-2 text-xs leading-5 text-stone-500">Drafts are not stored on this device. Browser back/forward and closing an app may not show a warning.</p>
      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-stone-100 pt-6 sm:flex-row sm:justify-end">
        <Link href={client ? `/clients/${client.id}` : "/clients"} className="button-secondary">Cancel</Link>
        <SubmitButton pendingLabel="Saving…">{client ? "Save changes" : "Add client"}</SubmitButton>
      </div>
    </form>
  );
}
