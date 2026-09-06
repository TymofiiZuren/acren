"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";

const initialState: AuthState = {};

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [state, action] = useActionState(mode === "login" ? signIn : signUp, initialState);
  const login = mode === "login";

  return (
    <form action={action} className="space-y-5">
      {state.error && <div className="alert-error" role="alert">{state.error}</div>}
      <div>
        <label className="field-label" htmlFor="email">Email address</label>
        <input className="field-input" id="email" name="email" type="email" autoComplete="email" required placeholder="you@consultancy.ie" />
      </div>
      <div>
        <label className="field-label" htmlFor="password">Password</label>
        <input className="field-input" id="password" name="password" type="password" autoComplete={login ? "current-password" : "new-password"} minLength={8} required />
        {!login && <p className="field-help">At least 8 characters.</p>}
      </div>
      <SubmitButton pendingLabel={login ? "Signing in…" : "Creating account…"} className="button-primary w-full">
        {login ? "Sign in" : "Create account"}
      </SubmitButton>
      <p className="text-center text-sm text-stone-600">
        {login ? "New to Acren?" : "Already have an account?"}{" "}
        <Link prefetch={false} className="inline-flex min-h-11 items-center px-1 font-semibold text-emerald-800 underline-offset-4 hover:underline" href={login ? "/signup" : "/login"}>
          {login ? "Create an account" : "Sign in"}
        </Link>
      </p>
      <p className="text-center text-xs leading-5 text-stone-500">Demo only. Use fictional client data.<br /><Link prefetch={false} href="/privacy" className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">Privacy information</Link></p>
    </form>
  );
}
