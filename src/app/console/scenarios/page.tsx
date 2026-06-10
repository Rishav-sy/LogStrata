import Link from "next/link";
import { createScenario, deleteScenario, duplicateScenario, updateScenario } from "@/app/console/actions";
import { PageHeader } from "@/components/console/PageHeader";
import { requireUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

const defaultConfiguration = JSON.stringify({
  version: 1, trafficMode: "normal", requestRate: 100,
  failures: { database: false, api: false, auth: false, timeout: false, serviceCrash: false },
  resources: { cpu: 25, memory: 32, disk: 15, network: 12 },
  autoScalingEnabled: true, activeAnomaly: "none",
});

export default async function ScenariosPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser("/console/scenarios");
  const query = (await searchParams).q?.trim() ?? "";
  const supabase = await createClient();
  let scenariosQuery = supabase.from("saved_scenarios").select("*").eq("user_id", user.id);
  if (query) scenariosQuery = scenariosQuery.ilike("name", `%${query.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`);
  const { data } = await scenariosQuery.order("updated_at", { ascending: false });
  return (
    <>
      <PageHeader eyebrow="Simulator" title="Saved scenarios" description="Save repeatable playground configurations and reopen them in the public simulator." action={<Link href="/dashboard" className="stark-btn-primary h-10 px-4">Open playground</Link>} />
      <form action={createScenario} className="stark-card mb-6 grid gap-3 md:grid-cols-[1fr_2fr_auto]">
        <input className="stark-input" name="name" placeholder="Scenario name" required />
        <input className="stark-input" name="description" placeholder="Description" />
        <input type="hidden" name="configuration" value={defaultConfiguration} />
        <button className="stark-btn-primary px-4">Create baseline</button>
      </form>
      <form className="mb-6 flex gap-2">
        <input className="stark-input h-10 flex-1" name="q" defaultValue={query} placeholder="Search saved scenarios" />
        <button className="stark-btn-secondary h-10 px-4">Search</button>
      </form>
      <div className="space-y-3">
        {data?.length ? data.map((scenario) => (
          <article key={scenario.id} className="stark-card space-y-4">
            <form action={updateScenario} className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
              <input type="hidden" name="id" value={scenario.id} />
              <input className="stark-input" name="name" defaultValue={scenario.name} required />
              <input className="stark-input" name="description" defaultValue={scenario.description ?? ""} placeholder="Description" />
              <button className="stark-btn-secondary px-4">Save details</button>
            </form>
            <div className="flex gap-2">
              <Link className="stark-btn-secondary h-9 px-3 text-xs" href={`/dashboard?scenario=${scenario.id}`}>Open</Link>
              <form action={duplicateScenario}><input type="hidden" name="id" value={scenario.id} /><button className="stark-btn-secondary h-9 px-3 text-xs">Duplicate</button></form>
              <form action={deleteScenario}><input type="hidden" name="id" value={scenario.id} /><button className="h-9 px-3 text-xs text-error">Delete</button></form>
            </div>
          </article>
        )) : <p className="stark-card text-sm text-body">No saved scenarios yet.</p>}
      </div>
    </>
  );
}
