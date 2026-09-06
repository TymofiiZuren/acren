import type { Metadata } from "next";
import { PrivateLink as Link } from "@/components/private-link";
import { ClientForm } from "@/components/client-form";

export const metadata: Metadata = { title: "Add client" };

export default function NewClientPage() {
  return <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 lg:py-10"><Link href="/clients" className="text-sm font-medium text-emerald-800 hover:underline">← Back to clients</Link><h1 className="mt-5 text-3xl font-medium tracking-tight sm:text-4xl">Add a client</h1><p className="mb-8 mt-2 text-stone-600">Add the details you use to manage their scheme work.</p><ClientForm /></div>;
}
