import Link from "next/link";
import {
  Activity, ArrowRight, BadgeCheck, Blocks, ChartNoAxesCombined, CloudCog,
  Cpu, DatabaseZap, Gauge, GitBranch, LockKeyhole, ShieldCheck,
  Sparkles, TerminalSquare, Waypoints, Zap,
} from "lucide-react";
import { AnimatedBackdrop } from "@/components/landing/AnimatedBackdrop";
import { AnimatedControlLoop } from "@/components/landing/AnimatedControlLoop";
import { CreativePricing } from "@/components/ui/creative-pricing";
import { FaqSectionWithCategories } from "@/components/blocks/faq-with-categories";

const features = [
  { icon: TerminalSquare, title: "Log-first telemetry", text: "Evaluate structured container stdout directly instead of waiting for lagging CPU polls.", meta: "< 50ms" },
  { icon: ChartNoAxesCombined, title: "Pre-emptive scaling", text: "Turn request-rate, latency, and error patterns into bounded scaling decisions.", meta: "RPS + P99" },
  { icon: ShieldCheck, title: "Threat-aware capacity", text: "Keep malicious traffic from driving blind scale-up and exhausting downstream services.", meta: "Mini-SIEM" },
  { icon: GitBranch, title: "Declarative policies", text: "Describe scaling and defense behavior as reviewable, versioned Kubernetes resources.", meta: "GitOps" },
  { icon: LockKeyhole, title: "Scale-down locks", text: "Hold minimum capacity during active incidents while mitigation rules propagate.", meta: "Fail-safe" },
  { icon: DatabaseZap, title: "Private by design", text: "Parse logs inside cluster boundaries and persist only aggregate operational signals.", meta: "On-cluster" },
];

const scenarios = [
  { title: "Flash-sale surge", status: "Scale 3 → 12", icon: Gauge, tone: "text-blue-500", text: "Detect checkout RPS acceleration before CPU saturation." },
  { title: "Credential stuffing", status: "Block + lock", icon: ShieldCheck, tone: "text-rose-500", text: "Isolate abusive clients while preserving known-good capacity." },
  { title: "Database degradation", status: "Fail-safe", icon: DatabaseZap, tone: "text-amber-500", text: "Correlate query latency logs with service-level scaling limits." },
];

const tiers = [
  { name: "Developer", icon: <TerminalSquare className="h-5 w-5" />, price: "Free", description: "Local evaluation and demos", features: ["Public playground", "3 namespaces", "Community support"], color: "zinc" },
  { name: "Standard", icon: <Zap className="h-5 w-5 text-blue-500" />, price: 49, description: "Production-ready foundations", features: ["15 namespaces", "Saved scenarios", "Cluster workspace", "Ingress policies"], popular: true, color: "blue" },
  { name: "Enterprise", icon: <Sparkles className="h-5 w-5 text-amber-500" />, price: "Custom", description: "Multi-cluster operations", features: ["Unlimited clusters", "Custom parsers", "Priority support"], color: "amber" },
];

