import { notFound } from "next/navigation";
import { deleteCluster, updateCluster } from "@/app/console/actions";
import { PageHeader } from "@/components/console/PageHeader";
import { requireUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { clusterEnvironments, clusterProviders, clusterStatuses } from "@/lib/validation/cluster";

export default async function ClusterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/console/clusters/${id}`);
  const supabase = await createClient();
  const { data } = await supabase.from("clusters").select("*").eq("id", id).eq("user_id", user.id).single();
  if (!data) notFound();
  return (
    <>
      <PageHeader eyebrow="Cluster onboarding" title={data.name} description="Store identifiers and track readiness without persisting credentials or contacting the provider." />
      <form action={updateCluster} className="stark-card space-y-5">
        <input type="hidden" name="id" value={data.id} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name"><input className="stark-input w-full" name="name" defaultValue={data.name} /></Field>
          <Field label="Provider"><select className="stark-input w-full" name="provider" defaultValue={data.provider}>{clusterProviders.map((v) => <option key={v}>{v}</option>)}</select></Field>
          <Field label="Environment"><select className="stark-input w-full" name="environment" defaultValue={data.environment}>{clusterEnvironments.map((v) => <option key={v}>{v}</option>)}</select></Field>
          <Field label="Status"><select className="stark-input w-full" name="status" defaultValue={data.status}>{clusterStatuses.map((v) => <option key={v}>{v}</option>)}</select></Field>
          <Field label="Onboarding step"><input className="stark-input w-full" name="onboardingStep" type="number" min="1" max="4" defaultValue={data.onboarding_step} /></Field>
        </div>
        <Field label="Connection metadata (non-secret JSON)"><textarea className="stark-input min-h-40 w-full font-mono text-xs" name="connectionMetadata" defaultValue={JSON.stringify(data.connection_metadata, null, 2)} /></Field>
        <button className="stark-btn-primary h-10 px-4">Save cluster</button>
      </form>
      <form action={deleteCluster} className="mt-6"><input type="hidden" name="id" value={data.id} /><button className="text-sm text-error">Delete cluster record</button></form>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="text-sm font-medium">{label}</span>{children}</label>;
}
