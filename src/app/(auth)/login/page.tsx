import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return <><p className="eyebrow">Consultant access</p><h1 className="mt-3 text-4xl font-medium tracking-tight">Sign in to Acren</h1><p className="mb-8 mt-3 text-stone-600">Use your consultant account details.</p><div id="confirm" className="alert-success mb-5 hidden target:block">If confirmation is needed, check your email before signing in.</div><AuthForm mode="login" /></>;
}
