"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  Box,
  Braces,
  Check,
  Cpu,
  Database,
  FileJson,
  Gauge,
  GitBranch,
  Network,
  ScanSearch,
  ShieldCheck,
  Waypoints,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Tone = "blue" | "cyan" | "green" | "amber" | "red";

const toneStyles: Record<Tone, { icon: string; border: string; dot: string }> = {
  blue: { icon: "text-blue-400", border: "border-blue-400/25", dot: "bg-blue-400" },
  cyan: { icon: "text-cyan-400", border: "border-cyan-400/25", dot: "bg-cyan-400" },
  green: { icon: "text-emerald-400", border: "border-emerald-400/25", dot: "bg-emerald-400" },
  amber: { icon: "text-amber-400", border: "border-amber-400/25", dot: "bg-amber-400" },
  red: { icon: "text-rose-400", border: "border-rose-400/25", dot: "bg-rose-400" },
};

function FlowNode({
  icon: Icon,
  title,
  detail,
  tone = "blue",
  className = "",
  index = 0,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
  tone?: Tone;
  className?: string;
  index?: number;
}) {
  const reduceMotion = useReducedMotion();
  const styles = toneStyles[tone];

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className={`relative flex min-w-0 items-center gap-3 rounded-[6px] border bg-[#0c0f13] p-3.5 ${styles.border} ${className}`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] border bg-white/[0.025] ${styles.border}`}>
        <Icon className={`h-3.5 w-3.5 ${styles.icon}`} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[11px] font-semibold text-zinc-100">{title}</span>
        <span className={`mt-0.5 block truncate font-mono text-[8px] ${styles.icon}`}>{detail}</span>
      </span>
      <span className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${styles.dot}`} />
    </motion.div>
  );
}

function PanelHeader({ title, status }: { title: string; status: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.018] px-4 py-3 font-mono text-[8px] uppercase tracking-[0.16em] text-zinc-500 sm:px-5">
      <span>{title}</span>
      <span className="flex items-center gap-2 text-emerald-400">
        <Activity className="h-3 w-3" /> {status}
      </span>
    </div>
  );
}

function SignalLine({
  className,
  delay = 0,
  vertical = false,
}: {
  className?: string;
  delay?: number;
  vertical?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <span className={`absolute overflow-hidden bg-white/[0.1] ${vertical ? "w-px" : "h-px"} ${className ?? ""}`} aria-hidden="true">
      <motion.span
        className={`absolute bg-cyan-400 ${vertical ? "h-5 w-px" : "h-px w-5"}`}
        animate={reduceMotion ? undefined : vertical ? { y: ["-100%", "650%"] } : { x: ["-100%", "650%"] }}
        transition={{ duration: 2.2, delay, repeat: Infinity, ease: "linear" }}
      />
    </span>
  );
}

