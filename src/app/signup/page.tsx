import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { sanitizeReturnPath } from "@/lib/auth/redirects";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const returnTo = sanitizeReturnPath((await searchParams).returnTo);

  return (
    <AuthShell title="Create your workspace" description="Start saving scenarios and preparing cluster connections.">
      <GoogleAuthButton returnTo={returnTo} />
      <div className="my-5 text-center text-xs uppercase tracking-wider text-mute">or</div>
      <AuthForm mode="signup" returnTo={returnTo} />
      <p className="mt-6 text-center text-sm text-body">
        Already registered? <Link className="text-link hover:underline" href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>Log in</Link>
      </p>
    </AuthShell>
  );
}
