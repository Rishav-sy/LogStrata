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
      <section className="relative overflow-hidden border-b border-hairline px-6 py-24 sm:py-32">
        <AnimatedBackdrop />
        <div className="relative mx-auto grid max-w-[1400px] gap-14 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-hairline bg-canvas-soft/80 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-body backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> Dynamic autoscaling + defense
            </div>
            <h1 className="text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-ink sm:text-6xl">
              Kubernetes control from the signals your app already emits.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-body">
              LogStrata interprets container logs in real time, adapts replica bounds, and coordinates ingress defense before workloads saturate.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard" className="stark-btn-primary h-12 gap-2 px-6">Open live playground <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/docs/getting-started" className="stark-btn-secondary h-12 px-6">Read technical docs</Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-3 border-t border-hairline pt-6">
              {[["< 50ms", "decision loop"], ["5", "provider types"], ["Public", "simulation lab"]].map(([value, label]) => (
                <div key={label}><p className="font-mono text-sm font-bold">{value}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-mute">{label}</p></div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-7"><AnimatedControlLoop compact /></div>
        </div>
      </section>

      <section id="features" className="border-b border-hairline bg-canvas-soft px-6 py-24">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeading eyebrow="02 / Product system" title="React before infrastructure metrics catch up." text="One operational layer correlates performance, security, and scaling signals." />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text, meta }) => (
              <article key={title} className="group rounded-2xl border border-hairline bg-canvas p-6 transition hover:-translate-y-1 hover:border-hairline-strong hover:shadow-xl">
                <div className="flex items-center justify-between"><Icon className="h-5 w-5 text-link" /><span className="font-mono text-[9px] uppercase tracking-widest text-mute">{meta}</span></div>
                <h3 className="mt-8 text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-body">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="architecture" className="border-b border-hairline px-6 py-24">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeading eyebrow="03 / Architecture" title="A bounded, observable control loop." text="Log ingestion feeds independent performance and security analysis before policy actions reach Kubernetes." />
          <AnimatedControlLoop />
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[[Blocks, "Ingest", "Normalize CRI and JSON streams"], [Activity, "Analyze", "Compute rates, percentiles, anomalies"], [CloudCog, "Decide", "Apply bounded policy logic"], [Cpu, "Act", "Patch replicas and ingress"]].map(([Icon, title, text]) => {
              const StageIcon = Icon as typeof Blocks;
              return <div key={title as string} className="rounded-xl border border-hairline bg-canvas-soft p-5"><StageIcon className="h-4 w-4 text-link" /><h3 className="mt-4 text-sm font-semibold">{title as string}</h3><p className="mt-2 text-xs leading-5 text-body">{text as string}</p></div>;
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-hairline bg-canvas-soft px-6 py-24">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeading eyebrow="04 / Operational scenarios" title="Model the incidents that break ordinary autoscalers." text="The public simulator remains available without an account." />
          <div className="grid gap-5 lg:grid-cols-3">
            {scenarios.map(({ title, status, icon: Icon, tone, text }) => (
              <article key={title} className="rounded-2xl border border-hairline bg-canvas p-6">
                <div className="flex items-center justify-between"><Icon className={`h-5 w-5 ${tone}`} /><span className="rounded-full border border-hairline px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-mute">{status}</span></div>
                <h3 className="mt-8 text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-body">{text}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 flex justify-center"><Link href="/dashboard" className="stark-btn-primary h-11 gap-2 px-5">Run scenarios <Waypoints className="h-4 w-4" /></Link></div>
        </div>
      </section>

      <section className="border-b border-hairline px-6 py-24"><CreativePricing tiers={tiers} /></section>
      <FaqSectionWithCategories className="border-b border-hairline bg-canvas-soft" title="Technical questions" description="How the v1 product and its public simulator work." items={faq} />

      <section className="px-6 py-24">
        <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-3xl border border-hairline bg-[#080b11] p-10 text-white md:p-16">
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div><p className="font-mono text-[10px] uppercase tracking-widest text-blue-400">Workspace ready</p><h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight">Build a repeatable incident-response playground.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">Save simulations, manage cluster foundation records, and prepare integrations without locking the public demo behind authentication.</p></div>
            <Link href="/signup" className="inline-flex h-11 min-w-fit items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-black">Create workspace <BadgeCheck className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <div className="mb-14 max-w-2xl"><p className="font-mono text-[10px] font-bold uppercase tracking-widest text-link">{eyebrow}</p><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2><p className="mt-4 text-sm leading-7 text-body">{text}</p></div>;
}
