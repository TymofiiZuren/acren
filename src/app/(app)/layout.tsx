import Link from "next/link";
import { ThemeSwitch } from "@/components/theme-switch";
import { connection } from "next/server";
import { signOut } from "@/app/actions/auth";
import { LogOutIcon, AcrenMark } from "@/components/icons";
import { requireSession } from "@/lib/require-session";
import { WorkspaceNav } from "@/components/workspace-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await connection();
  await requireSession();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-950">
      <header className="border-b border-stone-200 bg-surface p-4 lg:hidden"><div className="flex items-center justify-between gap-3 pb-3"><Link href="/clients" className="flex items-center gap-2 text-lg font-medium"><span className="grid size-8 place-items-center rounded-lg bg-accent text-white"><AcrenMark className="size-4" /></span>Acren</Link><form action={signOut}><button className="button-quiet gap-2" type="submit"><LogOutIcon className="size-4" />Sign out</button></form></div><WorkspaceNav /><ThemeSwitch /></header>
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col overflow-y-auto border-r border-stone-200 bg-surface p-5 lg:flex">
        <Link href="/clients" className="flex items-center gap-2 px-2 text-xl font-medium"><span className="grid size-9 place-items-center rounded-md bg-accent text-white"><AcrenMark /></span>Acren</Link>
        <p className="px-2 pt-2 text-xs text-stone-500">Practice management</p>
        <div className="pt-10"><p className="px-3 pb-3 text-xs font-medium uppercase tracking-widest text-stone-500">Your practice</p><WorkspaceNav /></div>
        <div className="mt-auto space-y-5 pt-8"><ThemeSwitch /><div className="rounded-lg bg-stone-100 p-4"><p className="text-sm font-medium">Practice controls</p><p className="pt-2 text-xs leading-5 text-stone-600">Client records, work and private filing. Review access and retention before live use.</p><Link href="/privacy-centre" className="inline-flex min-h-11 items-center text-xs font-medium text-emerald-900 underline underline-offset-4">Your privacy checklist →</Link></div><div className="border-t border-stone-100 pt-4"><p className="px-3 text-sm font-semibold">Consultant workspace</p><form action={signOut} className="pt-2"><button className="nav-link w-full" type="submit"><LogOutIcon />Sign out</button></form></div></div>
      </aside>
      <main id="main-content" className="lg:pl-64"><div className="workspace-notice"><p><strong>Demo workspace</strong> · Fictional data only. Production privacy controls are not approved.</p><Link href="/privacy-centre" className="inline-flex min-h-6 items-center font-medium underline underline-offset-4">Review release requirements →</Link></div>{children}</main>
    </div>
  );
}
