import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { sanitizeReturnPath } from "@/lib/auth/redirects";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; error?: string }>;
}) {
  const params = await searchParams;
  const returnTo = sanitizeReturnPath(params.returnTo);

  return (
    <AuthShell title="Welcome back" description="Log in to manage clusters and saved playground scenarios.">
      {params.error && <p className="mb-4 text-sm text-error">{params.error}</p>}
      <GoogleAuthButton returnTo={returnTo} />
      <div className="my-5 text-center text-xs uppercase tracking-wider text-mute">or</div>
      <AuthForm mode="login" returnTo={returnTo} />
      <p className="mt-6 text-center text-sm text-body">
        No account? <Link className="text-link hover:underline" href={`/signup?returnTo=${encodeURIComponent(returnTo)}`}>Sign up</Link>
      </p>
    </AuthShell>
  );
}
