"use client";

import { PrivateLink as Link } from "@/components/private-link";
import { useActionState, useEffect, useRef, useState } from "react";
import { createRate, retireRate, type RateFormState } from "@/app/actions/rates";
import { SubmitButton } from "@/components/submit-button";
import { rateUnits } from "@/lib/rates";

export function RateForm({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState<RateFormState, FormData>(createRate.bind(null, requestId), {});
  const [values, setValues] = useState({ name: "", price: "", unit: "fixed" });
  const summary = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state.error || state.errors) summary.current?.focus(); }, [state]);
  return <form action={action} onReset={event => event.preventDefault()} className="panel space-y-6">
    {(state.error || state.errors) && <div ref={summary} tabIndex={-1} className="alert-error" role="alert"><p>{state.error ?? "Check the highlighted fields."}</p>{state.errors && <ul className="list-disc pl-5">{Object.entries(state.errors).map(([key, message]) => <li key={key}><a className="underline" href={`#${key}`}>{message}</a></li>)}</ul>}</div>}
    <div><label className="field-label" htmlFor="name">Service name (required)</label><input id="name" name="name" className="field-input" required maxLength={120} value={values.name} onChange={e => setValues({ ...values, name: e.target.value })} disabled={pending} aria-invalid={!!state.errors?.name} aria-describedby="name-error" /><p id="name-error" className="field-error">{state.errors?.name}</p></div>
    <div className="grid gap-5 sm:grid-cols-2">
      <div><label className="field-label" htmlFor="price">Price in EUR (required)</label><input id="price" name="price" className="field-input" inputMode="decimal" required maxLength={10} placeholder="150.00" value={values.price} onChange={e => setValues({ ...values, price: e.target.value })} disabled={pending} aria-invalid={!!state.errors?.price} aria-describedby="price-help price-error" /><p id="price-help" className="field-help">Up to two decimal places. No commas.</p><p id="price-error" className="field-error">{state.errors?.price}</p></div>
      <div><label className="field-label" htmlFor="unit">Billing unit (required)</label><select id="unit" name="unit" className="field-input" value={values.unit} onChange={e => setValues({ ...values, unit: e.target.value })} disabled={pending} aria-invalid={!!state.errors?.unit} aria-describedby="unit-error">{Object.entries(rateUnits).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><p id="unit-error" className="field-error">{state.errors?.unit}</p></div>
    </div>
    <p className="text-sm leading-6 text-stone-600">A planning price, not an invoice or a tax calculation. Once saved, the service and price are fixed; retire and replace a rate to change it. Drafts are not saved when you leave.</p>
    <div className="flex flex-wrap justify-end gap-3 border-t border-stone-200 pt-4"><Link href="/rates" className="button-secondary">Cancel</Link><SubmitButton pendingLabel="Saving rate…">Add rate</SubmitButton></div>
  </form>;
}

export function RetireRateForm({ id, name }: { id: string; name: string }) {
  const [state, action] = useActionState<RateFormState, FormData>(retireRate.bind(null, id), {});
  return <details className="text-sm"><summary className="cursor-pointer py-3 text-stone-600 underline underline-offset-4">Retire rate</summary><form action={action} className="space-y-3 pt-2"><p>This keeps the record but permanently removes it from your active rate card.</p><label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="confirm" value="yes" required />Retire {name}</label>{state.error && <p role="alert" className="field-error">{state.error}</p>}{state.message && <p role="status">{state.message}</p>}<SubmitButton className="button-secondary" pendingLabel="Retiring…">Confirm retirement</SubmitButton></form></details>;
}
