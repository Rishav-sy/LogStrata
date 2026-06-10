import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sanitizeReturnPath } from "./redirects";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser(returnTo = "/console") {
  const user = await getUser();

  if (!user) {
    redirect(`/login?returnTo=${encodeURIComponent(sanitizeReturnPath(returnTo))}`);
  }

  return user;
}
