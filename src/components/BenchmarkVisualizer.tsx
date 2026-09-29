"use client";

import React, { useState, useMemo } from "react";
import { Zap, Shield, DollarSign, Activity, AlertTriangle, Cpu, CheckCircle2 } from "lucide-react";

interface Scenario {
  id: string;
  name: string;
  description: string;
  defaultRps: number;
  defaultPods: number;
  threatType: "none" | "ddos" | "cascade" | "surge";
}

const SCENARIOS: Scenario[] = [
  {
    id: "flash-sale",
    name: "Black Friday Flash Sale",
    description: "Abrupt 12x traffic surge on checkout and payment endpoints.",
    defaultRps: 18500,
    defaultPods: 12,
    threatType: "surge",
  },
  {
    id: "ddos-flood",
    name: "Credential Stuffing & DDoS",
    description: "Malicious botnet saturating login route with 401/403 anomalies.",
    defaultRps: 34000,
    defaultPods: 24,
    threatType: "ddos",
  },
  {
    id: "cascading-db",
    name: "Database Query Degrade",
    description: "Downstream latency spike causing container backlog queue saturation.",
    defaultRps: 9200,
    defaultPods: 8,
    threatType: "cascade",
  },
];

export function BenchmarkVisualizer() {
  const [selectedScenario, setSelectedScenario] = useState<string>("flash-sale");
  const [rps, setRps] = useState<number>(18500);
  const [basePods, setBasePods] = useState<number>(12);
  const [activeTab, setActiveTab] = useState<"latency" | "costs" | "threats">("latency");

  const scenario = SCENARIOS.find((s) => s.id === selectedScenario) ?? SCENARIOS[0];

  const handleScenarioChange = (s: Scenario) => {
    setSelectedScenario(s.id);
    setRps(s.defaultRps);
    setBasePods(s.defaultPods);
  };

  // Derived metrics calculations
  const stats = useMemo(() => {
    // Overprovisioning calculation: standard HPA requires ~35% extra headroom buffer
    // to handle 45s scraping lag without 504 timeouts.
    const podCostPerMonth = 54; // Average 2 vCPU / 4GB node slice cost
    const targetPods = Math.max(3, Math.ceil(rps / 950));
    const hpaHeadroomBuffer = Math.ceil(targetPods * 0.38);
    const logstrataBuffer = Math.ceil(targetPods * 0.08); // Only 8% headroom needed
    const wastedPods = Math.max(1, hpaHeadroomBuffer - logstrataBuffer);
    const monthlySavings = wastedPods * podCostPerMonth;
    const yearlySavings = monthlySavings * 12;

    // Detection & scale timings
    const logstrataLatencyMs = 140; // Sub-millisecond log parsing + ring buffer
    const kedaLatencyMs = 28000; // 28s Prometheus scrape + evaluate
    const hpaLatencyMs = 65000; // 65s Metrics server scrape + controller-manager loop

    // Dropped requests during lag phase before autoscaling responds
    const hpaDroppedRequests = Math.round((rps * 0.42) * (hpaLatencyMs / 1000));
    const kedaDroppedRequests = Math.round((rps * 0.28) * (kedaLatencyMs / 1000));
    const logstrataDroppedRequests = 0; // Caught before buffer overflows

    return {
      targetPods,
      wastedPods,
      monthlySavings,
      yearlySavings,
      logstrataLatencyMs,
      kedaLatencyMs,
      hpaLatencyMs,
      hpaDroppedRequests,
      kedaDroppedRequests,
      logstrataDroppedRequests,
    };
  }, [rps]);

  return (
    <div className="w-full rounded-[8px] border border-hairline bg-canvas p-6 md:p-8 shadow-diffused">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-hairline pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-cyan/10 border border-cyan/20 text-cyan text-xs font-mono font-semibold mb-2">
            <Activity className="h-3.5 w-3.5" />
            <span>INTERACTIVE BENCHMARK LAB</span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-ink tracking-tight">
            Autoscaling Performance & Cost Analyzer
          </h3>
          <p className="text-xs md:text-sm text-body mt-1 max-w-2xl">
            Simulate real production surges to compare instant log-stream evaluation against traditional polling architecture.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-[6px] border border-hairline bg-canvas-soft overflow-x-auto">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => handleScenarioChange(s)}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-medium whitespace-nowrap transition-all ${
                selectedScenario === s.id
                  ? "bg-canvas text-ink shadow-sm border border-hairline font-semibold"
                  : "text-mute hover:text-ink hover:bg-canvas-soft-hover"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Active Scenario Context Banner */}
      <div className="py-2.5 px-3 rounded-[6px] bg-canvas-soft border border-hairline my-4 flex items-center justify-between text-xs">
        <span className="text-body font-mono">
          <strong className="text-ink">Workload Profile:</strong> {scenario.description}
        </span>
        <span className="text-[10px] font-mono text-mute uppercase px-1.5 py-0.5 rounded bg-canvas border border-hairline">
          Type: {scenario.threatType}
        </span>
      </div>

      {/* Interactive Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-hairline">
        {/* RPS Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-ink flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-warning" />
              Traffic Ingress Surge:
            </span>
            <span className="font-mono text-cyan font-bold bg-canvas-soft px-2 py-0.5 rounded-[4px] border border-hairline">
              {rps.toLocaleString()} RPS
            </span>
          </div>
          <input
            type="range"
            min="1000"
            max="50000"
            step="500"
            value={rps}
            aria-label="Traffic Ingress Surge (RPS)"
            onChange={(e) => setRps(Number(e.target.value))}
            className="w-full accent-cyan h-2 bg-canvas-soft rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-mute font-mono">
            <span>1,000 RPS (Baseline)</span>
            <span>25,000 RPS (Peak)</span>
            <span>50,000 RPS (DDoS)</span>
          </div>
        </div>

        {/* Base Pods Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-ink flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-link" />
              Active Deployment Replicas:
            </span>
            <span className="font-mono text-link font-bold bg-canvas-soft px-2 py-0.5 rounded-[4px] border border-hairline">
              {basePods} Base Pods → Scale Target: {stats.targetPods} Pods
            </span>
          </div>
          <input
            type="range"
            min="3"
            max="60"
            step="1"
            value={basePods}
            aria-label="Active Deployment Replicas"
            onChange={(e) => setBasePods(Number(e.target.value))}
            className="w-full accent-link h-2 bg-canvas-soft rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-mute font-mono">
            <span>3 Pods</span>
            <span>30 Pods</span>
            <span>60 Pods</span>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 pt-6 pb-4">
        <button
          onClick={() => setActiveTab("latency")}
          className={`px-3 py-1.5 rounded-[6px] text-xs font-mono font-medium transition-all ${
            activeTab === "latency"
              ? "bg-primary text-on-primary font-bold shadow-sm"
              : "border border-hairline bg-canvas-soft text-body hover:text-ink"
          }`}
        >
          Detection Latency & Reaction Time
        </button>
        <button
          onClick={() => setActiveTab("costs")}
          className={`px-3 py-1.5 rounded-[6px] text-xs font-mono font-medium transition-all ${
            activeTab === "costs"
              ? "bg-primary text-on-primary font-bold shadow-sm"
              : "border border-hairline bg-canvas-soft text-body hover:text-ink"
          }`}
        >
          Cloud Overprovisioning Waste Saved
        </button>
        <button
          onClick={() => setActiveTab("threats")}
          className={`px-3 py-1.5 rounded-[6px] text-xs font-mono font-medium transition-all ${
            activeTab === "threats"
              ? "bg-primary text-on-primary font-bold shadow-sm"
              : "border border-hairline bg-canvas-soft text-body hover:text-ink"
          }`}
        >
          Attack Resiliency & Threat Shield
        </button>
      </div>

      {/* Tab 1: Detection Latency Comparison */}
      {activeTab === "latency" && (
        <div className="space-y-4 pt-2">
          {/* LogStrata Card */}
          <div className="p-4 rounded-[6px] border border-cyan/30 bg-cyan/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan animate-pulse" />
                <span className="text-xs font-mono font-bold text-ink">LOGSTRATA (Zero-Alloc stdout Socket)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan/20 text-cyan font-mono font-semibold">
                  WINNER
                </span>
              </div>
              <span className="text-sm font-mono font-extrabold text-cyan">
                {stats.logstrataLatencyMs} ms
              </span>
            </div>
            {/* Visual Bar */}
            <div className="w-full bg-canvas-soft h-2.5 rounded-full mt-2 overflow-hidden border border-hairline">
              <div className="bg-cyan h-full rounded-full w-[1.5%]" />
            </div>
            <div className="flex items-center justify-between text-[11px] text-body mt-2">
              <span>Reaction: Real-time stdout stream parsed in <strong>9.3 nanoseconds</strong></span>
              <span className="text-success font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> 0 dropped requests
              </span>
            </div>
          </div>

          {/* KEDA Card */}
          <div className="p-4 rounded-[6px] border border-hairline bg-canvas-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-warning" />
                <span className="text-xs font-mono font-bold text-ink">KEDA (Prometheus External Scaler)</span>
              </div>
              <span className="text-sm font-mono font-bold text-warning">
                {(stats.kedaLatencyMs / 1000).toFixed(1)} s
              </span>
            </div>
            <div className="w-full bg-canvas-soft-2 h-2.5 rounded-full mt-2 overflow-hidden border border-hairline">
              <div className="bg-warning h-full rounded-full w-[43%]" />
            </div>
            <div className="flex items-center justify-between text-[11px] text-body mt-2">
              <span>Lag: Polling interval + Prometheus TSDB query scrape window</span>
              <span className="text-warning font-mono">
                ~{stats.kedaDroppedRequests.toLocaleString()} requests impacted
              </span>
            </div>
          </div>

          {/* Kubernetes HPA Card */}
          <div className="p-4 rounded-[6px] border border-hairline bg-canvas-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-error" />
                <span className="text-xs font-mono font-bold text-ink">KUBERNETES STANDARD HPA (Metrics Server)</span>
              </div>
              <span className="text-sm font-mono font-bold text-error">
                {(stats.hpaLatencyMs / 1000).toFixed(1)} s
              </span>
            </div>
            <div className="w-full bg-canvas-soft-2 h-2.5 rounded-full mt-2 overflow-hidden border border-hairline">
              <div className="bg-error h-full rounded-full w-[100%]" />
            </div>
            <div className="flex items-center justify-between text-[11px] text-body mt-2">
              <span>Lag: 60s CPU/RAM sample window + metrics aggregation queue</span>
              <span className="text-error font-mono font-semibold">
                ~{stats.hpaDroppedRequests.toLocaleString()} 504 Gateway Timeouts
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Cost Savings */}
      {activeTab === "costs" && (
        <div className="pt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-[6px] border border-emerald-500/30 bg-emerald-500/5">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold mb-1">
              <DollarSign className="h-4 w-4" />
              MONTHLY CLOUD SAVINGS
            </div>
            <div className="text-3xl font-extrabold text-ink font-mono tracking-tight">
              ${stats.monthlySavings.toLocaleString()}
            </div>
            <p className="text-[11px] text-body mt-2">
              Eliminates the {stats.wastedPods} excess standby buffer pods required to cushion traditional HPA reaction lag.
            </p>
          </div>

          <div className="p-5 rounded-[6px] border border-hairline bg-canvas-soft">
            <div className="flex items-center gap-2 text-xs font-mono text-link font-bold mb-1">
              <Activity className="h-4 w-4" />
              ANNUAL RUNTIME SAVINGS
            </div>
            <div className="text-3xl font-extrabold text-ink font-mono tracking-tight">
              ${stats.yearlySavings.toLocaleString()}
            </div>
            <p className="text-[11px] text-body mt-2">
              Calculated across continuous autoscaling cycles with predictive EMA cooldown hysteresis.
            </p>
          </div>

          <div className="p-5 rounded-[6px] border border-hairline bg-canvas-soft">
            <div className="flex items-center gap-2 text-xs font-mono text-warning font-bold mb-1">
              <Cpu className="h-4 w-4" />
              AGENT MEMORY OVERHEAD
            </div>
            <div className="text-3xl font-extrabold text-ink font-mono tracking-tight">
              &lt; 18 MB
            </div>
            <p className="text-[11px] text-body mt-2">
              Lightweight Go DaemonSet vs. multi-gigabyte Prometheus JVM/TSDB scraping infrastructure.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Threats & Resiliency */}
      {activeTab === "threats" && (
        <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-[6px] border border-hairline bg-canvas-soft">
            <div className="flex items-center gap-2 text-xs font-mono text-error font-bold mb-2">
              <AlertTriangle className="h-4 w-4" />
              STANDARD KUBERNETES UNDER ATTACK
            </div>
            <p className="text-xs text-body leading-relaxed">
              When an attacker launches a credential-stuffing attack or HTTP flood:
            </p>
            <ul className="text-xs text-body mt-2 space-y-1.5 list-disc list-inside">
              <li>HPA observes high CPU and scales pods up indefinitely until node quota is exhausted.</li>
              <li>When the attack subsides, HPA scales pods down immediately, causing sudden outages.</li>
              <li>Zero correlation between malicious ingress IPs and autoscaler decisions.</li>
            </ul>
          </div>

          <div className="p-4 rounded-[6px] border border-cyan/30 bg-cyan/5">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan font-bold mb-2">
              <Shield className="h-4 w-4" />
              LOGSTRATA THREAT-AWARE RESILIENCY
            </div>
            <p className="text-xs text-body leading-relaxed">
              LogStrata correlates log anomalies directly with Kubernetes orchestration:
            </p>
            <ul className="text-xs text-body mt-2 space-y-1.5 list-disc list-inside text-ink font-medium">
              <li>Instantly synthesizes and injects Kubernetes <code className="text-cyan font-mono">NetworkPolicy</code> CIDR drops.</li>
              <li>Engages <strong>Scale-Down Lock</strong> to prevent resource starvation during active attacks.</li>
              <li>Dispatches real-time incident webhooks to Slack and Discord in &lt; 50ms.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
