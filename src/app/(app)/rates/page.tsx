import type { Metadata } from "next";
import { PrivateLink as Link } from "@/components/private-link";
import { requireSession } from "@/lib/require-session";
import { formatRate, rateUnits } from "@/lib/rates";
import { RetireRateForm } from "@/components/rate-form";

export const metadata: Metadata = { title: "Rate card" };
export default async function RatesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase } = await requireSession();
  const params = await searchParams;
  const retired = params.status === "retired";
  const page = typeof params.page === "string" && /^\d{1,5}$/.test(params.page) ? Math.max(1, Number(params.page)) : 1;
  const { data, error, count } = await supabase.from("rates").select("*", { count: "exact" }).eq("retired", retired).order("created_at", { ascending: false }).order("id").range((page - 1) * 25, page * 25 - 1);
  const href = (next: number) => `/rates?status=${retired ? "retired" : "active"}&page=${next}`;
  return <div className="mx-auto max-w-6xl space-y-6 px-5 py-8 sm:px-8">
    <div className="flex flex-wrap items-start justify-between gap-4"><div className="space-y-2"><p className="eyebrow">Practice / Pricing</p><h1 className="text-3xl font-medium tracking-tight">Rate card</h1><p className="text-stone-600">Your services and agreed planning prices.</p></div><Link href="/rates/new" className="button-primary">Add rate</Link></div>
    {params.notice === "added" && <p role="status" className="alert-success">Rate added.</p>}
    <nav aria-label="Rate status" className="section-links"><Link href="/rates" className="nav-link" aria-current={!retired ? "page" : undefined}>Active rates</Link><Link href="/rates?status=retired" className="nav-link" aria-current={retired ? "page" : undefined}>Retired rates</Link></nav>
    <p className="text-sm leading-6 text-stone-600">EUR prices only. No VAT is calculated and no invoice is issued here. Prices cannot be overwritten: retire an old rate and add its replacement.</p>
    {error ? <p role="alert" className="alert-error">Could not load your rates. Please refresh and try again.</p> : <>
      <p className="text-sm text-stone-500">{count ?? 0} {retired ? "retired" : "active"} rates · Page {page}</p>
      {!data?.length ? <div className="panel space-y-2"><h2 className="font-medium">{page > 1 ? "No rates on this page" : retired ? "No retired rates" : "Start your rate card"}</h2><p className="text-sm text-stone-600">{page > 1 ? "Return to the first page to review your rates." : retired ? "Rates you retire will remain here for reference." : "Add your first service and its price. Only your account can access your rates."}</p>{page > 1 && <Link className="button-quiet" href={href(1)}>First page</Link>}</div> : <div className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-surface">{data.map(rate => <article key={rate.id} className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-6"><div className="min-w-0 space-y-2"><h2 className="break-words font-medium">{rate.name}</h2><p className="text-sm text-stone-500">{rateUnits[rate.unit]} · {rate.retired ? "Retired" : "Active"}</p><p className="text-xs text-stone-500">Added {new Date(rate.created_at).toLocaleDateString("en-IE", { timeZone: "Europe/Dublin" })}{rate.retired_at ? ` · Retired ${new Date(rate.retired_at).toLocaleDateString("en-IE", { timeZone: "Europe/Dublin" })}` : ""}</p></div><div className="space-y-2 sm:text-right"><p className="text-xl tabular-nums">{formatRate(rate.price_cents)}</p>{!rate.retired && <RetireRateForm id={rate.id} name={rate.name} />}</div></article>)}</div>}
      <nav aria-label="Rate pages" className="flex justify-between gap-3">{page > 1 ? <Link className="button-secondary" href={href(page - 1)}>Previous</Link> : <span />}{page * 25 < (count ?? 0) && <Link className="button-secondary" href={href(page + 1)}>Next</Link>}</nav>
    </>}
  </div>;
}