const faq = [
  { category: "Architecture", question: "How is this different from Kubernetes HPA?", answer: "HPA typically reacts to resource utilization. LogStrata evaluates application-level log signals that can reveal load and threats before resource metrics cross their thresholds." },
  { category: "Security", question: "Are raw logs uploaded?", answer: "The intended deployment model parses logs inside the cluster boundary and persists only the operational aggregates needed by the controller." },
  { category: "Compatibility", question: "Which clusters are supported?", answer: "The v1 workspace stores foundation records for Kubernetes, EKS, GKE, AKS, and local clusters. Actual provider connectivity is intentionally deferred." },
  { category: "Playground", question: "Do I need an account to try it?", answer: "No. The simulator is public. Authentication is required only when saving scenarios or managing workspace records." },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-hairline bg-[linear-gradient(to_bottom,var(--color-canvas),var(--color-canvas-soft))] px-5 py-24 sm:px-6 sm:py-32 lg:py-36">
        <AnimatedBackdrop />
        <div className="relative mx-auto grid max-w-[1280px] gap-16 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <div className="mb-7 inline-flex items-center gap-2 border-l border-link pl-3 font-mono text-[9px] uppercase tracking-[0.18em] text-mute">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> Dynamic autoscaling + defense
            </div>
            <h1 className="max-w-2xl text-5xl font-semibold leading-[0.98] tracking-[-0.06em] text-ink sm:text-6xl lg:text-[68px]">
              Kubernetes control from the signals your app already emits.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-body sm:text-[17px]">
              LogStrata interprets container logs in real time, adapts replica bounds, and coordinates ingress defense before workloads saturate.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard" className="stark-btn-primary h-10 gap-2 rounded-[5px] px-4 text-xs">Open live playground <ArrowRight className="h-3.5 w-3.5" /></Link>
              <Link href="/docs/getting-started" className="inline-flex h-10 items-center justify-center px-3 text-xs font-medium text-body transition hover:text-ink">Read technical docs <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-px border-y border-hairline bg-hairline">
              {[["< 50ms", "decision loop"], ["5", "provider types"], ["Public", "simulation lab"]].map(([value, label]) => (
                <div key={label} className="bg-canvas py-4 pr-3"><p className="font-mono text-xs font-semibold text-ink">{value}</p><p className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-mute">{label}</p></div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-7"><AnimatedControlLoop compact /></div>
        </div>
      </section>

      <section id="features" className="border-b border-hairline bg-canvas px-5 py-24 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-[1280px]">
          <SectionHeading eyebrow="02 / Product system" title="React before infrastructure metrics catch up." text="One operational layer correlates performance, security, and scaling signals." />
          <div className="grid gap-px overflow-hidden rounded-[10px] border border-hairline bg-hairline md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text, meta }) => (
              <article key={title} className="group bg-canvas p-6 transition-colors hover:bg-canvas-soft sm:p-7">
                <div className="flex items-center justify-between"><Icon className="h-4 w-4 text-link" /><span className="font-mono text-[8px] uppercase tracking-[0.14em] text-mute">{meta}</span></div>
                <h3 className="mt-10 text-[15px] font-semibold tracking-[-0.02em]">{title}</h3><p className="mt-3 text-xs leading-6 text-body">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="architecture" className="border-b border-hairline bg-canvas-soft px-5 py-24 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-[1280px]">
          <SectionHeading eyebrow="03 / Architecture" title="A bounded, observable control loop." text="Log ingestion feeds independent performance and security analysis before policy actions reach Kubernetes." />
          <AnimatedControlLoop />
          <div className="mt-5 grid gap-px overflow-hidden rounded-[8px] border border-hairline bg-hairline md:grid-cols-4">
            {[[Blocks, "Ingest", "Normalize CRI and JSON streams"], [Activity, "Analyze", "Compute rates, percentiles, anomalies"], [CloudCog, "Decide", "Apply bounded policy logic"], [Cpu, "Act", "Patch replicas and ingress"]].map(([Icon, title, text]) => {
              const StageIcon = Icon as typeof Blocks;
              return <div key={title as string} className="bg-canvas p-5"><StageIcon className="h-3.5 w-3.5 text-link" /><h3 className="mt-5 text-xs font-semibold">{title as string}</h3><p className="mt-2 text-[11px] leading-5 text-body">{text as string}</p></div>;
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-hairline bg-canvas px-5 py-24 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-[1280px]">
          <SectionHeading eyebrow="04 / Operational scenarios" title="Model the incidents that break ordinary autoscalers." text="The public simulator remains available without an account." />
          <div className="grid gap-px overflow-hidden rounded-[10px] border border-hairline bg-hairline lg:grid-cols-3">
            {scenarios.map(({ title, status, icon: Icon, tone, text }) => (
              <article key={title} className="bg-canvas p-7 transition-colors hover:bg-canvas-soft">
                <div className="flex items-center justify-between"><Icon className={`h-4 w-4 ${tone}`} /><span className="border-l border-hairline pl-2 font-mono text-[8px] uppercase tracking-[0.12em] text-mute">{status}</span></div>
                <h3 className="mt-12 text-lg font-semibold tracking-[-0.02em]">{title}</h3><p className="mt-3 text-xs leading-6 text-body">{text}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 flex justify-end"><Link href="/dashboard" className="inline-flex h-10 items-center gap-2 text-xs font-medium text-body transition hover:text-ink">Run scenarios <Waypoints className="h-3.5 w-3.5" /></Link></div>
        </div>
      </section>

      <section className="border-b border-hairline bg-canvas-soft px-5 py-24 sm:px-6 lg:py-28"><CreativePricing tiers={tiers} /></section>
      <FaqSectionWithCategories className="border-b border-hairline bg-canvas-soft" title="Technical questions" description="How the v1 product and its public simulator work." items={faq} />

      <section className="px-5 py-24 sm:px-6 lg:py-28">
        <div className="relative mx-auto max-w-[1280px] overflow-hidden rounded-[10px] border border-hairline bg-[#0b0d10] p-8 text-white md:p-12">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/70 to-transparent" />
          <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-blue-400">Workspace ready</p><h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Build a repeatable incident-response playground.</h2><p className="mt-4 max-w-xl text-xs leading-6 text-zinc-400">Save simulations, manage cluster foundation records, and prepare integrations without locking the public demo behind authentication.</p></div>
            <Link href="/signup" className="inline-flex h-10 min-w-fit items-center justify-center gap-2 rounded-[5px] bg-white px-4 text-xs font-semibold text-black transition hover:bg-zinc-200">Create workspace <BadgeCheck className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <div className="mb-12 grid gap-4 border-t border-hairline pt-5 md:grid-cols-[0.32fr_0.68fr]"><p className="font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-mute">{eyebrow}</p><div><h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">{title}</h2><p className="mt-4 max-w-xl text-xs leading-6 text-body">{text}</p></div></div>;
}
