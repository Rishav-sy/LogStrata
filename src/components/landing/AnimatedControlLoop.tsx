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
  Globe,
  Network,
  ScanSearch,
  ServerCog,
  ShieldCheck,
  Waypoints,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Tone = "blue" | "cyan" | "green" | "amber" | "red" | "violet";

const tones: Record<Tone, { text: string; border: string; icon: string; glow: string; dot: string }> = {
  blue: { text: "text-blue-300", border: "border-blue-400/30", icon: "bg-blue-400/10", glow: "shadow-blue-500/10", dot: "bg-blue-300" },
  cyan: { text: "text-cyan-300", border: "border-cyan-400/30", icon: "bg-cyan-400/10", glow: "shadow-cyan-500/10", dot: "bg-cyan-300" },
  green: { text: "text-emerald-300", border: "border-emerald-400/30", icon: "bg-emerald-400/10", glow: "shadow-emerald-500/10", dot: "bg-emerald-300" },
  amber: { text: "text-amber-300", border: "border-amber-400/30", icon: "bg-amber-400/10", glow: "shadow-amber-500/10", dot: "bg-amber-300" },
  red: { text: "text-rose-300", border: "border-rose-400/30", icon: "bg-rose-400/10", glow: "shadow-rose-500/10", dot: "bg-rose-300" },
  violet: { text: "text-violet-300", border: "border-violet-400/30", icon: "bg-violet-400/10", glow: "shadow-violet-500/10", dot: "bg-violet-300" },
};

type NodeData = {
  icon: LucideIcon;
  title: string;
  detail: string;
  tone: Tone;
  x: number;
  y: number;
  w?: number;
  emphasis?: boolean;
};

