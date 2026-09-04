import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return <><p className="eyebrow">Get started</p><h1 className="mt-3 text-4xl font-medium tracking-tight">Create your account</h1><p className="mb-8 mt-3 text-stone-600">Set up a private client book for your practice.</p><AuthForm mode="signup" /></>;
}
