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
} from "lucide-react";

interface NodeDetail {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  role: string;
  payload: Record<string, unknown> | string;
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

  // State configurations
  const stateConfigs = [
    {
      id: 0,
      badge: "STABLE BASELINE",
      color: "emerald",
      label: "Steady State",
      sync: "REPLICAS: 3 / 12",
      logRate: "48 req/s",
      latency: "82ms",
      threats: "0 threats",
      narrative:
        "Normal traffic volume. Pod stdout streams parsed sub-millisecond via containerd socket. 3 pods serving steady 82ms SLA.",
      accent: "#10b981",
    },
    {
      id: 1,
      badge: "INGRESS SURGE DETECTED",
      color: "amber",
      label: "Traffic Spike",
      sync: "SPIKE PRE-EMPTED",
      logRate: "1.4k req/s",
      latency: "460ms (RISING)",
      threats: "0 threats",
      narrative:
        "Sudden traffic jump detected in access logs. LogStrata dispatches proactive scale event 18 seconds ahead of CPU threshold lag.",
      accent: "#f59e0b",
    },
    {
      id: 2,
      badge: "THREAT ANOMALY DETECTED",
      color: "rose",
      label: "DDoS / Brute Force",
      sync: "INGRESS DEFENSE ACTIVE",
      logRate: "2.8k req/s",
      latency: "210ms (MITIGATING)",
      threats: "1 attacker IP blocked",
      narrative:
        "High-velocity 401/403 credential scanning detected. Threat Shield locks scale-down and injects dynamic Ingress firewall drops.",
      accent: "#f43f5e",
    },
    {
      id: 3,
      badge: "REPLICAS EXPANDED & RECOVERED",
      color: "cyan",
      label: "Capacity Mutated",
      sync: "REPLICAS: 9 / 12",
      logRate: "1.4k req/s",
      latency: "105ms (RESTORED)",
      threats: "Isolated at Edge",
      narrative:
        "Kubernetes deployment successfully scaled to 9 replicas. Cluster latency normalized with zero dropped user requests.",
      accent: "#06b6d4",
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
      role: "Application instances streaming stdout directly to host containerd sockets.",
      payload: {
        namespace: "production",
        deployment: "commerce-frontend",
        currentReplicas: heroState === 3 ? 9 : 3,
        readyReplicas: heroState === 3 ? 9 : 3,
        containerRuntime: "containerd://1.7.15",
      },
    },
    logs: {
      id: "logs",
      title: "containerd Socket Stream",
      subtitle: "Socket: /run/containerd/containerd.sock",
      badge: heroState === 0 ? "48 lines/s" : heroState === 1 ? "1.4k lines/s" : "2.8k lines/s",
      role: "Zero-network socket tailer reading raw container stdout streams with sub-millisecond overhead.",
      payload: {
        source: "/var/log/pods/commerce-frontend-*/*.log",
        latency: "< 0.4ms",
        bufferAllocation: "64KB ring-buffer",
        status: "STREAMING_ACTIVE",
      },
    },
    engine: {
      id: "engine",
      title: "LogStrata Control Engine",
      subtitle: "Sub-ms Stream Parsing Core",
      badge: "Cycle: 15ms",
      role: "In-memory token analysis matching regular patterns, status code ratios, and threat signatures.",
      payload: {
        evaluationLoop: "15ms",
        activeModel: "Sliding-Window Transaction Rate (SWTR)",
        confidenceScore: 0.98,
        decision:
          heroState === 1
            ? "TRIGGER_PRE_EMPTIVE_SCALE_UP"
            : heroState === 2
            ? "ENGAGE_THREAT_LOCK_AND_INGRESS_DROP"
            : "MONITORING_BASELINE",
      },
    },
    metrics: {
      id: "metrics",
      title: "Performance Metrics Engine",
      subtitle: "Latency & RPS Profiler",
      badge: currentConfig.latency,
      role: "Computes real-time P95/P99 latency percentiles and transaction density per second.",
      payload: {
        currentRPS: heroState === 0 ? 48 : heroState === 1 ? 1420 : 2850,
        p95Latency: currentConfig.latency,
        errorRatePercent: heroState === 2 ? "18.4%" : "0.2%",
        trend: heroState === 1 ? "ACCELERATING" : "STABILIZED",
      },
    },
    security: {
      id: "security",
      title: "Threat Shield (SIEM)",
      subtitle: "Signature & Ingress Analytics",
      badge: currentConfig.threats,
      role: "Detects unauthorized brute-force spikes, token scanning, and application-layer DDoS floods.",
      payload: {
        threatLevel: heroState === 2 ? "CRITICAL" : "LOW",
        blockedIPs: heroState === 2 ? ["194.26.29.11", "45.154.255.8"] : [],
        scaleDownLock: heroState === 2 ? "ENGAGED" : "OFF",
        mitigationAction: heroState === 2 ? "INGRESS_WAF_REJECT" : "NONE",
      },
    },
    decision: {
      id: "decision",
      title: "Autoscaling Decision Controller",
      subtitle: "Reconciliation Loop",
      badge: heroState === 1 || heroState === 2 ? "Scale Target: 9" : "Scale Target: 3",
      role: "Evaluates workload capacity equations and threat profiles to determine target replica bounds.",
      payload: {
        algorithm: "Proactive-RPS-Target",
        desiredReplicas: heroState === 1 || heroState === 2 || heroState === 3 ? 9 : 3,
        stepRatio: "3.0x",
        k8sPatchStatus: heroState === 1 ? "DISPATCHED" : "SYNCHRONIZED",
      },
    },
    k8s: {
      id: "k8s",
      title: "Kubernetes API Server",
      subtitle: "Deployment Spec Mutator",
      badge: "API PATCH",
      role: "Receives atomic JSON patch requests and orchestrates ReplicaSet pod provisioning.",
      payload: {
        endpoint: "PATCH /apis/apps/v1/namespaces/default/deployments/commerce-frontend",
        appliedPatch: `{"spec":{"replicas":${heroState === 3 ? 9 : 3}}}`,
        responseTime: "12ms",
        clusterHealth: "100%",
      },
    },
  };

