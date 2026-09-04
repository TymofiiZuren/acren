"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { searchDirectory } from "@/app/actions/directory";
import { archiveClient, restoreClient } from "@/app/actions/clients";
import { SearchIcon, UsersIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { counties } from "@/lib/counties";
import { pageSizes, sortOptions, type DirectoryOptions } from "@/lib/directory-options";
import type { DirectoryResult } from "@/lib/client-directory";

function ArchiveControl({ id }: { id: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return <><button type="button" className="button-quiet" onClick={() => dialog.current?.showModal()}>Archive</button>
    <dialog ref={dialog} aria-labelledby={`archive-title-${id}`} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-stone-200 p-6 shadow-xl backdrop:bg-black/70">
      <h2 id={`archive-title-${id}`} className="text-xl font-medium">Archive this client?</h2><p className="py-4 text-sm leading-6 text-stone-600">Their details will remain stored, but they’ll leave your active client book. You can restore them from Archived. This is not permanent deletion.</p>
      <div className="flex flex-wrap justify-end gap-3"><button className="button-secondary" type="button" onClick={() => dialog.current?.close()}>Cancel</button><form action={archiveClient.bind(null, id)}><SubmitButton pendingLabel="Archiving…">Archive client</SubmitButton></form></div>
    </dialog></>;
}

export function ClientDirectory({ initial, archived }: { initial: DirectoryResult; archived: boolean }) {
  const [term, setTerm] = useState(initial.term);
  const [county, setCounty] = useState(initial.county);
  const [sort, setSort] = useState<DirectoryOptions["sort"]>(initial.sort);
  const [pageSize, setPageSize] = useState<DirectoryOptions["pageSize"]>(initial.pageSize);
  const [state, action, pending] = useActionState(async (previous: DirectoryResult, formData: FormData) => {
    const result = await searchDirectory(archived, previous, formData);
    if (formData.has("clear")) { setTerm(""); setCounty(""); setSort("name"); setPageSize(25); }
    return result;
  }, initial);
  const changed = term.trim() !== state.term || county !== state.county || sort !== state.sort || pageSize !== state.pageSize;
  const filtered = !!(state.term || state.county);
  const pages = Math.max(1, Math.ceil(state.count / state.pageSize));
  return <section aria-label="Client directory" className="overflow-hidden rounded-lg border border-stone-200 bg-surface">
    <div className="border-b border-stone-200 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5"><h2 className="text-lg font-medium">{archived ? "Archived directory" : "Client directory"}</h2><p role="status" aria-atomic="true" className="text-sm text-stone-600">{pending ? "Searching…" : state.error ? "Results unavailable" : `${state.count} ${state.count === 1 ? "client" : "clients"}${state.term ? " found" : ""}`}</p></div>
      <form action={action} onReset={(event) => event.preventDefault()} className="space-y-3">
        <label htmlFor="client-search" className="sr-only">Search by name or herd number</label>
        <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><SearchIcon className="pointer-events-none absolute left-4 top-4 size-5 text-stone-500" /><input id="client-search" name="q" maxLength={120} value={term} onChange={(event) => setTerm(event.target.value)} className="field-input mt-0 pl-12" placeholder="Search by name or herd number" autoComplete="off" /></div><button className="button-primary" name="page" value="0" disabled={pending}>Search</button>{(term || county || sort !== "name" || pageSize !== 25) && <button className="button-secondary" type="submit" name="clear" value="true" disabled={pending}>Reset filters</button>}</div>
        <div className="grid gap-4 sm:grid-cols-2"><div><label className="field-label" htmlFor="county-filter">County</label><select id="county-filter" name="county" className="field-input" value={county} onChange={(event) => setCounty(event.target.value)}><option value="">All counties</option>{counties.map((item) => <option key={item}>{item}</option>)}</select></div><div><label className="field-label" htmlFor="sort-order">Sort by</label><select id="sort-order" name="sort" className="field-input" value={sort} onChange={(event) => setSort(event.target.value as DirectoryOptions["sort"])}>{Object.entries(sortOptions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></div>
        <div className="max-w-xs"><label className="field-label" htmlFor="page-size">Results per page</label><select id="page-size" name="pageSize" className="field-input" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value) as DirectoryOptions["pageSize"])}>{pageSizes.map((size) => <option key={size} value={size}>{size} clients</option>)}</select></div>
        <p className="text-xs leading-5 text-stone-500">{changed ? "View changed. Select Search to apply from page 1. " : state.county ? `Showing clients in ${state.county}. ` : ""}Search stays out of the page address and browser history.</p>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2"><p className="text-xs font-semibold text-stone-600">{state.count ? `${state.page * state.pageSize + 1}–${Math.min((state.page + 1) * state.pageSize, state.count)} of ${state.count}` : "0 results"} · Page {state.page + 1} of {pages}</p><div className="flex gap-2"><button className="button-quiet" name="page" value={state.page - 1} disabled={pending || changed || state.page === 0}>Previous</button><button className="button-quiet" name="page" value={state.page + 1} disabled={pending || changed || state.page + 1 >= pages}>Next</button></div></div>
      </form>
    </div>
    <div aria-busy={pending} className={pending ? "opacity-60" : ""}>
      {state.error ? <div className="p-5"><p className="alert-error" role="alert">{state.error}</p></div> : state.clients.length === 0 ? <div className="flex flex-col items-center gap-4 px-6 py-16 text-center"><span className="grid size-14 place-items-center rounded-lg bg-emerald-50 text-emerald-900"><UsersIcon /></span><h3 className="text-xl font-medium">{filtered ? "No matching clients" : archived ? "Nothing archived" : "Start with your first client"}</h3><p className="max-w-sm text-sm leading-6 text-stone-600">{filtered ? "Try another search or reset the county filter." : archived ? "Clients you archive will be available here to review or restore." : "A name, a herd number and the right contact details. Everything you need, in one place."}</p>{!archived && !filtered && <Link href="/clients/new" className="button-primary">Add your first client</Link>}</div> :
      <div className="divide-y divide-stone-100">{state.clients.map((client) => <article key={client.id} className="grid gap-4 p-5 hover:bg-stone-50 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
        <div className="flex min-w-0 items-center gap-4"><span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-md bg-stone-100 text-sm font-medium text-emerald-900">{client.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}</span><div className="min-w-0"><h3 className="break-words font-medium">{client.name}</h3><dl className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm"><div className="space-y-1"><dt className="text-stone-600">County</dt><dd className="font-medium">{client.county}</dd></div><div className="min-w-0 space-y-1"><dt className="text-stone-600">Herd number</dt><dd className="break-all font-mono">{client.herd_number}</dd></div></dl></div></div>
        <div className="flex flex-wrap items-center gap-2"><Link href={`/clients/${client.id}`} prefetch={false} className="button-secondary" aria-label={`View ${client.name}`}>View client</Link>{archived ? <form action={restoreClient.bind(null, client.id)}><SubmitButton className="button-quiet" pendingLabel="Restoring…">Restore</SubmitButton></form> : <ArchiveControl id={client.id} />}</div>
      </article>)}</div>}
    </div>
  </section>;
}
