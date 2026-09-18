"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import {
  Play,
  Pause,
  Shield,
  Activity,
  Terminal,
  Server,
  Zap,
  Radio,
  Layers,
  Copy,
  Check,
  Cpu,
  RefreshCw,
  Lock,
} from "lucide-react";

interface NodeDetail {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  tag: string;
  role: string;
  accent: string;
  payload: Record<string, unknown>;
}

export function HeroDiagram() {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // States: 0 = Baseline, 1 = Traffic Spike, 2 = Security Threat, 3 = Scaled Convergence
  const [heroState, setHeroState] = useState<0 | 1 | 2 | 3>(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Automatic state cycling when isPlaying is true
  useEffect(() => {
    if (!isPlaying) return;
    const durations = [6000, 5000, 5000, 6000];
    const timer = setTimeout(() => {
      setHeroState((prev) => ((prev + 1) % 4) as 0 | 1 | 2 | 3);
    }, durations[heroState]);

    return () => clearTimeout(timer);
  }, [heroState, isPlaying]);

  const isLight = mounted && resolvedTheme === "light";

  // State configurations with refined harmonious color palettes
  const stateConfigs = [
    {
      id: 0,
      badge: "STABLE BASELINE",
      label: "Steady State",
      sync: "REPLICAS: 3 / 12",
      logRate: "48 req/s",
      latency: "82ms",
      threats: "0 threats",
      narrative:
        "Normal traffic volume. Pod stdout streams parsed sub-millisecond via containerd socket. 3 pods serving steady 82ms SLA.",
      accent: "#10b981", // Emerald
      accentLight: "#059669",
      accentBg: "rgba(16, 185, 129, 0.12)",
    },
    {
      id: 1,
      badge: "INGRESS SURGE DETECTED",
      label: "Traffic Spike",
      sync: "SPIKE PRE-EMPTED",
      logRate: "1.4k req/s",
      latency: "460ms (RISING)",
      threats: "0 threats",
      narrative:
        "Sudden traffic jump detected in access logs. LogStrata dispatches proactive scale event 18 seconds ahead of CPU threshold lag.",
      accent: "#f59e0b", // Warm Amber
      accentLight: "#d97706",
      accentBg: "rgba(245, 158, 11, 0.12)",
    },
    {
      id: 2,
      badge: "THREAT ANOMALY DETECTED",
      label: "DDoS / Brute Force",
      sync: "INGRESS DEFENSE ACTIVE",
      logRate: "2.8k req/s",
      latency: "210ms (MITIGATING)",
      threats: "1 attacker IP blocked",
      narrative:
        "High-velocity 401/403 credential scanning detected. Threat Shield locks scale-down and injects dynamic Ingress firewall drops.",
      accent: "#f43f5e", // Rose Crimson
      accentLight: "#e11d48",
      accentBg: "rgba(244, 63, 94, 0.12)",
    },
    {
      id: 3,
      badge: "REPLICAS EXPANDED & RECOVERED",
      label: "Capacity Mutated",
      sync: "REPLICAS: 9 / 12",
      logRate: "1.4k req/s",
      latency: "105ms (RESTORED)",
      threats: "Isolated at Edge",
      narrative:
        "Kubernetes deployment successfully scaled to 9 replicas. Cluster latency normalized with zero dropped user requests.",
      accent: "#06b6d4", // Electric Cyan
      accentLight: "#0891b2",
      accentBg: "rgba(6, 182, 212, 0.12)",
    },
  ];

  const currentConfig = stateConfigs[heroState];

  // Inspector node database
  const nodeDetails: Record<string, NodeDetail> = {
    pods: {
      id: "pods",
      title: "Kubernetes Workload Pods",
      subtitle: "Deployment: commerce-frontend",
      badge: heroState === 3 ? "9 Pods Healthy" : "3 Pods Healthy",
      tag: "cgroup v2",
      role: "Application instances streaming stdout directly to host containerd sockets with zero sidecar overhead.",
      accent: "#6366f1",
      payload: {
        namespace: "production",
        deployment: "commerce-frontend",
        currentReplicas: heroState === 3 ? 9 : 3,
        readyReplicas: heroState === 3 ? 9 : 3,
        containerRuntime: "containerd://1.7.15",
        cgroupDriver: "systemd",
        stdoutStream: "active",
      },
    },
    logs: {
      id: "logs",
      title: "containerd Socket Stream",
      subtitle: "Socket: /run/containerd/containerd.sock",
      badge: heroState === 0 ? "48 lines/s" : heroState === 1 ? "1.4k lines/s" : "2.8k lines/s",
      tag: "POSIX FIFO",
      role: "Zero-network socket tailer reading raw container stdout streams with sub-millisecond ring buffer overhead.",
      accent: "#0ea5e9",
      payload: {
        source: "/var/log/pods/commerce-frontend-*/*.log",
        latency: "< 0.38ms",
        bufferAllocation: "64KB zero-copy ring-buffer",
        status: "STREAMING_ACTIVE",
        ioEngine: "io_uring",
      },
    },
    engine: {
      id: "engine",
      title: "LogStrata Control Engine",
      subtitle: "Sub-ms Stream Parsing Core",
      badge: "Cycle: 15ms",
      tag: "15ms Loop",
      role: "In-memory token analysis matching regular patterns, status code ratios, and threat signatures in user-space.",
      accent: currentConfig.accent,
      payload: {
        evaluationLoop: "15ms",
        activeModel: "Sliding-Window Transaction Rate (SWTR)",
        confidenceScore: 0.992,
        decision:
          heroState === 1
            ? "TRIGGER_PRE_EMPTIVE_SCALE_UP"
            : heroState === 2
            ? "ENGAGE_THREAT_LOCK_AND_INGRESS_DROP"
            : heroState === 3
            ? "CONVERGED_AT_TARGET_CAPACITY"
            : "MONITORING_BASELINE",
      },
    },
    metrics: {
      id: "metrics",
      title: "Performance Metrics Engine",
      subtitle: "Latency & RPS Profiler",
      badge: currentConfig.latency,
      tag: "P95 / P99 SLA",
      role: "Computes real-time P95/P99 latency percentiles and transaction density per second directly from HTTP status codes.",
      accent: "#f59e0b",
      payload: {
        currentRPS: heroState === 0 ? 48 : heroState === 1 ? 1420 : 2850,
        p95Latency: currentConfig.latency,
        errorRatePercent: heroState === 2 ? "18.4%" : "0.18%",
        trend: heroState === 1 ? "ACCELERATING (+340%)" : "STABILIZED",
      },
    },
    security: {
      id: "security",
      title: "Threat Shield (SIEM)",
      subtitle: "Signature & Ingress Analytics",
      badge: currentConfig.threats,
      tag: "Ingress WAF",
      role: "Detects unauthorized brute-force spikes, credential scanning, and application-layer DDoS floods in flight.",
      accent: "#f43f5e",
      payload: {
        threatLevel: heroState === 2 ? "CRITICAL" : "NORMAL",
        blockedIPs: heroState === 2 ? ["194.26.29.11", "45.154.255.8"] : [],
        scaleDownLock: heroState === 2 ? "ENGAGED" : "OFF",
        mitigationAction: heroState === 2 ? "INGRESS_WAF_REJECT (HTTP 429)" : "NONE",
      },
    },
    decision: {
      id: "decision",
      title: "Autoscaler Decision Controller",
      subtitle: "Reconciliation Loop",
      badge: heroState === 1 || heroState === 2 ? "Scale Target: 9" : "Scale Target: 3",
      tag: "HPA v2 Mutator",
      role: "Evaluates workload capacity equations and threat profiles to mutate target replica bounds via Kubernetes API.",
      accent: "#10b981",
      payload: {
        algorithm: "Proactive-RPS-Target",
        desiredReplicas: heroState === 1 || heroState === 2 || heroState === 3 ? 9 : 3,
        stepRatio: "3.0x",
        k8sPatchStatus: heroState === 1 ? "DISPATCHED" : "SYNCHRONIZED",
        timeSavedVsMetricsServer: "18.4 seconds",
      },
    },
  };

  const activeNode = selectedNode ? nodeDetails[selectedNode] : null;

  const handleCopyPayload = () => {
    if (!activeNode) return;
    navigator.clipboard.writeText(JSON.stringify(activeNode.payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex flex-col font-sans select-none" id="hero-dfd-root">
      {/* Control Deck Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-hairline/80">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-2.5 w-2.5 items-center justify-center">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: currentConfig.accent }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ backgroundColor: currentConfig.accent }}
            />
          </div>
          <span className="font-mono text-[11px] font-bold tracking-wider uppercase text-ink">
            {currentConfig.badge}
          </span>
        </div>

        {/* State Pills & Pause/Play Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {stateConfigs.map((cfg) => {
            const isCurrent = heroState === cfg.id;
            return (
              <button
                key={cfg.id}
                onClick={() => {
                  setHeroState(cfg.id as 0 | 1 | 2 | 3);
                  setIsPlaying(false);
                }}
                className={`px-2.5 py-1 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all duration-200 cursor-pointer border ${
                  isCurrent
                    ? "bg-ink text-canvas border-ink font-semibold shadow-sm"
                    : "bg-canvas-soft/60 hover:bg-canvas-soft text-mute hover:text-ink border-hairline"
                }`}
              >
                {cfg.id + 1}. {cfg.label}
              </button>
            );
          })}

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pause auto loop" : "Resume auto loop"}
            className="p-1.5 rounded-lg border border-hairline bg-canvas-soft/60 hover:bg-canvas-soft text-body hover:text-ink transition-colors cursor-pointer ml-1"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>
        </div>
      </div>

      {/* Dynamic Narrative Banner */}
      <div className="mb-4 px-3.5 py-2.5 rounded-xl border border-hairline/80 bg-canvas-soft/70 backdrop-blur-sm flex items-start gap-3 text-xs leading-relaxed">
        <div className="p-1 rounded-md bg-canvas border border-hairline shrink-0 mt-0.5">
          <Radio className="w-3.5 h-3.5 animate-pulse" style={{ color: currentConfig.accent }} />
        </div>
        <div className="flex-1">
          <span className="text-body font-light">{currentConfig.narrative}</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 font-mono text-[10px] text-mute border-l border-hairline/80 pl-3">
          <div>
            <span className="text-mute/70">LATENCY:</span>{" "}
            <span className="font-semibold text-ink">{currentConfig.latency}</span>
          </div>
          <div>
            <span className="text-mute/70">SYNC:</span>{" "}
            <span className="font-semibold text-ink">{currentConfig.sync}</span>
          </div>
        </div>
      </div>

      {/* SVG Interactive Canvas */}
      <div className="relative w-full rounded-xl bg-canvas/95 border border-hairline/80 p-2 sm:p-4 overflow-hidden shadow-sm">
        {/* Ambient background glow behind engine */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-3xl opacity-20 dark:opacity-25 pointer-events-none transition-colors duration-700"
          style={{ backgroundColor: currentConfig.accent }}
        />

        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(${isLight ? "#000" : "#fff"} 1px, transparent 1px)`,
            backgroundSize: "16px 16px",
          }}
        />

        <svg
          className="w-full h-auto overflow-visible relative z-10"
          viewBox="0 0 520 380"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="LogStrata Log-Driven Autoscaling Pipeline"
        >
          <defs>
            {/* Laser trail glow filter */}
            <filter id="laser-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 2 0" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Node Background Gradients - Dark Theme */}
            {/* Pods: Indigo slate */}
            <linearGradient id="grad-pods-dark" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0f1523" />
              <stop offset="100%" stopColor="#090d16" />
            </linearGradient>

            {/* Socket: Cyan slate */}
            <linearGradient id="grad-socket-dark" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#08171f" />
              <stop offset="100%" stopColor="#040e14" />
            </linearGradient>

            {/* Engine: Deep Sapphire Obsidian */}
            <linearGradient id="grad-engine-dark" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0d1b2a" />
              <stop offset="100%" stopColor="#060c14" />
            </linearGradient>

            {/* Metrics: Warm Amber slate */}
            <linearGradient id="grad-metrics-dark" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1a1309" />
              <stop offset="100%" stopColor="#0e0903" />
            </linearGradient>

            {/* Threat: Crimson Ruby slate */}
            <linearGradient id="grad-threat-dark" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e0b13" />
              <stop offset="100%" stopColor="#0f0308" />
            </linearGradient>

            {/* Decision: Mint Emerald slate */}
            <linearGradient id="grad-decision-dark" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#091b13" />
              <stop offset="100%" stopColor="#040e09" />
            </linearGradient>

            {/* Node Background Gradients - Light Theme */}
            <linearGradient id="grad-pods-light" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f5f7ff" />
            </linearGradient>

            <linearGradient id="grad-socket-light" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f0fdfa" />
            </linearGradient>

            <linearGradient id="grad-engine-light" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f0f9ff" />
            </linearGradient>

            <linearGradient id="grad-metrics-light" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#fffdf5" />
            </linearGradient>

            <linearGradient id="grad-threat-light" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#fff5f6" />
            </linearGradient>

            <linearGradient id="grad-decision-light" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f2fdf7" />
            </linearGradient>
          </defs>

          {/* PATH CONNECTIONS */}
          <g id="pipeline-connections">
            {/* 1. Pods -> containerd socket */}
            <path
              d="M 260 52 L 260 76"
              stroke={isLight ? "#e2e8f0" : "rgba(255, 255, 255, 0.08)"}
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <path
              d="M 260 52 L 260 76"
              stroke="#6366f1"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeDasharray="10 40"
              filter="url(#laser-glow)"
              style={{
                animation: `flowAnim ${heroState === 1 ? "1.2s" : "3s"} linear infinite`,
              }}
            />

            {/* 2. containerd socket -> LogStrata Engine */}
            <path
              d="M 260 114 L 260 138"
              stroke={isLight ? "#e2e8f0" : "rgba(255, 255, 255, 0.08)"}
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <path
              d="M 260 114 L 260 138"
              stroke={currentConfig.accent}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray="12 40"
              filter="url(#laser-glow)"
              style={{
                animation: `flowAnim ${heroState === 1 ? "1.0s" : "2.5s"} linear infinite`,
              }}
            />

            {/* 3. LogStrata Engine -> Metrics Engine (Left Branch) */}
            <path
              d="M 210 184 C 210 206, 140 196, 140 218"
              fill="none"
              stroke={isLight ? "#e2e8f0" : "rgba(255, 255, 255, 0.08)"}
              strokeWidth="1.5"
            />
            <path
              d="M 210 184 C 210 206, 140 196, 140 218"
              fill="none"
              stroke={heroState === 1 ? "#f59e0b" : "#0284c7"}
              strokeWidth="2"
              strokeDasharray="12 60"
              filter="url(#laser-glow)"
              style={{
                animation: `flowAnim ${heroState === 1 ? "1.1s" : "3.5s"} linear infinite`,
              }}
            />

            {/* 4. LogStrata Engine -> Threat Shield (Right Branch) */}
            <path
              d="M 310 184 C 310 206, 380 196, 380 218"
              fill="none"
              stroke={isLight ? "#e2e8f0" : "rgba(255, 255, 255, 0.08)"}
              strokeWidth="1.5"
            />
            <path
              d="M 310 184 C 310 206, 380 196, 380 218"
              fill="none"
              stroke={heroState === 2 ? "#f43f5e" : "#8b5cf6"}
              strokeWidth="2"
              strokeDasharray="12 60"
              filter="url(#laser-glow)"
              style={{
                animation: `flowAnim ${heroState === 2 ? "1.0s" : "4.0s"} linear infinite`,
              }}
            />

            {/* 5. Metrics -> Decision Controller */}
            <path
              d="M 140 262 C 140 282, 220 274, 220 294"
              fill="none"
              stroke={isLight ? "#e2e8f0" : "rgba(255, 255, 255, 0.08)"}
              strokeWidth="1.5"
            />
            <path
              d="M 140 262 C 140 282, 220 274, 220 294"
              fill="none"
              stroke={heroState === 1 ? "#f59e0b" : "#10b981"}
              strokeWidth="2"
              strokeDasharray="12 60"
              filter="url(#laser-glow)"
              style={{
                animation: "flowAnim 3s linear infinite",
              }}
            />

            {/* 6. Threat Shield -> Decision Controller */}
            <path
              d="M 380 262 C 380 282, 300 274, 300 294"
              fill="none"
              stroke={isLight ? "#e2e8f0" : "rgba(255, 255, 255, 0.08)"}
              strokeWidth="1.5"
            />
            <path
              d="M 380 262 C 380 282, 300 274, 300 294"
              fill="none"
              stroke={heroState === 2 ? "#f43f5e" : "#10b981"}
              strokeWidth="2"
              strokeDasharray="12 60"
              filter="url(#laser-glow)"
              style={{
                animation: "flowAnim 3s linear infinite",
              }}
            />

            {/* 7. Feedback scale loop: Decision -> Pods (Left Return Loop) */}
            <path
              d="M 170 325 C 45 325, 15 200, 15 120 C 15 38, 55 28, 160 28"
              fill="none"
              stroke={isLight ? "#f1f5f9" : "rgba(255, 255, 255, 0.05)"}
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {heroState === 3 && (
              <path
                d="M 170 325 C 45 325, 15 200, 15 120 C 15 38, 55 28, 160 28"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.2"
                strokeDasharray="20 80"
                filter="url(#laser-glow)"
                style={{
                  animation: "flowAnim 2.2s linear infinite",
                }}
              />
            )}
          </g>

          {/* SVG NODES */}
          <g id="system-nodes">
            {/* 1. Kubernetes Workload Pods */}
            <g
              transform="translate(160, 10)"
              className="cursor-pointer group"
              onClick={() => setSelectedNode(selectedNode === "pods" ? null : "pods")}
            >
              <rect
                x="0"
                y="0"
                width="200"
                height="44"
                rx="8"
                fill={isLight ? "url(#grad-pods-light)" : "url(#grad-pods-dark)"}
                stroke={
                  selectedNode === "pods"
                    ? "#6366f1"
                    : heroState === 3
                    ? "#10b981"
                    : isLight
                    ? "#c7d2fe"
                    : "#2a364f"
                }
                strokeWidth={selectedNode === "pods" ? "2" : "1"}
              />
              {/* Top Specular Edge */}
              <line
                x1="4"
                y1="1"
                x2="196"
                y2="1"
                stroke={isLight ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.12)"}
                strokeWidth="1"
              />
              {/* Icon Container */}
              <rect
                x="8"
                y="8"
                width="28"
                height="28"
                rx="6"
                fill={isLight ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.18)"}
              />
              <Server x="14" y="14" width="16" height="16" className="text-indigo-400" />
              <text
                x="44"
                y="20"
                fill={isLight ? "#0f172a" : "#f1f5f9"}
                fontSize="11"
                fontWeight="600"
              >
                Workload Pods
              </text>
              <text
                x="44"
                y="32"
                fill={isLight ? "#4f46e5" : "#a5b4fc"}
                fontFamily="monospace"
                fontSize="8.5"
              >
                {heroState === 3 ? "Replicas: 9 / 12 (Scaled)" : "Replicas: 3 / 12 (Active)"}
              </text>
              {/* Micro-chip Tag */}
              <rect
                x="142"
                y="6"
                width="50"
                height="13"
                rx="3.5"
                fill={isLight ? "#eef2ff" : "rgba(99, 102, 241, 0.2)"}
                stroke={isLight ? "#c7d2fe" : "rgba(99, 102, 241, 0.4)"}
                strokeWidth="0.5"
              />
              <text
                x="167"
                y="15.5"
                textAnchor="middle"
                fill={isLight ? "#4338ca" : "#c7d2fe"}
                fontFamily="monospace"
                fontSize="7.5"
                fontWeight="500"
              >
                cgroup v2
              </text>
            </g>

            {/* 2. containerd stdout stream */}
            <g
              transform="translate(175, 76)"
              className="cursor-pointer group"
              onClick={() => setSelectedNode(selectedNode === "logs" ? null : "logs")}
            >
              <rect
                x="0"
                y="0"
                width="170"
                height="38"
                rx="7"
                fill={isLight ? "url(#grad-socket-light)" : "url(#grad-socket-dark)"}
                stroke={
                  selectedNode === "logs"
                    ? "#0ea5e9"
                    : isLight
                    ? "#99f6e4"
                    : "#163842"
                }
                strokeWidth={selectedNode === "logs" ? "2" : "1"}
              />
              {/* Top Specular Edge */}
              <line
                x1="4"
                y1="1"
                x2="166"
                y2="1"
                stroke={isLight ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.12)"}
                strokeWidth="1"
              />
              <rect
                x="8"
                y="8"
                width="22"
                height="22"
                rx="5"
                fill={isLight ? "rgba(14, 165, 233, 0.1)" : "rgba(14, 165, 233, 0.18)"}
              />
              <Terminal x="12" y="12" width="14" height="14" className="text-sky-400" />
              <text
                x="38"
                y="18"
                fill={isLight ? "#0f172a" : "#f1f5f9"}
                fontSize="10"
                fontWeight="600"
              >
                stdout socket stream
              </text>
              <text
                x="38"
                y="29"
                fill={isLight ? "#0284c7" : "#38bdf8"}
                fontFamily="monospace"
                fontSize="8"
              >
                rate: {currentConfig.logRate}
              </text>
              {/* Micro-chip Tag */}
              <rect
                x="124"
                y="5"
                width="40"
                height="12"
                rx="3"
                fill={isLight ? "#ecfeff" : "rgba(14, 165, 233, 0.2)"}
                stroke={isLight ? "#a5f3fc" : "rgba(14, 165, 233, 0.4)"}
                strokeWidth="0.5"
              />
              <text
                x="144"
                y="13.5"
                textAnchor="middle"
                fill={isLight ? "#0e7490" : "#7dd3fc"}
                fontFamily="monospace"
                fontSize="7"
                fontWeight="500"
              >
                POSIX
              </text>
            </g>

            {/* 3. LogStrata Control Engine - Centerpiece */}
            <g
              transform="translate(145, 138)"
              className="cursor-pointer group"
              onClick={() => setSelectedNode(selectedNode === "engine" ? null : "engine")}
            >
              <rect
                x="0"
                y="0"
                width="230"
                height="46"
                rx="8"
                fill={isLight ? "url(#grad-engine-light)" : "url(#grad-engine-dark)"}
                stroke={selectedNode === "engine" ? "#38bdf8" : currentConfig.accent}
                strokeWidth={selectedNode === "engine" ? "2" : "1.5"}
              />
              {/* Top Specular Edge */}
              <line
                x1="4"
                y1="1"
                x2="226"
                y2="1"
                stroke={isLight ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 255, 255, 0.16)"}
                strokeWidth="1"
              />
              <rect
                x="8"
                y="9"
                width="28"
                height="28"
                rx="6"
                fill={isLight ? currentConfig.accentBg : "rgba(255, 255, 255, 0.08)"}
              />
              <Activity
                x="14"
                y="15"
                width="16"
                height="16"
                style={{ color: currentConfig.accent }}
              />
              <text
                x="44"
                y="20"
                fill={isLight ? "#0f172a" : "#f1f5f9"}
                fontSize="11"
                fontWeight="600"
              >
                LogStrata Engine Core
              </text>
              <text
                x="44"
                y="33"
                fill={currentConfig.accent}
                fontFamily="monospace"
                fontSize="8.5"
                fontWeight="500"
              >
                {heroState === 0
                  ? "Status: ANALYSIS ACTIVE"
                  : heroState === 1
                  ? "Status: PRE-EMPTING SPIKE"
                  : heroState === 2
                  ? "Status: MITIGATING THREAT"
                  : "Status: CAPACITY RECONCILED"}
              </text>
              {/* High-tech Tag */}
              <rect
                x="172"
                y="6"
                width="50"
                height="13"
                rx="3.5"
                fill={isLight ? "#f0f9ff" : "rgba(56, 189, 248, 0.15)"}
                stroke={isLight ? "#bae6fd" : "rgba(56, 189, 248, 0.3)"}
                strokeWidth="0.5"
              />
              <text
                x="197"
                y="15.5"
                textAnchor="middle"
                fill={isLight ? "#0369a1" : "#7dd3fc"}
                fontFamily="monospace"
                fontSize="7.5"
                fontWeight="500"
              >
                15ms loop
              </text>
            </g>

            {/* 4. Left Node: Performance Metrics */}
            <g
              transform="translate(60, 218)"
              className="cursor-pointer group"
              onClick={() => setSelectedNode(selectedNode === "metrics" ? null : "metrics")}
            >
              <rect
                x="0"
                y="0"
                width="160"
                height="44"
                rx="7"
                fill={isLight ? "url(#grad-metrics-light)" : "url(#grad-metrics-dark)"}
                stroke={
                  selectedNode === "metrics"
                    ? "#f59e0b"
                    : heroState === 1
                    ? "#f59e0b"
                    : isLight
                    ? "#fde68a"
                    : "#38240a"
                }
                strokeWidth={selectedNode === "metrics" ? "2" : "1"}
              />
              {/* Top Specular Edge */}
              <line
                x1="4"
                y1="1"
                x2="156"
                y2="1"
                stroke={isLight ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.12)"}
                strokeWidth="1"
              />
              <rect
                x="8"
                y="8"
                width="28"
                height="28"
                rx="5"
                fill={isLight ? "rgba(245, 158, 11, 0.1)" : "rgba(245, 158, 11, 0.18)"}
              />
              <Zap x="14" y="14" width="16" height="16" className="text-amber-400" />
              <text
                x="42"
                y="19"
                fill={isLight ? "#0f172a" : "#f1f5f9"}
                fontSize="10"
                fontWeight="600"
              >
                Metrics Engine
              </text>
              <text
                x="42"
                y="31"
                fill={isLight ? "#d97706" : "#fbbf24"}
                fontFamily="monospace"
                fontSize="8"
              >
                {currentConfig.latency}
              </text>
              {/* Micro-chip Tag */}
              <rect
                x="116"
                y="5"
                width="38"
                height="12"
                rx="3"
                fill={isLight ? "#fef3c7" : "rgba(245, 158, 11, 0.2)"}
                stroke={isLight ? "#fde68a" : "rgba(245, 158, 11, 0.4)"}
                strokeWidth="0.5"
              />
              <text
                x="135"
                y="13.5"
                textAnchor="middle"
                fill={isLight ? "#b45309" : "#fcd34d"}
                fontFamily="monospace"
                fontSize="7"
                fontWeight="500"
              >
                P95 SLA
              </text>
            </g>

            {/* 5. Right Node: Security Threat Shield */}
            <g
              transform="translate(300, 218)"
              className="cursor-pointer group"
              onClick={() => setSelectedNode(selectedNode === "security" ? null : "security")}
            >
              <rect
                x="0"
                y="0"
                width="160"
                height="44"
                rx="7"
                fill={isLight ? "url(#grad-threat-light)" : "url(#grad-threat-dark)"}
                stroke={
                  selectedNode === "security"
                    ? "#f43f5e"
                    : heroState === 2
                    ? "#f43f5e"
                    : isLight
                    ? "#fecdd3"
                    : "#38121f"
                }
                strokeWidth={selectedNode === "security" ? "2" : "1"}
              />
              {/* Top Specular Edge */}
              <line
                x1="4"
                y1="1"
                x2="156"
                y2="1"
                stroke={isLight ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.12)"}
                strokeWidth="1"
              />
              <rect
                x="8"
                y="8"
                width="28"
                height="28"
                rx="5"
                fill={isLight ? "rgba(244, 63, 94, 0.1)" : "rgba(244, 63, 94, 0.18)"}
              />
              <Shield x="14" y="14" width="16" height="16" className="text-rose-400" />
              <text
                x="42"
                y="19"
                fill={isLight ? "#0f172a" : "#f1f5f9"}
                fontSize="10"
                fontWeight="600"
              >
                Threat Shield
              </text>
              <text
                x="42"
                y="31"
                fill={heroState === 2 ? "#f43f5e" : isLight ? "#e11d48" : "#fda4af"}
                fontFamily="monospace"
                fontSize="8"
              >
                {currentConfig.threats}
              </text>
              {/* Micro-chip Tag */}
              <rect
                x="118"
                y="5"
                width="36"
                height="12"
                rx="3"
                fill={isLight ? "#ffe4e6" : "rgba(244, 63, 94, 0.2)"}
                stroke={isLight ? "#fecdd3" : "rgba(244, 63, 94, 0.4)"}
                strokeWidth="0.5"
              />
              <text
                x="136"
                y="13.5"
                textAnchor="middle"
                fill={isLight ? "#be123c" : "#fecdd3"}
                fontFamily="monospace"
                fontSize="7"
                fontWeight="500"
              >
                WAF
              </text>
            </g>

            {/* 6. Decision & Reconciliation Engine */}
            <g
              transform="translate(160, 294)"
              className="cursor-pointer group"
              onClick={() => setSelectedNode(selectedNode === "decision" ? null : "decision")}
            >
              <rect
                x="0"
                y="0"
                width="200"
                height="44"
                rx="8"
                fill={isLight ? "url(#grad-decision-light)" : "url(#grad-decision-dark)"}
                stroke={
                  selectedNode === "decision"
                    ? "#10b981"
                    : heroState === 3
                    ? "#10b981"
                    : isLight
                    ? "#bbf7d0"
                    : "#153d2d"
                }
                strokeWidth={selectedNode === "decision" ? "2" : "1"}
              />
              {/* Top Specular Edge */}
              <line
                x1="4"
                y1="1"
                x2="196"
                y2="1"
                stroke={isLight ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.12)"}
                strokeWidth="1"
              />
              <rect
                x="8"
                y="8"
                width="28"
                height="28"
                rx="6"
                fill={isLight ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.18)"}
              />
              <Layers x="14" y="14" width="16" height="16" className="text-emerald-400" />
              <text
                x="44"
                y="20"
                fill={isLight ? "#0f172a" : "#f1f5f9"}
                fontSize="11"
                fontWeight="600"
              >
                Autoscaler Decision
              </text>
              <text
                x="44"
                y="32"
                fill={isLight ? "#059669" : "#6ee7b7"}
                fontFamily="monospace"
                fontSize="8.5"
              >
                {heroState === 1 || heroState === 2
                  ? "Target: 9 replicas (Scale Patch)"
                  : heroState === 3
                  ? "Target: 9 replicas (Active)"
                  : "Target: 3 replicas (Idle)"}
              </text>
              {/* Micro-chip Tag */}
              <rect
                x="146"
                y="6"
                width="46"
                height="13"
                rx="3.5"
                fill={isLight ? "#dcfce7" : "rgba(16, 185, 129, 0.2)"}
                stroke={isLight ? "#bbf7d0" : "rgba(16, 185, 129, 0.4)"}
                strokeWidth="0.5"
              />
              <text
                x="169"
                y="15.5"
                textAnchor="middle"
                fill={isLight ? "#15803d" : "#a7f3d0"}
                fontFamily="monospace"
                fontSize="7.5"
                fontWeight="500"
              >
                HPA v2
              </text>
            </g>
          </g>
        </svg>

        {/* CSS Keyframes for animated dashes */}
        <style>{`
          @keyframes flowAnim {
            from {
              stroke-dashoffset: 60;
            }
            to {
              stroke-dashoffset: 0;
            }
          }
        `}</style>
      </div>

      {/* Floating Inspector HUD (Interactive telemetry inspection) */}
      <div
        className="mt-4 rounded-xl border border-hairline/90 bg-canvas-soft/90 backdrop-blur-md p-4 transition-all duration-300 text-xs shadow-sm"
        style={{
          borderTopColor: activeNode ? activeNode.accent : undefined,
          borderTopWidth: activeNode ? "2px" : undefined,
        }}
      >
        {activeNode ? (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink text-sm">{activeNode.title}</span>
                <span
                  className="font-mono text-[9px] px-2 py-0.5 rounded border"
                  style={{
                    backgroundColor: `${activeNode.accent}15`,
                    color: activeNode.accent,
                    borderColor: `${activeNode.accent}30`,
                  }}
                >
                  {activeNode.badge}
                </span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-canvas border border-hairline text-mute">
                  {activeNode.tag}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyPayload}
                  className="flex items-center gap-1 font-mono text-[10px] px-2 py-1 rounded bg-canvas border border-hairline hover:bg-canvas-soft text-mute hover:text-ink transition-colors cursor-pointer"
                  title="Copy telemetry payload"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>JSON</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-[11px] text-mute hover:text-ink transition-colors cursor-pointer px-1.5 py-0.5"
                >
                  ✕
                </button>
              </div>
            </div>
            <p className="text-mute text-[11px] leading-relaxed">{activeNode.role}</p>
            <div className="mt-1 p-2.5 rounded-lg bg-black/90 dark:bg-black font-mono text-[10.5px] border border-hairline/40 overflow-x-auto">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-800 text-[10px] text-zinc-400">
                <span>live-telemetry-stream.json</span>
                <span className="text-zinc-400">latency: 0.15ms</span>
              </div>
              <pre className="text-emerald-400 leading-relaxed">
                {JSON.stringify(activeNode.payload, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-mute text-[11px]">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: currentConfig.accent }} />
              <span>
                Click any pipeline node above to inspect live kernel telemetry, socket allocations & K8s patch manifests.
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px]">
              <div className="flex items-center gap-1 text-ink/70">
                <Cpu className="w-3 h-3 text-sky-400" />
                <span>EVAL: 15ms</span>
              </div>
              <div className="flex items-center gap-1 text-ink/70">
                <RefreshCw className="w-3 h-3 text-emerald-400" />
                <span>SYNC: &lt; 50ms</span>
              </div>
              <div className="flex items-center gap-1 text-ink/70">
                <Lock className="w-3 h-3 text-rose-400" />
                <span>ZERO-SIDECAR</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
