"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { createClientRecord, updateClientRecord, type ClientFormState } from "@/app/actions/clients";
import { SubmitButton } from "@/components/submit-button";
import type { Client } from "@/lib/database.types";
import { counties } from "@/lib/counties";
import { hasClientChanges } from "@/lib/form-changes";
import { normalisePhone, phoneCountries, phoneFormatFor, formatPhoneInput, phoneTooLong, acceptPhoneEdit, phoneValidationMessage, type PhoneFormat } from "@/lib/phone";

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
  const [values, setValues] = useState({ name: client?.name ?? "", herd_number: client?.herd_number ?? "", county: client?.county ?? "", phone: formatPhoneInput(client?.phone ?? "", phoneFormatFor(client?.phone ?? "")), email: client?.email ?? "" });
  const [original] = useState(values);
  const [phoneFormat, setPhoneFormat] = useState<PhoneFormat>(phoneFormatFor(client?.phone ?? ""));
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [phoneNotice, setPhoneNotice] = useState("");
  const phoneInput = useRef<HTMLInputElement>(null);
  const currentPhoneError = phoneValidationMessage(values.phone, phoneFormat);
  const visiblePhoneError = phoneTouched || phoneTooLong(values.phone, phoneFormat) || state.errors?.phone ? currentPhoneError : "";
  useEffect(() => { phoneInput.current?.setCustomValidity(currentPhoneError); }, [currentPhoneError]);
  const [originalPhoneFormat] = useState(phoneFormat);
  const phonePreview = normalisePhone(values.phone, phoneFormat);
  const selectedPhoneCountry = phoneCountries.find(country => country.id === phoneFormat);
  const dirty = hasClientChanges(original, values) || phoneFormat !== originalPhoneFormat;
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
    <form ref={form} action={formAction} onReset={(event) => event.preventDefault()} className="panel">
      <dialog ref={leaveDialog} aria-labelledby="leave-title" aria-describedby="leave-description" className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-stone-200 p-6 shadow-xl backdrop:bg-black/70">
        <h2 id="leave-title" className="text-xl font-medium">Leave without saving?</h2><p id="leave-description" className="py-4 text-sm leading-6 text-stone-600">Your changes have not been saved. Stay here to finish editing, or leave and discard this draft.</p><div className="flex flex-wrap gap-3"><button type="button" className="button-primary" onClick={() => leaveDialog.current?.close()}>Keep editing</button><button type="button" className="button-secondary" onClick={() => { leaving.current = true; leaveDialog.current?.close(); continueLeave.current?.(); }}>Leave without saving</button></div>
      </dialog>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2 border-b border-stone-100 pb-4"><h2 className="text-base font-medium tracking-tight">Client details</h2><p className="text-xs text-stone-500">All fields required</p></div>
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
          <label className="field-label" htmlFor="phone">Phone number</label>
          <div className="phone-field">
            <label className="sr-only" htmlFor="phone-format">Phone country / format</label>
            <div className="phone-code">
            <span aria-hidden="true" className="phone-code-display">+{selectedPhoneCountry?.code ?? "353"}<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="m3 4.5 3 3 3-3" stroke="currentColor" strokeWidth="1.5" /></svg></span>
            <select id="phone-format" name="phone_format" value={phoneFormat} onChange={(event) => { const country = event.target.value as PhoneFormat; setPhoneFormat(country); setPhoneTouched(false); setValues({ ...values, phone: "" }); setPhoneNotice("Country changed. Enter a new phone number."); }} aria-describedby="phone-help">
              <optgroup label="Countries and territories">
                {phoneCountries.map(country => <option key={country.id} value={country.id}>{country.name} (+{country.code})</option>)}
              </optgroup>
            </select>
            </div>
            <input ref={phoneInput} id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={values.phone} onChange={(event) => { const next = acceptPhoneEdit(values.phone, event.target.value, phoneFormat); if (next === null) { setPhoneNotice("Maximum length reached for this country. Extra digits or an overlong paste were not entered."); return; } setPhoneNotice(""); setValues({ ...values, phone: next }); }} onBlur={() => setPhoneTouched(true)} onInvalid={() => setPhoneTouched(true)} required aria-invalid={!!visiblePhoneError} aria-describedby={`phone-help phone-notice${visiblePhoneError ? " phone-error" : ""}`} />
          </div>
          <p id="phone-help" className="pt-2 text-xs leading-5 text-stone-500">{selectedPhoneCountry?.name}: enter a national or full international number. Length and number pattern are checked, not ownership or reachability.</p>
          <p className="min-h-6 break-all pt-1 text-xs text-stone-600">{phonePreview ? <>Saves as <span className="tabular-nums">{phonePreview}</span></> : "Your entry stays unchanged while editing."}</p>
          <FieldError id="phone-error">{visiblePhoneError}</FieldError>
          <p id="phone-notice" role="status" className="text-xs leading-5 text-stone-600">{phoneNotice}</p>
        </div>
        <div>
          <label className="field-label" htmlFor="email">Email</label>
          <input className="field-input" id="email" name="email" type="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} maxLength={254} required aria-invalid={!!state.errors?.email} aria-describedby={state.errors?.email ? "email-error" : undefined} />
          <FieldError id="email-error">{state.errors?.email}</FieldError>
        </div>
      </div>
      <p role="status" className="pt-5 text-xs text-stone-600">{pending ? "Saving your details…" : dirty ? "Unsaved changes" : client ? "All changes saved" : "Save to add this client"}</p>
      <details className="pt-2 text-xs leading-5 text-stone-500"><summary className="cursor-pointer underline decoration-stone-300 underline-offset-4">About saving your details</summary><p className="pt-2">Keep only details needed for your work. Drafts are not stored on this device. Save before leaving; browser back/forward or closing an app may not show a warning. No SMS or call is sent.</p></details>
      <div className="mt-5 flex flex-col-reverse gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:justify-end">
        <Link href={client ? `/clients/${client.id}` : "/clients"} className="button-secondary">Cancel</Link>
        <SubmitButton pendingLabel="Saving…">{client ? "Save changes" : "Add client"}</SubmitButton>
      </div>
    </form>
  );
}
