import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/require-session';
import { billingUuid,invoiceNumber } from '@/lib/billing';
import { irelandToday } from '@/lib/work-queue';
import { InvoiceSheet } from '@/components/invoice-sheet';
import { InvoiceAction } from '@/components/billing-forms';
import { PrintInvoice } from '@/components/print-invoice';
export const metadata:Metadata={title:'Invoice'};
export default async function InvoicePage({params}:{params:Promise<{id:string}>}) {
 const {supabase}=await requireSession(); const {id}=await params;if(!billingUuid.test(id)) notFound();
 const {data:i,error}=await supabase.from('invoices').select('*').eq('id',id).maybeSingle();
 if(error) throw new Error('Invoice could not be loaded'); if(!i) notFound();
 const events=await supabase.from('invoice_events').select('id,action,occurred_at').eq('invoice_id',id).order('occurred_at').limit(10);
 const today=irelandToday(new Date());
 return <div className="mx-auto max-w-4xl space-y-6 px-5 py-8 sm:px-8"><Link className="button-quiet" href="/invoices">← Invoices</Link><header className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-medium tracking-tight">{invoiceNumber(i.invoice_number)}</h1><PrintInvoice/></header><InvoiceSheet invoice={i}/>{i.status==='draft'?<section className="panel space-y-6" aria-label="Draft actions"><InvoiceAction id={id} action="issue" today={today}/><details><summary className="cursor-pointer py-3 underline underline-offset-4">Correct or discard this draft</summary><p className="py-3 text-sm text-stone-600">To change details, discard this draft and create a replacement from the same job. No invoice number is consumed.</p><InvoiceAction id={id} action="void" today={today}/></details></section>:i.status==='issued'?<section className="panel space-y-4"><h2 className="text-xl font-medium">Payment tracking</h2><InvoiceAction id={id} action="paid" today={today} issueDate={irelandToday(new Date(i.issued_at!))}/><p className="text-xs text-stone-500">Only full payments are supported. Do not mark a partially paid invoice as paid. Payment corrections and credit notes require a future controlled workflow.</p></section>:null}
 <section className="panel space-y-4"><h2 className="text-xl font-medium">Invoice activity</h2>{events.error?<p role="alert" className="alert-error">Activity could not be loaded.</p>:<ol className="space-y-3 text-sm">{events.data?.map(e=><li key={e.id}>{e.action==='void'?'Draft discarded':e.action==='created'?'Draft created':e.action==='issued'?'Invoice issued':'Full payment recorded'} · {new Intl.DateTimeFormat('en-IE',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Dublin'}).format(new Date(e.occurred_at))}</li>)}</ol>}<p className="text-xs text-stone-500">Recorded by the database. Issuing is not email delivery.</p></section><Link className="button-secondary" href={`/clients/${i.client_id}#jobs`}>Client work</Link></div>;
}
