import Link from "next/link";
import { ThemeSwitch } from "@/components/theme-switch";
import { AcrenMark } from "@/components/icons";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" className="grid min-h-screen bg-stone-100 lg:grid-cols-[.85fr_1.15fr]">
      <section className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-12 inline-flex min-h-11 items-center gap-2 text-xl font-medium tracking-tight"><span className="grid size-9 place-items-center rounded-md bg-accent text-white"><AcrenMark /></span>Acren</Link>
          <ThemeSwitch />
          {children}
        </div>
      </section>
      <section className="relative hidden overflow-hidden bg-surface p-16 text-stone-950 lg:flex lg:flex-col lg:justify-end">
        <div className="absolute -right-24 -top-24 size-[30rem] rounded-full border border-stone-200" />
        <div className="absolute -right-8 -top-8 size-[18rem] rounded-full border border-stone-200" />
        <blockquote className="relative max-w-xl text-3xl font-semibold leading-snug tracking-tight">“The client book should be the easiest part of running the practice.”</blockquote>
        <p className="relative mt-5 text-sm font-semibold uppercase tracking-[.18em] text-stone-600">Built for Irish agricultural consultants</p>
      </section>
    </main>
  );
}
