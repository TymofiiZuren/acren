import { PrivateLink as Link } from '@/components/private-link';
import {requireSession} from '@/lib/require-session';
import {invoiceNumber,invoiceStatuses} from '@/lib/billing';
import {formatRate} from '@/lib/rates';
export async function ClientInvoices({clientId}:{clientId:string}) {
 const {supabase}=await requireSession();
 const {data,error}=await supabase.from('invoices').select('id,invoice_number,status,total_cents').eq('client_id',clientId).order('created_at',{ascending:false}).order('id').limit(10);
 return <section id="invoices" className="panel scroll-mt-8 space-y-4"><h2 className="text-xl font-medium">Client invoices</h2>{error?<p className="alert-error" role="alert">Invoices could not be loaded.</p>:!data?.length?<p className="text-sm text-stone-600">No invoices yet. Complete a job above, then choose Create invoice.</p>:<ul className="divide-y divide-stone-200">{data.map(i=><li key={i.id} className="flex flex-wrap justify-between gap-3 py-3"><Link className="underline underline-offset-4" href={`/invoices/${i.id}`}>{invoiceNumber(i.invoice_number)} · {invoiceStatuses[i.status]}</Link><span className="tabular-nums">{formatRate(i.total_cents)}</span></li>)}</ul>}<p className="text-xs text-stone-500">Latest 10 invoices for this client.</p><Link className="button-quiet" href="/invoices">All practice invoices →</Link></section>;
}
