export type BillingProfile = { consultant_id: string; business_name: string; business_address: string; vat_registered: boolean; vat_number: string };
export type Invoice = { id:string; consultant_id:string; client_id:string; job_id:string; rate_id:string; status:'draft'|'issued'|'paid'|'void'; supplier_name:string; supplier_address:string; supplier_vat_number:string; vat_registered:boolean; customer_name:string; customer_address:string; description:string; rate_name:string; unit:'fixed'|'hour'|'unit'; price_cents:number; quantity:number; vat_basis_points:number|null; net_cents:number; vat_cents:number; total_cents:number; supply_date:string; due_date:string; invoice_number:number|null; issued_at:string|null; paid_date:string|null; created_at:string };
export const invoiceStatuses = {draft:'Draft',issued:'Unpaid',paid:'Paid',void:'Discarded draft'} as const;
export const invoiceNumber = (number:number|null) => number===null?'Draft':`INV-${String(number).padStart(6,'0')}`;
export const billingUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text=(f:FormData,k:string)=>typeof f.get(k)==='string'?(f.get(k) as string).trim():'';
export function parseBillingProfile(f:FormData) {
 const values={business_name:text(f,'business_name'),business_address:text(f,'business_address'),vat_registered:text(f,'vat_status')==='registered',vat_number:text(f,'vat_number')};
 if(!values.business_name || values.business_name.length>160 || !values.business_address || values.business_address.length>500 || !['registered','not_registered'].includes(text(f,'vat_status')) || values.vat_number.length>40 || (values.vat_registered?!values.vat_number:!!values.vat_number)) return {ok:false as const};
 return {ok:true as const,values};
}
export const billingDate = (v:string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && v>='2000-01-01' && v<='2100-12-31' && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,10)===v;
export function parseInvoiceDraft(f:FormData) {
 const q=text(f,'quantity'),tax=text(f,'vat_percent');
 const values={job_id:text(f,'job_id'),rate_id:text(f,'rate_id'),quantity:Number(q),customer_address:text(f,'customer_address'),supply_date:text(f,'supply_date'),due_date:text(f,'due_date'),vat_basis_points:tax===''?null:Math.round(Number(tax)*100)};
 if(!billingUuid.test(values.job_id)||!billingUuid.test(values.rate_id)||!/^\d{1,5}(\.\d{1,2})?$/.test(q)||values.quantity<=0||values.quantity>10000||!values.customer_address||values.customer_address.length>500||!billingDate(values.supply_date)||!billingDate(values.due_date)||(tax!==''&&(!/^\d{1,3}(\.\d{1,2})?$/.test(tax)||Number(tax)>100))) return {ok:false as const};
 return {ok:true as const,values};
}
