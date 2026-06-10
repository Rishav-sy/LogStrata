import Link from "next/link";
import { createCluster } from "@/app/console/actions";
import { PageHeader } from "@/components/console/PageHeader";
import { requireUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { clusterEnvironments, clusterProviders } from "@/lib/validation/cluster";

export default async function ClustersPage() {
  const user = await requireUser("/console/clusters");
  const supabase = await createClient();
  const { data } = await supabase.from("clusters").select("*").eq("user_id", user.id).order("updated_at", { ascending: false });
  return (
    <>
      <PageHeader eyebrow="Foundation module" title="Clusters" description="Track onboarding and non-secret connection metadata. Live provider connections are intentionally deferred." />
      <form action={createCluster} className="stark-card mb-6 grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
        <input className="stark-input" name="name" placeholder="Cluster name" required />
        <select className="stark-input" name="provider">{clusterProviders.map((v) => <option key={v}>{v}</option>)}</select>
        <select className="stark-input" name="environment">{clusterEnvironments.map((v) => <option key={v}>{v}</option>)}</select>
        <button className="stark-btn-primary px-4">Start onboarding</button>
      </form>
      <div className="grid gap-4 md:grid-cols-2">
        {data?.length ? data.map((cluster) => (
          <Link key={cluster.id} href={`/console/clusters/${cluster.id}`} className="stark-card">
            <div className="flex justify-between gap-3"><h2 className="font-semibold">{cluster.name}</h2><span className="rounded-full border border-hairline px-2 py-1 text-[10px] uppercase">{cluster.status}</span></div>
            <p className="mt-3 text-sm text-body">{cluster.provider.toUpperCase()} · {cluster.environment} · onboarding step {cluster.onboarding_step}/4</p>
          </Link>
        )) : <p className="stark-card text-sm text-body">No cluster records yet.</p>}
      </div>
    </>
  );
}
