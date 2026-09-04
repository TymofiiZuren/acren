import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message: code } = await searchParams;
  const message = code === "confirm" ? "If confirmation is needed, check your email before signing in." : undefined;
  return <><p className="eyebrow">Welcome back</p><h1 className="mt-3 text-4xl font-medium tracking-tight">Sign in to Acren</h1><p className="mb-8 mt-3 text-stone-600">Your client book is ready when you are.</p>{message && <div className="alert-success mb-5">{message}</div>}<AuthForm mode="login" /></>;
}
