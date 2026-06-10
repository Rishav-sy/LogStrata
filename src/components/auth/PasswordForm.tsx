"use client";

import { useActionState } from "react";
import {
  requestPasswordReset,
  updatePassword,
  type AuthActionState,
} from "@/app/auth/actions";

const initialState: AuthActionState = {};

export function PasswordForm({ mode }: { mode: "request" | "update" }) {
  const [state, action, pending] = useActionState(
    mode === "request" ? requestPasswordReset : updatePassword,
    initialState,
  );
  const field = mode === "request" ? "email" : "password";

  return (
    <form action={action} className="space-y-5">
      <label className="block space-y-2">
        <span className="text-sm font-medium">{mode === "request" ? "Email" : "New password"}</span>
        <input
          className="stark-input h-11 w-full"
          name={field}
          type={field}
          required
        />
        {state.errors?.[field]?.[0] && (
          <span className="block text-xs text-error">{state.errors[field]?.[0]}</span>
        )}
      </label>
      {state.message && <p className="text-sm text-body" aria-live="polite">{state.message}</p>}
      <button className="stark-btn-primary h-11 w-full" disabled={pending}>
        {pending ? "Working..." : mode === "request" ? "Send reset instructions" : "Update password"}
      </button>
    </form>
  );
}
