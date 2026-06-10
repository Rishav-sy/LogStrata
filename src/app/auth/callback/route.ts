import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeReturnPath } from "@/lib/auth/redirects";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const returnTo = sanitizeReturnPath(request.nextUrl.searchParams.get("returnTo"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(returnTo, request.url));
  }

  return NextResponse.redirect(
    new URL("/login?error=Authentication%20could%20not%20be%20completed.", request.url),
  );
}
