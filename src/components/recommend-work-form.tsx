"use client";
import {useActionState,useEffect,useRef,useState} from 'react';
import {recommendWork} from '@/app/actions/advisor';
import {SubmitButton} from '@/components/submit-button';
import {formatRate,rateUnits} from '@/lib/rates';
import type {Rate} from '@/lib/database.types';
export function RecommendWorkForm({clientId,requestId,rates}:{clientId:string;requestId:string;rates:Rate[]}) {
 const [state,action,pending]=useActionState(recommendWork.bind(null,clientId,requestId),{});
 const [values,set]=useState({title:'',rate_id:'',quantity:'1'});
 const error=useRef<HTMLParagraphElement>(null);
 useEffect(()=>{if(state.error)error.current?.focus();},[state]);
 const selected=rates.find(r=>r.id===values.rate_id);
 return <form action={action} onReset={e=>e.preventDefault()} className="space-y-5">
  {state.error&&<p ref={error} tabIndex={-1} role="alert" className="alert-error">{state.error}</p>}
  <div><label htmlFor="recommend-title" className="field-label">Recommended work</label><input id="recommend-title" name="title" className="field-input" required maxLength={120} value={values.title} onChange={e=>set({...values,title:e.target.value})} disabled={pending}/></div>
  <div className="grid gap-5 sm:grid-cols-[2fr_1fr]"><div><label htmlFor="recommend-rate" className="field-label">Rate-card service</label><select id="recommend-rate" name="rate_id" className="field-input" required value={values.rate_id} onChange={e=>set({...values,rate_id:e.target.value,quantity:'1'})} disabled={pending}><option value="" disabled>Choose a service</option>{rates.map(r=><option key={r.id} value={r.id}>{r.name} · {formatRate(r.price_cents)} · {rateUnits[r.unit]}</option>)}</select></div><div><label htmlFor="recommend-quantity" className="field-label">Estimated quantity</label><input id="recommend-quantity" name="quantity" className="field-input" required inputMode="decimal" maxLength={8} readOnly={selected?.unit==='fixed'} value={values.quantity} onChange={e=>set({...values,quantity:e.target.value})} disabled={pending}/></div></div>
  <p className="text-sm leading-6 text-stone-600">Quantity means hours, units or one fixed-price job, according to the selected rate. The saved estimate excludes VAT. This records your recommendation as planned work; it does not record client acceptance, send a message or create an amount owed.</p>
  <SubmitButton pendingLabel="Saving recommendation…">Recommend work</SubmitButton>
 </form>;
}
