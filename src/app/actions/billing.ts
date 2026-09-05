"use server";
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/require-session';
import { billingDate, billingUuid, parseBillingProfile, parseInvoiceDraft } from '@/lib/billing';
export type BillingState={error?:string;message?:string};
export async function saveBillingProfile(_:BillingState,form:FormData):Promise<BillingState> {
 const {supabase,user}=await requireSession(); const parsed=parseBillingProfile(form);
 if(!parsed.ok) return {error:'Enter your business name and address, choose your VAT status, and supply a VAT number only if registered.'};
 const result=await supabase.from('billing_profiles').insert({...parsed.values,consultant_id:user.id});
 if(result.error?.code==='23505') {
   const updated=await supabase.from('billing_profiles').update(parsed.values).eq('consultant_id',user.id).select('consultant_id').maybeSingle();
   if(updated.error||!updated.data) return {error:'Business details could not be saved. Please retry.'};
 } else if(result.error) return {error:'Business details could not be saved. Please retry.'};
 revalidatePath('/billing'); revalidatePath('/invoices');
 return {message:'Business details saved. Existing invoice snapshots are unchanged.'};
}
export async function createInvoice(requestId:string,_:BillingState,form:FormData):Promise<BillingState> {
 const {supabase}=await requireSession(); const parsed=parseInvoiceDraft(form);
 if(!billingUuid.test(requestId)||!parsed.ok) return {error:'Check the selected job and rate, quantity, customer address, dates and VAT percentage.'};
 const v=parsed.values;
 const {data,error}=await supabase.rpc('create_invoice_draft',{p_id:requestId,p_job_id:v.job_id,p_rate_id:v.rate_id,p_quantity:v.quantity,p_customer_address:v.customer_address,p_supply_date:v.supply_date,p_due_date:v.due_date,p_vat_basis_points:v.vat_basis_points});
 if(error||!data) return {error:'Draft not created. Check that the job is completed and unbilled, the client and rate are active, business details are saved, and dates/VAT match. Per-job rates require quantity 1. Refresh to check whether a prior attempt succeeded.'};
 revalidatePath('/invoices'); revalidatePath('/clients','layout');
 redirect(`/invoices/${data}`);
}
export async function changeInvoice(id:string,action:'issue'|'void'|'paid',_:BillingState,form:FormData):Promise<BillingState> {
 const {supabase}=await requireSession(); const date=form.get('paid_date');
 if(!billingUuid.test(id)||!['issue','void','paid'].includes(action)||form.get('confirm')!=='yes'||(action==='paid'&&(typeof date!=='string'||!billingDate(date)))) return {error:'Confirm the action and provide a valid payment date when recording payment.'};
 const {error}=await supabase.rpc('transition_invoice',{p_id:id,p_action:action,p_paid_date:action==='paid'?date as string:null});
 if(error) return {error:'Invoice not changed. Refresh to review its current status. To issue, the client must be active, dates current and business details unchanged. Discard and recreate a draft if needed. Paid invoices cannot be changed here.'};
 revalidatePath('/invoices');revalidatePath(`/invoices/${id}`);revalidatePath('/clients','layout');revalidatePath('/jobs');
 return {message:action==='issue'?'Invoice issued. It has not been emailed.':action==='void'?'Draft discarded. The job can be billed again.':'Full payment recorded. No money was collected by Acren.'};
}
