"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup, type AuthActionState } from "@/app/auth/actions";

const initialState: AuthActionState = {};

export function AuthForm({
  mode,
  returnTo,
}: {
  mode: "login" | "signup";
  returnTo: string;
}) {
  const [state, action, pending] = useActionState(mode === "login" ? login : signup, initialState);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="returnTo" value={returnTo} />
      {mode === "signup" && (
        <Field label="Display name" name="displayName" error={state.errors?.displayName?.[0]} />
      )}
      <Field label="Email" name="email" type="email" error={state.errors?.email?.[0]} />
      <Field label="Password" name="password" type="password" error={state.errors?.password?.[0]} />
      {state.message && <p className="text-sm text-body" aria-live="polite">{state.message}</p>}
      <button className="stark-btn-primary h-11 w-full" disabled={pending}>
        {pending ? "Working..." : mode === "login" ? "Log in" : "Create account"}
      </button>
      {mode === "login" && (
        <Link href="/forgot-password" className="block text-center text-sm text-link hover:underline">
          Forgot password?
        </Link>
      )}
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  error,
}: {
  label: string;
  name: string;
  type?: string;
  error?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input className="stark-input h-11 w-full" name={name} type={type} required />
      {error && <span className="block text-xs text-error">{error}</span>}
    </label>
  );
}