function TopologyNode({ node, index = 0 }: { node: NodeData; index?: number }) {
  const reduceMotion = useReducedMotion();
  const style = tones[node.tone];

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ delay: index * 0.035, duration: 0.3 }}
      className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 rounded-[6px] border bg-[#0b0e12]/95 px-3 py-2.5 shadow-lg backdrop-blur-sm ${style.border} ${style.glow} ${node.emphasis ? "ring-1 ring-white/[0.08]" : ""}`}
      style={{ left: `${node.x}%`, top: `${node.y}%`, width: `${node.w ?? 19}%` }}
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] border ${style.border} ${style.icon}`}>
        <node.icon className={`h-3.5 w-3.5 ${style.text}`} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[9px] font-semibold leading-4 text-zinc-100">{node.title}</span>
        <span className={`block truncate font-mono text-[6.5px] leading-3 ${style.text}`}>{node.detail}</span>
      </span>
      <span className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
    </motion.div>
  );
}

function PathLayer({
  paths,
  viewBox,
  active = [],
}: {
  paths: string[];
  viewBox: string;
  active?: number[];
}) {
  const reduceMotion = useReducedMotion();

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={viewBox} fill="none" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <filter id="path-glow">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {paths.map((path, index) => {
        const highlighted = active.includes(index);
        return (
          <g key={`${path}-${index}`}>
            <path d={path} stroke={highlighted ? "rgba(34,211,238,.32)" : "rgba(96,165,250,.14)"} strokeWidth={highlighted ? "1.4" : "1"} />
            {highlighted && !reduceMotion && (
              <motion.path
                d={path}
                stroke={index % 3 === 0 ? "#f59e0b" : "#22d3ee"}
                strokeWidth="1.4"
                strokeDasharray="4 16"
                filter="url(#path-glow)"
                initial={{ strokeDashoffset: 40 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 2.1, repeat: Infinity, ease: "linear", delay: index * 0.08 }}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

function PanelChrome({ title, state, replicas }: { title: string; state: string; replicas: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.018] px-4 py-3 font-mono text-[7px] uppercase tracking-[0.17em] text-zinc-600 sm:px-5">
      <span>{title}</span>
      <span className="flex items-center gap-3">
        <span className="hidden sm:inline">replicas: {replicas}</span>
        <span className="flex items-center gap-1.5 text-emerald-400"><Activity className="h-2.5 w-2.5" /> {state}</span>
      </span>
    </div>
  );
}

const heroNodes: NodeData[] = [
  { icon: Globe, title: "Kubernetes pods", detail: "replicas 3 / 12", tone: "blue", x: 50, y: 10, w: 52, emphasis: true },
  { icon: FileJson, title: "stdout log stream", detail: "rate 1.2k events/sec", tone: "cyan", x: 50, y: 27, w: 40 },
  { icon: Waypoints, title: "LogStrata engine", detail: "analysis active", tone: "violet", x: 50, y: 44, w: 52, emphasis: true },
  { icon: Gauge, title: "Metrics engine", detail: "p99 latency 82ms", tone: "amber", x: 25, y: 62, w: 38 },
  { icon: ShieldCheck, title: "Security analytics", detail: "0 active threats", tone: "red", x: 75, y: 62, w: 38 },
  { icon: GitBranch, title: "Bounded autoscaler", detail: "target replicas 9", tone: "green", x: 50, y: 79, w: 52, emphasis: true },
  { icon: Check, title: "Cluster scaling", detail: "state synced", tone: "green", x: 50, y: 94, w: 52, emphasis: true },
];

const heroPaths = [
  "M300 70 L300 125",
  "M300 175 L300 230",
  "M300 280 C300 315 150 300 150 350",
  "M300 280 C300 315 450 300 450 350",
  "M150 390 C150 425 300 410 300 445",
  "M450 390 C450 425 300 410 300 445",
  "M300 485 L300 525",
  "M300 550 C65 550 55 90 145 75",
];

function HeroTopology() {
  return (
    <div className="relative overflow-hidden rounded-[10px] border border-white/[0.09] bg-[#080a0d] text-white shadow-[0_30px_100px_rgba(0,0,0,.35)]">
      <PanelChrome title="Loop // runtime decision graph" state="analysis active" replicas="3/12" />
      <div className="relative aspect-[1.05/1] min-h-[500px]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="absolute left-5 top-5 font-mono text-[6px] uppercase tracking-[.18em] text-zinc-700">signal path / closed loop</div>
        <PathLayer paths={heroPaths} viewBox="0 0 600 580" active={[0, 1, 2, 4, 6, 7]} />
        {heroNodes.map((node, index) => <TopologyNode key={node.title} node={node} index={index} />)}
      </div>
      <MetricStrip compact />
    </div>
  );
}

const architectureNodes: NodeData[] = [
  { icon: Globe, title: "Frontend service", detail: "health 100% · 3 pods", tone: "blue", x: 11, y: 17, w: 17 },
  { icon: ServerCog, title: "API service", detail: "health 100% · 6 pods", tone: "blue", x: 29, y: 22, w: 17 },
  { icon: Cpu, title: "Worker service", detail: "health 100% · 5 pods", tone: "blue", x: 11, y: 38, w: 17 },
  { icon: Database, title: "PostgreSQL", detail: "primary · 42 conns", tone: "green", x: 29, y: 43, w: 17, emphasis: true },
  { icon: FileJson, title: "Container logs", detail: "42 events/s", tone: "cyan", x: 50, y: 15, w: 16 },
  { icon: Network, title: "Ingress logs", detail: "1.2k events/s", tone: "cyan", x: 69, y: 19, w: 16 },
  { icon: ShieldCheck, title: "Security events", detail: "8 events/s", tone: "red", x: 51, y: 32, w: 16 },
  { icon: Braces, title: "Application logs", detail: "188 events/s", tone: "cyan", x: 70, y: 36, w: 16 },
  { icon: ScanSearch, title: "Pattern extract", detail: "regex + JIT", tone: "amber", x: 49, y: 51, w: 16 },
  { icon: Gauge, title: "Latency detect", detail: "p95 + p99 limits", tone: "amber", x: 67, y: 52, w: 16, emphasis: true },
  { icon: Zap, title: "Error detect", detail: "5xx rate spikes", tone: "red", x: 85, y: 48, w: 16 },
  { icon: Activity, title: "Anomaly detect", detail: "ML baseline drift", tone: "red", x: 55, y: 67, w: 16 },
  { icon: ShieldCheck, title: "Threat detect", detail: "CVE + WAF shield", tone: "red", x: 75, y: 66, w: 16 },
  { icon: GitBranch, title: "Decision engine", detail: "evaluate bounded rules", tone: "violet", x: 25, y: 79, w: 25, emphasis: true },
  { icon: Waypoints, title: "Autoscaler / HPA patch", detail: "scale factor 3.0x", tone: "green", x: 62, y: 79, w: 25, emphasis: true },
  { icon: Box, title: "Kubernetes API server", detail: "202 accepted", tone: "blue", x: 31, y: 93, w: 25 },
  { icon: Check, title: "Replica state feedback", detail: "system healthy", tone: "green", x: 70, y: 93, w: 25, emphasis: true },
];

const architecturePaths = [
  "M110 110 C250 80 350 80 500 95", "M290 140 C370 120 410 110 500 95",
  "M110 235 C250 225 350 120 500 95", "M290 265 C360 240 410 120 500 95",
  "M110 110 C300 130 410 200 510 200", "M290 140 C390 145 450 180 510 200",
  "M290 265 C380 260 430 230 510 200", "M500 95 C580 100 610 115 690 120",
  "M500 95 C560 160 630 180 700 225", "M510 200 C570 230 630 225 700 225",
  "M690 120 C700 200 660 250 670 315", "M700 225 C760 235 810 250 850 290",
  "M500 95 C470 220 470 250 490 310", "M510 200 C520 250 510 275 490 310",
  "M490 310 C530 325 610 320 670 315", "M670 315 C730 300 790 290 850 290",
  "M490 310 C505 350 525 380 550 405", "M670 315 C650 350 610 380 550 405",
  "M850 290 C820 360 770 390 750 400", "M550 405 C500 440 350 455 250 480",
  "M750 400 C690 450 670 460 620 480", "M250 480 C350 500 470 480 620 480",
  "M250 480 C250 530 280 545 310 565", "M620 480 C610 530 480 545 310 565",
  "M310 565 C430 565 560 565 700 565", "M700 565 C930 560 945 80 820 70",
];

function Zone({ label, className }: { label: string; className: string }) {
  return (
    <div className={`pointer-events-none absolute rounded-[7px] border border-dashed border-white/[0.075] ${className}`}>
      <span className="absolute left-2 top-2 font-mono text-[5.5px] uppercase tracking-[.18em] text-zinc-700">{label}</span>
    </div>
  );
}

function DetailedTopology() {
  return (
    <div className="overflow-hidden rounded-[10px] border border-white/[0.09] bg-[#080a0d] text-white shadow-[0_30px_100px_rgba(0,0,0,.3)]">
      <PanelChrome title="Sys topology loop // latency spike detected" state="control active" replicas="9/12" />
      <div className="custom-scrollbar overflow-x-auto">
        <div className="relative min-h-[690px] min-w-[1080px]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.022)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.022)_1px,transparent_1px)] bg-[size:28px_28px]" />
          <Zone label="Cluster // workload surface" className="left-[3%] top-[7%] h-[44%] w-[35%]" />
          <Zone label="Telemetry // ingestion + analysis edge" className="left-[40%] top-[7%] h-[66%] w-[56%]" />
          <Zone label="Control plane // autoscale engine" className="bottom-[3%] left-[3%] h-[24%] w-[93%]" />
          <PathLayer paths={architecturePaths} viewBox="0 0 1080 690" active={[0, 7, 10, 15, 17, 19, 21, 23, 24, 25]} />
          {architectureNodes.map((node, index) => <TopologyNode key={node.title} node={node} index={index} />)}
        </div>
      </div>
      <MetricStrip />
    </div>
  );
}

function MetricStrip({ compact = false }: { compact?: boolean }) {
  const reduceMotion = useReducedMotion();
  const metrics = compact
    ? [["1.2k/s", "log ingestion"], ["0.82s", "autoscale sync"], ["0", "active threats"]]
    : [["18.24k", "log ingestion"], ["0.82s", "autoscale sync"], ["38.6 GB/s", "regex parse speed"], ["0", "threat mitigation"]];

  return (
    <div className={`grid gap-px border-t border-white/[0.08] bg-white/[0.08] ${compact ? "grid-cols-3" : "grid-cols-4"}`}>
      {metrics.map(([value, label], index) => (
        <div key={label} className="min-w-0 bg-[#0a0d11] px-3 py-3 sm:px-4">
          <p className="truncate font-mono text-[10px] font-semibold text-zinc-200 sm:text-xs">{value}</p>
          <p className="mt-1 truncate font-mono text-[5.5px] uppercase tracking-[.13em] text-zinc-600 sm:text-[6px]">{label}</p>
          <svg className="mt-2 h-3 w-full" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true">
            <motion.path
              d={index === metrics.length - 1 ? "M0 9 L25 9 L50 8 L75 9 L100 8" : "M0 10 L8 3 L16 9 L24 4 L32 11 L40 2 L48 8 L56 4 L64 10 L72 3 L80 9 L90 4 L100 7"}
              fill="none"
              stroke={index === metrics.length - 1 ? "#34d399" : "#22d3ee"}
              strokeWidth="1"
              initial={reduceMotion ? false : { pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, delay: index * 0.08 }}
            />
          </svg>
        </div>
      ))}
    </div>
  );
}

export function AnimatedControlLoop({ compact = false }: { compact?: boolean }) {
  return compact ? <HeroTopology /> : <DetailedTopology />;
}
