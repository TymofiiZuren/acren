import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import type { Metadata } from 'next';
import { requireSession } from '@/lib/require-session';
import { billingUuid } from '@/lib/billing';
import { irelandToday } from '@/lib/work-queue';
import { InvoiceDraftForm } from '@/components/billing-forms';
export const metadata:Metadata={title:'Draft invoice'};
export default async function NewInvoicePage({searchParams}:{searchParams:Promise<{job?:string}>}) {
 const {supabase,user}=await requireSession();const {job:id}=await searchParams;
 if(!id||!billingUuid.test(id)) return <div className="panel"><p>Choose a completed job from the client profile.</p><Link className="button-secondary" href="/clients">Client book</Link></div>;
 const [job,profile,rates,existing]=await Promise.all([supabase.from('jobs').select('id,client_id,title,status').eq('id',id).maybeSingle(),supabase.from('billing_profiles').select('*').eq('consultant_id',user.id).maybeSingle(),supabase.from('rates').select('*').eq('retired',false).order('created_at',{ascending:false}).limit(200),supabase.from('invoices').select('id').eq('job_id',id).neq('status','void').maybeSingle()]);
 const client=job.data?await supabase.from('clients').select('name,archived_at').eq('id',job.data.client_id).maybeSingle():null;
 const recommendation=await supabase.from('work_recommendations').select('rate_id,quantity').eq('job_id',id).maybeSingle();
 return <div className="mx-auto max-w-3xl space-y-6 px-5 py-8 sm:px-8"><Link href="/invoices" className="button-quiet">← Invoices</Link><header className="space-y-3"><h1 className="text-3xl font-medium tracking-tight">Create a draft invoice</h1><p className="break-words text-stone-600">{job.data?.title} {client?.data?`for ${client.data.name}`:''}</p></header>{job.error||profile.error||rates.error||existing.error||client?.error||recommendation.error?<p className="alert-error" role="alert">Billing details could not be loaded. Please refresh.</p>:existing.data?<div className="panel space-y-4"><p>This job already has an invoice.</p><Link className="button-primary" href={`/invoices/${existing.data.id}`}>View invoice</Link></div>:!job.data||job.data.status!=='completed'||!client?.data||client.data.archived_at?<p className="panel">A completed job for an active client is required.</p>:!profile.data?<Link className="button-primary" href="/billing">Set up your business details first</Link>:!rates.data?.length?<Link className="button-primary" href="/rates/new">Add a rate first</Link>:<><p className="text-xs text-stone-500">Choose from your most recent 200 active rates. One completed job per invoice. {recommendation.data?'The recommended rate and quantity are prefilled when the rate is available. Review actual work before billing.':''}</p><InvoiceDraftForm jobId={id} requestId={randomUUID()} rates={rates.data} registered={profile.data.vat_registered} today={irelandToday(new Date())} recommendation={recommendation.data}/></>}</div>;
}