  const activeNode = selectedNode ? nodeDetails[selectedNode] : null;

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
          <Radio className="w-3.5 h-3.5 text-primary animate-pulse" />
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
      <div className="relative w-full rounded-xl bg-canvas/90 border border-hairline/70 p-2 sm:p-4 overflow-hidden">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(${isLight ? "#000" : "#fff"} 1px, transparent 1px)`,
            backgroundSize: "16px 16px",
          }}
        />

        <svg
          className="w-full h-auto overflow-visible"
          viewBox="0 0 520 380"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="LogStrata Log-Driven Autoscaling Pipeline"
        >
          <defs>
            {/* Laser trail glow filter */}
            <filter id="laser-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1.8 0" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Gradients */}
            <linearGradient id="stream-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>

            <linearGradient id="spike-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>

            <linearGradient id="threat-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>

            <linearGradient id="node-fill-dark" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#14171d" />
              <stop offset="100%" stopColor="#0c0e12" />
            </linearGradient>

            <linearGradient id="node-fill-light" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>
          </defs>

          {/* PATH CONNECTIONS */}
          <g id="pipeline-connections">
            {/* 1. Pods -> containerd socket */}
            <path
              d="M 260 52 L 260 76"
              stroke={isLight ? "#cbd5e1" : "#334155"}
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <path
              d="M 260 52 L 260 76"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="10 40"
              filter="url(#laser-glow)"
              className="flow-dash"
              style={{
                animation: `flowAnim ${heroState === 1 ? "1.2s" : "3s"} linear infinite`,
              }}
            />

            {/* 2. containerd socket -> LogStrata Engine */}
            <path
              d="M 260 114 L 260 138"
              stroke={isLight ? "#cbd5e1" : "#334155"}
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <path
              d="M 260 114 L 260 138"
              stroke={currentConfig.accent}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="12 40"
              filter="url(#laser-glow)"
              className="flow-dash"
              style={{
                animation: `flowAnim ${heroState === 1 ? "1.0s" : "2.5s"} linear infinite`,
              }}
            />

            {/* 3. LogStrata Engine -> Metrics Engine (Left Branch) */}
            <path
              d="M 210 184 C 210 206, 140 196, 140 218"
              fill="none"
              stroke={isLight ? "#cbd5e1" : "#334155"}
              strokeWidth="1.5"
            />
            <path
              d="M 210 184 C 210 206, 140 196, 140 218"
              fill="none"
              stroke={heroState === 1 ? "#f59e0b" : "#3b82f6"}
              strokeWidth="2"
              strokeDasharray="12 60"
              filter="url(#laser-glow)"
              style={{
                animation: `flowAnim ${heroState === 1 ? "1.2s" : "3.5s"} linear infinite`,
              }}
            />

            {/* 4. LogStrata Engine -> Threat Shield (Right Branch) */}
            <path
              d="M 310 184 C 310 206, 380 196, 380 218"
              fill="none"
              stroke={isLight ? "#cbd5e1" : "#334155"}
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
              stroke={isLight ? "#cbd5e1" : "#334155"}
              strokeWidth="1.5"
            />
            <path
              d="M 140 262 C 140 282, 220 274, 220 294"
              fill="none"
              stroke={currentConfig.accent}
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
              stroke={isLight ? "#cbd5e1" : "#334155"}
              strokeWidth="1.5"
            />
            <path
              d="M 380 262 C 380 282, 300 274, 300 294"
              fill="none"
              stroke={heroState === 2 ? "#f43f5e" : "#06b6d4"}
              strokeWidth="2"
              strokeDasharray="12 60"
              filter="url(#laser-glow)"
              style={{
                animation: "flowAnim 3s linear infinite",
              }}
            />

            {/* 7. Feedback scale loop: Decision -> Pods (Left Return Loop) */}
            <path
              d="M 170 325 C 50 325, 20 200, 20 120 C 20 40, 60 30, 160 30"
              fill="none"
              stroke={isLight ? "#e2e8f0" : "#1e293b"}
              strokeWidth="1.2"
              strokeDasharray="4 4"
            />
            {heroState === 3 && (
              <path
                d="M 170 325 C 50 325, 20 200, 20 120 C 20 40, 60 30, 160 30"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="20 80"
                filter="url(#laser-glow)"
                style={{
                  animation: "flowAnim 2.2s linear infinite",
                }}
              />
            )}
          </g>

          {/* SVG NODES */}
          {(() => {
            const nodeFill = isLight ? "url(#node-fill-light)" : "url(#node-fill-dark)";

            return (
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
                    fill={nodeFill}
                    stroke={
                      selectedNode === "pods"
                        ? "#3b82f6"
                        : heroState === 3
                        ? "#10b981"
                        : isLight
                        ? "#cbd5e1"
                        : "#1e293b"
                    }
                    strokeWidth={selectedNode === "pods" ? "2" : "1"}
                  />
                  <rect
                    x="8"
                    y="8"
                    width="28"
                    height="28"
                    rx="6"
                    fill={isLight ? "#eff6ff" : "rgba(59, 130, 246, 0.12)"}
                  />
                  <Server x="14" y="14" width="16" height="16" className="text-blue-500" />
                  <text
                    x="44"
                    y="20"
                    fill={isLight ? "#0f172a" : "#f1f5f9"}
                    fontSize="11"
                    fontWeight="600"
                  >
                    Kubernetes Workload Pods
                  </text>
                  <text
                    x="44"
                    y="32"
                    fill={isLight ? "#64748b" : "#94a3b8"}
                    fontFamily="monospace"
                    fontSize="8.5"
                  >
                    {heroState === 3 ? "Replicas: 9 / 12 (Scaled)" : "Replicas: 3 / 12 (Active)"}
                  </text>
                  <circle
                    cx="186"
                    cy="22"
                    r="4"
                    fill={heroState === 1 ? "#f59e0b" : "#10b981"}
                    className="animate-pulse"
                  />
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
                    rx="6"
                    fill={nodeFill}
                    stroke={selectedNode === "logs" ? "#06b6d4" : isLight ? "#cbd5e1" : "#1e293b"}
                    strokeWidth={selectedNode === "logs" ? "2" : "1"}
                  />
                  <rect
                    x="8"
                    y="8"
                    width="22"
                    height="22"
                    rx="4"
                    fill={isLight ? "#ecfeff" : "rgba(6, 182, 212, 0.12)"}
                  />
                  <Terminal x="12" y="12" width="14" height="14" className="text-cyan-500" />
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
                    fill={isLight ? "#64748b" : "#94a3b8"}
                    fontFamily="monospace"
                    fontSize="8"
                  >
                    rate: {currentConfig.logRate}
                  </text>
                </g>

                {/* 3. LogStrata Control Engine */}
                <g
                  transform="translate(150, 138)"
                  className="cursor-pointer group"
                  onClick={() => setSelectedNode(selectedNode === "engine" ? null : "engine")}
                >
                  <rect
                    x="0"
                    y="0"
                    width="220"
                    height="46"
                    rx="8"
                    fill={nodeFill}
                    stroke={
                      selectedNode === "engine"
                        ? "#00f0ff"
                        : currentConfig.accent
                    }
                    strokeWidth="1.5"
                  />
                  <rect
                    x="8"
                    y="9"
                    width="28"
                    height="28"
                    rx="6"
                    fill={isLight ? "#f0fdfa" : "rgba(20, 184, 166, 0.12)"}
                  />
                  <Activity x="14" y="15" width="16" height="16" className="text-teal-400" />
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
                    fill={nodeFill}
                    stroke={
                      selectedNode === "metrics"
                        ? "#f59e0b"
                        : heroState === 1
                        ? "#f59e0b"
                        : isLight
                        ? "#cbd5e1"
                        : "#1e293b"
                    }
                    strokeWidth="1"
                  />
                  <rect
                    x="8"
                    y="8"
                    width="28"
                    height="28"
                    rx="5"
                    fill={isLight ? "#fffbeb" : "rgba(245, 158, 11, 0.12)"}
                  />
                  <Zap x="14" y="14" width="16" height="16" className="text-amber-500" />
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
                    fill={isLight ? "#64748b" : "#94a3b8"}
                    fontFamily="monospace"
                    fontSize="8"
                  >
                    {currentConfig.latency}
                  </text>
                </g>

                {/* 5. Right Node: Security Analytics */}
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
                    fill={nodeFill}
                    stroke={
                      selectedNode === "security"
                        ? "#f43f5e"
                        : heroState === 2
                        ? "#f43f5e"
                        : isLight
                        ? "#cbd5e1"
                        : "#1e293b"
                    }
                    strokeWidth="1"
                  />
                  <rect
                    x="8"
                    y="8"
                    width="28"
                    height="28"
                    rx="5"
                    fill={isLight ? "#fef2f2" : "rgba(244, 63, 94, 0.12)"}
                  />
                  <Shield x="14" y="14" width="16" height="16" className="text-rose-500" />
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
                    fill={heroState === 2 ? "#f43f5e" : isLight ? "#64748b" : "#94a3b8"}
                    fontFamily="monospace"
                    fontSize="8"
                  >
                    {currentConfig.threats}
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
                    fill={nodeFill}
                    stroke={
                      selectedNode === "decision"
                        ? "#10b981"
                        : heroState === 3
                        ? "#10b981"
                        : isLight
                        ? "#cbd5e1"
                        : "#1e293b"
                    }
                    strokeWidth="1"
                  />
                  <rect
                    x="8"
                    y="8"
                    width="28"
                    height="28"
                    rx="6"
                    fill={isLight ? "#ecfdf5" : "rgba(16, 185, 129, 0.12)"}
                  />
                  <Layers x="14" y="14" width="16" height="16" className="text-emerald-500" />
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
                    fill={isLight ? "#64748b" : "#94a3b8"}
                    fontFamily="monospace"
                    fontSize="8.5"
                  >
                    {heroState === 1 || heroState === 2
                      ? "Target: 9 replicas (Scale Patch)"
                      : heroState === 3
                      ? "Target: 9 replicas (Active)"
                      : "Target: 3 replicas (Idle)"}
                  </text>
                </g>
              </g>
            );
          })()}
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

      {/* Floating Inspector HUD (Opens on node click or default summary) */}
      <div className="mt-4 rounded-xl border border-hairline/90 bg-canvas-soft/80 backdrop-blur-md p-3.5 transition-all duration-300 text-xs">
        {activeNode ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink">{activeNode.title}</span>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  {activeNode.badge}
                </span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-[10px] text-mute hover:text-ink transition-colors cursor-pointer"
              >
                Close Inspector ✕
              </button>
            </div>
            <p className="text-mute text-[11px] leading-relaxed">{activeNode.role}</p>
            <div className="mt-1 p-2 rounded-lg bg-black/80 dark:bg-black font-mono text-[10px] text-emerald-400 overflow-x-auto">
              <pre>{JSON.stringify(activeNode.payload, null, 2)}</pre>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-mute text-[11px]">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-primary" />
              <span>
                Tip: Click any component node in the diagram above to inspect live JSON telemetry and API payloads.
              </span>
            </div>
            <div className="font-mono text-[10px] text-ink/70">
              LOG RECONCILIATION: &lt; 50ms
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
