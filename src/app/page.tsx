import Link from "next/link";
import { ThemeSwitch } from "@/components/theme-switch";
import { ArrowIcon, AcrenMark } from "@/components/icons";

export default function Home() {
  const samples = [["AM", "Aoife Murphy", "C-10482", "Cork"], ["BK", "Brian Kelly", "G-20918", "Galway"], ["SO", "Seán O’Donnell", "D-80137", "Donegal"]];
  return (
    <div className="min-h-screen overflow-hidden bg-stone-100 text-stone-950">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <div className="flex items-center gap-2 text-xl font-medium tracking-tight"><span className="grid size-9 place-items-center rounded-md bg-accent text-white"><AcrenMark /></span>Acren</div>
        <div className="flex flex-wrap items-center justify-end gap-2"><ThemeSwitch /><Link href="/login" className="button-secondary">Sign in</Link></div>
      </header>
      <main id="main-content" className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.06fr_.94fr] lg:pt-20">
        <section>
          <p className="eyebrow">Practice management for agricultural consultants</p>
          <h1 className="mt-5 max-w-2xl text-balance text-5xl font-medium leading-[1.04] tracking-[-0.045em] sm:text-7xl">Client work, from first record to final invoice.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-stone-600">Acren brings client details, scheme work, rates and billing into one practical workspace for Irish agricultural consultants.</p>
          <Link href="/signup" className="button-primary mt-9 inline-flex gap-2 px-6">Create an account <ArrowIcon className="size-4" /></Link>
        </section>
        <section className="relative" aria-label="Example client book">
          <div className="absolute -inset-16 -z-10 rounded-full bg-emerald-800/10 blur-3xl" />
          <div className="rotate-[1.5deg] rounded-[2rem] border border-stone-200 bg-surface p-5 shadow-[0_30px_80px_rgba(44,52,40,.18)] sm:p-7">
            <div className="mb-6 flex items-center justify-between"><div><p className="text-sm font-semibold text-stone-500">Client book</p><p className="mt-1 text-2xl font-medium">Recently updated</p></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">Sample</span></div>
            {samples.map(([initials, name, herd, county]) => <div key={herd} className="flex items-center gap-4 border-t border-stone-100 py-4"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-stone-100 text-sm font-medium text-emerald-900">{initials}</span><div className="min-w-0 flex-1"><p className="font-medium">{name}</p><p className="text-sm text-stone-500">{herd} · {county}</p></div><ArrowIcon className="text-stone-400" /></div>)}
          </div>
        </section>
      </main>
      <section aria-label="Core features" className="mx-auto grid max-w-6xl gap-8 border-t border-stone-300 px-5 py-12 sm:grid-cols-3 sm:px-8">{[["01", "Client book", "Add, search, update and archive client records."], ["02", "Scheme work", "Plan work, record progress and keep each job with the right client."], ["03", "Rates and invoices", "Apply your rate card to completed work and issue invoices under your business name."]].map(([number, title, body]) => <div key={number}><p className="eyebrow">{number}</p><h2 className="pt-4 text-xl font-medium">{title}</h2><p className="pt-3 text-sm leading-7 text-stone-600">{body}</p></div>)}</section>
      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-stone-600 sm:px-8"><p>Acren practice management</p><Link href="/privacy" className="button-quiet">Privacy information</Link></footer>
    </div>
  );
}
