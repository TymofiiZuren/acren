import type { Metadata } from 'next';
import Link from 'next/link';
import { requireSession } from '@/lib/require-session';
import { BusinessForm } from '@/components/billing-forms';
export const metadata:Metadata={title:'Business details'};
export default async function BillingPage(){
 const {supabase,user}=await requireSession();
 const {data,error}=await supabase.from('billing_profiles').select('*').eq('consultant_id',user.id).maybeSingle();
 return <div className="mx-auto max-w-3xl space-y-6 px-5 py-8 sm:px-8"><Link href="/invoices" className="button-quiet">← Invoices</Link><header className="space-y-3"><h1 className="text-3xl font-medium tracking-tight">Your business details</h1><p className="text-stone-600">Invoices are issued under your business name, with a separate number sequence for your account.</p></header>{error?<p role="alert" className="alert-error">Business details could not be loaded. Refresh before making changes.</p>:<BusinessForm profile={data}/>}</div>;
}
