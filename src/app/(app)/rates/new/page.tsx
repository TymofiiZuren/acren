import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { randomUUID } from "node:crypto";
import { RateForm } from "@/components/rate-form";
import { requireSession } from "@/lib/require-session";

export const metadata: Metadata = { title: "Add rate" };
export default async function NewRatePage() {
  await connection();
  await requireSession();
  return <div className="mx-auto max-w-3xl space-y-6 px-5 py-8 sm:px-8"><Link href="/rates" className="text-sm text-emerald-800 hover:underline">← Back to rate card</Link><div className="space-y-2"><h1 className="text-3xl font-medium tracking-tight">Add a rate</h1><p className="text-stone-600">Set a consistent price for your services.</p></div><RateForm requestId={randomUUID()} /></div>;
}