function CompactFlow() {
  return (
    <div className="relative overflow-hidden rounded-[10px] border border-white/[0.09] bg-[#090b0e] text-white shadow-[0_24px_90px_rgba(0,0,0,0.3)]">
      <PanelHeader title="Runtime decision flow" status="signals live" />
      <div className="relative mx-auto max-w-[540px] px-4 py-6 sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:32px_32px]" />

        <div className="relative mx-auto max-w-[340px]">
          <FlowNode icon={Box} title="Kubernetes workloads" detail="replicas 3 / 12" tone="blue" />
          <SignalLine vertical className="left-1/2 top-full h-4" />
        </div>
        <div className="relative mx-auto mt-4 max-w-[280px]">
          <FlowNode icon={FileJson} title="stdout event stream" detail="1.2k structured events/s" tone="cyan" index={1} />
          <SignalLine vertical className="left-1/2 top-full h-4" delay={0.25} />
        </div>
        <div className="relative mx-auto mt-4 max-w-[340px]">
          <FlowNode icon={Waypoints} title="LogStrata signal engine" detail="normalizing + correlating" tone="blue" index={2} />
          <span className="absolute left-1/2 top-full h-4 w-px bg-white/[0.1]" />
          <span className="absolute left-[25%] top-[calc(100%+16px)] h-px w-1/2 bg-white/[0.1]" />
          <span className="absolute left-[25%] top-[calc(100%+16px)] h-4 w-px bg-white/[0.1]" />
          <span className="absolute right-[25%] top-[calc(100%+16px)] h-4 w-px bg-white/[0.1]" />
        </div>
        <div className="relative mt-8 grid grid-cols-2 gap-3">
          <FlowNode icon={Gauge} title="Performance" detail="p99 82ms" tone="amber" index={3} />
          <FlowNode icon={ShieldCheck} title="Security" detail="risk nominal" tone="red" index={4} />
          <span className="absolute bottom-[-16px] left-[25%] h-4 w-px bg-white/[0.1]" />
          <span className="absolute bottom-[-16px] right-[25%] h-4 w-px bg-white/[0.1]" />
          <span className="absolute bottom-[-16px] left-[25%] h-px w-1/2 bg-white/[0.1]" />
        </div>
        <div className="relative mx-auto mt-4 max-w-[340px]">
          <SignalLine vertical className="bottom-full left-1/2 h-4" delay={0.6} />
          <FlowNode icon={GitBranch} title="Bounded policy decision" detail="target replicas = 9" tone="green" index={5} />
          <SignalLine vertical className="left-1/2 top-full h-4" delay={0.9} />
        </div>
        <div className="mx-auto mt-4 max-w-[340px]">
          <FlowNode icon={Check} title="Cluster state reconciled" detail="HPA + ingress synced" tone="green" index={6} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-px border-t border-white/[0.08] bg-white/[0.08]">
        {[["42/s", "log rate"], ["82ms", "decision"], ["3 → 9", "replicas"]].map(([value, label]) => (
          <div key={label} className="bg-[#0b0d10] px-4 py-3">
            <p className="font-mono text-[10px] text-zinc-200">{value}</p>
            <p className="mt-1 font-mono text-[7px] uppercase tracking-[0.14em] text-zinc-600">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const topologyNodes = [
  { icon: Network, title: "Ingress", detail: "1.2k req/s", tone: "cyan" as Tone },
  { icon: Box, title: "API service", detail: "6 replicas", tone: "blue" as Tone },
  { icon: Database, title: "PostgreSQL", detail: "primary healthy", tone: "green" as Tone },
  { icon: FileJson, title: "Container logs", detail: "CRI + JSON", tone: "cyan" as Tone },
  { icon: Braces, title: "Pattern extract", detail: "rules + JIT", tone: "amber" as Tone },
  { icon: Gauge, title: "Latency detect", detail: "p95 + p99", tone: "amber" as Tone },
  { icon: ScanSearch, title: "Threat detect", detail: "WAF signals", tone: "red" as Tone },
  { icon: GitBranch, title: "Decision engine", detail: "bounded policy", tone: "blue" as Tone },
  { icon: Cpu, title: "Kube API patch", detail: "replicas 3 → 9", tone: "green" as Tone },
];

function DetailedTopology() {
  const reduceMotion = useReducedMotion();
  const paths = [
    "M105 95 C170 95 160 205 270 205",
    "M105 205 C175 205 175 205 270 205",
    "M105 315 C180 315 175 205 270 205",
    "M370 205 C430 205 420 95 510 95",
    "M370 205 C430 205 430 205 510 205",
    "M370 205 C430 205 420 315 510 315",
    "M610 95 C680 95 670 205 765 205",
    "M610 205 C675 205 680 205 765 205",
    "M610 315 C680 315 680 205 765 205",
    "M815 250 C815 325 815 345 815 405",
    "M765 450 C650 450 625 450 510 450",
    "M460 450 C300 450 225 410 105 345",
  ];

  return (
    <div className="overflow-hidden rounded-[10px] border border-white/[0.09] bg-[#090b0e] text-white shadow-[0_24px_90px_rgba(0,0,0,0.25)]">
      <PanelHeader title="System topology / closed-loop control" status="healthy" />
      <div className="custom-scrollbar overflow-x-auto">
        <div className="relative mx-auto min-h-[570px] min-w-[920px] px-8 py-7">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.022)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.022)_1px,transparent_1px)] bg-[size:32px_32px]" />
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 920 570" fill="none" aria-hidden="true">
            {paths.map((path, index) => (
              <g key={path}>
                <path d={path} stroke="rgba(96,165,250,0.18)" strokeWidth="1" />
                {!reduceMotion && (
                  <motion.path
                    d={path}
                    stroke={index > 8 ? "rgba(52,211,153,0.75)" : "rgba(34,211,238,0.7)"}
                    strokeWidth="1.2"
                    strokeDasharray="5 18"
                    initial={{ strokeDashoffset: 46 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "linear", delay: index * 0.08 }}
                  />
                )}
              </g>
            ))}
          </svg>

          <div className="relative grid grid-cols-3 gap-x-20">
            {["Workload surface", "Signal analysis", "Control output"].map((label) => (
              <p key={label} className="border-t border-dashed border-white/[0.1] pt-2 font-mono text-[7px] uppercase tracking-[0.16em] text-zinc-600">{label}</p>
            ))}
          </div>
          <div className="relative mt-5 grid grid-cols-3 gap-x-20">
            {[0, 3, 7].map((start, column) => (
              <div key={start} className="space-y-5">
                {topologyNodes.slice(start, column === 0 ? 3 : column === 1 ? 7 : 9).map((node, index) => (
                  <FlowNode key={node.title} {...node} index={start + index} />
                ))}
              </div>
            ))}
          </div>

          <div className="relative mt-7 grid grid-cols-4 gap-px overflow-hidden rounded-[6px] border border-white/[0.08] bg-white/[0.08]">
            {[
              ["18.2k", "events ingested"],
              ["0.84s", "autoscale sync"],
              ["38.6 GB/s", "parse ceiling"],
              ["0", "active threats"],
            ].map(([value, label], index) => (
              <div key={label} className="bg-[#0b0d10] px-4 py-3">
                <p className="font-mono text-sm font-semibold text-zinc-100">{value}</p>
                <p className="mt-1 font-mono text-[7px] uppercase tracking-[0.14em] text-zinc-600">{label}</p>
                <svg className="mt-3 h-4 w-full" viewBox="0 0 100 16" preserveAspectRatio="none" aria-hidden="true">
                  <motion.path
                    d={index === 3 ? "M0 12 L25 12 L50 11 L75 12 L100 11" : "M0 13 L12 5 L25 12 L38 7 L50 14 L63 4 L75 11 L88 6 L100 10"}
                    fill="none"
                    stroke={index === 3 ? "#34d399" : "#22d3ee"}
                    strokeWidth="1"
                    initial={reduceMotion ? false : { pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: index * 0.1 }}
                  />
                </svg>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AnimatedControlLoop({ compact = false }: { compact?: boolean }) {
  return compact ? <CompactFlow /> : <DetailedTopology />;
}
