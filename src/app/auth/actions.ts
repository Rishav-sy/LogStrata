"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sanitizeReturnPath } from "@/lib/auth/redirects";
import { requireUser } from "@/lib/auth/user";
import { emailSchema, loginSchema, passwordSchema, signupSchema } from "@/lib/validation/auth";

export type AuthActionState = {
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export async function login(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) return { message: error.message };
  redirect(sanitizeReturnPath(parsed.data.returnTo));
}

export async function signup(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const returnTo = sanitizeReturnPath(parsed.data.returnTo);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: `${origin}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`,
    },
  });

  if (error) return { message: error.message };
  if (!data.session) {
    return { message: "Check your email to confirm your account, then log in." };
  }
  redirect(returnTo);
}

export async function signInWithGoogle(formData: FormData) {
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const returnTo = sanitizeReturnPath(formData.get("returnTo")?.toString());
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`,
    },
  });

  if (error || !data.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "Unable to start Google sign in.")}`);
  }
  redirect(data.url);
}

export async function requestPasswordReset(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { errors: { email: parsed.error.issues.map((issue) => issue.message) } };
  }

  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${origin}/auth/callback?returnTo=/update-password`,
  });

  if (error) return { message: error.message };
  return { message: "Password reset instructions have been sent." };
}

export async function updatePassword(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  await requireUser("/update-password");
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) {
    return { errors: { password: parsed.error.issues.map((issue) => issue.message) } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { message: error.message };
  return { message: "Password updated successfully." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
