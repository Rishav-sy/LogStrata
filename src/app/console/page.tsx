import Link from "next/link";
import { PageHeader } from "@/components/console/PageHeader";
import { requireUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

export default async function ConsolePage() {
  const user = await requireUser("/console");
  const supabase = await createClient();
  const [profile, scenarios, clusters] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).single(),
    supabase.from("saved_scenarios").select("id", { count: "exact", head: true }),
    supabase.from("clusters").select("id,status"),
  ]);
  const ready = clusters.data?.filter((cluster) => cluster.status === "ready").length ?? 0;

  return (
    <>
      <PageHeader eyebrow="Console" title={`Welcome, ${profile.data?.display_name || user.email}`} description="Manage saved simulations and prepare cluster connection records." />
      <div className="grid gap-4 md:grid-cols-3">
        <Summary label="Saved scenarios" value={scenarios.count ?? 0} href="/console/scenarios" />
        <Summary label="Cluster records" value={clusters.data?.length ?? 0} href="/console/clusters" />
        <Summary label="Ready clusters" value={ready} href="/console/clusters" />
      </div>
    </>
  );
}

function Summary({ label, value, href }: { label: string; value: number; href: string }) {
  return <Link href={href} className="stark-card"><p className="text-sm text-body">{label}</p><p className="mt-4 text-4xl font-semibold tabular-nums">{value}</p></Link>;
}
