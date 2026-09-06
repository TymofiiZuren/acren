import {randomUUID} from 'node:crypto';
import { PrivateLink as Link } from '@/components/private-link';
import {requireSession} from '@/lib/require-session';
import {formatBalance} from '@/lib/advisor';
import {RecommendWorkForm} from '@/components/recommend-work-form';
export async function ClientAdvisor({clientId,archived}:{clientId:string;archived:boolean}) {
 const {supabase,user}=await requireSession();
 const [balance,profile,rates]=await Promise.all([
  supabase.rpc('client_work_balance',{p_client_id:clientId}),
  supabase.from('billing_profiles').select('business_name').eq('consultant_id',user.id).maybeSingle(),
  archived?Promise.resolve(null):supabase.from('rates').select('*').eq('retired',false).order('created_at',{ascending:false}).limit(200)
 ]);
 return <section id="advisor" className="panel scroll-mt-8 space-y-6" aria-labelledby="advisor-title">
  <div className="space-y-2"><h2 id="advisor-title" className="text-xl font-medium">Advisor, work and balance</h2><p className="break-words text-sm text-stone-600">Advisor: you{user.email?` (${user.email})`:''}{profile.data?` · ${profile.data.business_name}`:''}</p><p className="text-xs text-stone-500">This client belongs to your advisor account. Other consultants cannot access this relationship.</p></div>
  {balance.error||!balance.data?<p className="alert-error" role="alert">Work and balance could not be loaded. Refresh to try again.</p>:<><dl className="grid gap-6 sm:grid-cols-2"><div className="space-y-2"><dt className="text-sm text-stone-600">Client owes</dt><dd className="text-3xl font-medium tabular-nums">{formatBalance(balance.data.owed_cents)}</dd><dd className="text-xs text-stone-500">Issued, unpaid invoices, including VAT where charged</dd></div><div className="space-y-2"><dt className="text-sm text-stone-600">Estimated unbilled work</dt><dd className="text-3xl font-medium tabular-nums">{formatBalance(balance.data.estimated_cents)}</dd><dd className="text-xs text-stone-500">Recommendations only, excluding VAT and cancelled or invoice-linked work</dd></div></dl><p className="text-sm text-stone-600">{balance.data.open_jobs} open jobs · {balance.data.completed_jobs} completed jobs · {formatBalance(balance.data.overdue_cents)} overdue</p><p className="text-xs leading-5 text-stone-500">Balances cover all invoices for this client, not just those displayed below. Drafts are not owed. Full payments remove invoices from the balance; partial payments are not supported.</p></>}
  {!archived&&(rates?.error?<p className="alert-error" role="alert">Rates could not be loaded.</p>:rates?.data?.length?<details className="space-y-5"><summary className="cursor-pointer py-3 font-medium">Recommend work for this client</summary><RecommendWorkForm clientId={clientId} requestId={randomUUID()} rates={rates.data}/><p className="text-xs text-stone-500">Latest 200 active rates. Recommendations appear in Client jobs below.</p></details>:<Link href="/rates/new" className="button-secondary">Add a rate to recommend work</Link>)}
 </section>;
}
