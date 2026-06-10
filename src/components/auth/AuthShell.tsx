import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-hairline bg-canvas-soft p-8 shadow-xl">
        <Link href="/" className="mb-8 block text-sm font-bold">LogStrata</Link>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 mb-8 text-sm leading-6 text-body">{description}</p>
        {!isSupabaseConfigured() ? (
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm text-body">
            Supabase is not configured. Add the variables from <code>.env.example</code>.
          </div>
        ) : children}
      </div>
    </section>
  );
}
