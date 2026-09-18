"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Play, Pause, Radio, Cpu, RefreshCw, Check, Copy } from "lucide-react";

import { PipelineNode, type PipelineNodeData } from "./PipelineNode";
import { AnimatedBeamEdge, type AnimatedBeamEdgeData } from "./AnimatedBeamEdge";

const nodeTypes: NodeTypes = {
  pipelineNode: PipelineNode,
};

const edgeTypes: EdgeTypes = {
  animatedBeam: AnimatedBeamEdge,
};

interface ScenarioConfig {
  id: number;
  badge: string;
  label: string;
  accent: string;
  narrative: string;
  latency: string;
  sync: string;
  replicas: string;
  logRate: string;
  threats: string;
}

const SCENARIOS: ScenarioConfig[] = [
  {
    id: 0,
    badge: "STABLE BASELINE",
    label: "Steady",
    accent: "#10b981", // Emerald
    narrative:
      "Normal traffic volume. Pod stdout parsed sub-millisecond via containerd socket. 3 pods serving steady 82ms SLA.",
    latency: "82ms",
    sync: "REPLICAS: 3 / 12",
    replicas: "3 / 12 (Active)",
    logRate: "48 req/s",
    threats: "0 threats",
  },
  {
    id: 1,
    badge: "TRAFFIC SPIKE DETECTED",
    label: "Traffic Spike",
    accent: "#f59e0b", // Amber
    narrative:
      "Sudden traffic jump detected in access logs. LogStrata dispatches proactive scale event 18s ahead of CPU threshold lag.",
    latency: "460ms (RISING)",
    sync: "SPIKE PRE-EMPTED",
    replicas: "Scale Target: 9",
    logRate: "1.4k req/s",
    threats: "0 threats",
  },
  {
    id: 2,
    badge: "THREAT MITIGATED",
    label: "DDoS",
    accent: "#f43f5e", // Rose
    narrative:
      "High-velocity 401/403 credential scanning detected. Threat Shield locks scale-down and injects dynamic Ingress firewall drops.",
    latency: "210ms (MITIGATING)",
    sync: "INGRESS DEFENSE ACTIVE",
    replicas: "Locked: 3 / 12",
    logRate: "2.8k req/s",
    threats: "1 attacker IP blocked",
  },
  {
    id: 3,
    badge: "CAPACITY MUTATED & RECOVERED",
    label: "Mutated",
    accent: "#06b6d4", // Cyan
    narrative:
      "Kubernetes deployment successfully expanded to 9 replicas. Cluster latency normalized with zero dropped requests.",
    latency: "105ms (RESTORED)",
    sync: "REPLICAS: 9 / 12",
    replicas: "9 / 12 (Active)",
    logRate: "1.4k req/s",
    threats: "Edge Filtered",
  },
];

export function HeroPipelineFlow() {
  const [scenarioIndex, setScenarioIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const current = SCENARIOS[scenarioIndex];

  // Auto-cycling timer between scenarios
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setTimeout(() => {
      setScenarioIndex((prev) => (prev + 1) % SCENARIOS.length);
    }, 5500);

    return () => clearTimeout(interval);
  }, [scenarioIndex, isPlaying]);

  // Construct Dynamic React Flow Nodes based on Scenario State
  const nodes = useMemo<Node[]>(() => {
    return [
      {
        id: "pods",
        type: "pipelineNode",
        position: { x: 140, y: 12 },
        data: {
          title: "Workload Pods",
          subtitle: "commerce-frontend",
          badge: current.replicas,
          tag: "cgroup v2",
          icon: "server",
          iconBg: "bg-indigo-500/10",
          iconColor: "text-indigo-400",
          statusDotColor: scenarioIndex === 1 ? "#f59e0b" : "#10b981",
          hasTopHandle: false,
          hasBottomHandle: true,
        } satisfies PipelineNodeData,
      },
      {
        id: "socket",
        type: "pipelineNode",
        position: { x: 140, y: 96 },
        data: {
          title: "containerd Socket",
          subtitle: "/run/containerd.sock",
          badge: `Rate: ${current.logRate}`,
          tag: "POSIX FIFO",
          icon: "terminal",
          iconBg: "bg-sky-500/10",
          iconColor: "text-sky-400",
          statusDotColor: "#0ea5e9",
          hasTopHandle: true,
          hasBottomHandle: true,
        } satisfies PipelineNodeData,
      },
      {
        id: "engine",
        type: "pipelineNode",
        position: { x: 140, y: 180 },
        data: {
          title: "LogStrata Engine",
          subtitle: "Sub-ms In-Memory Loop",
          badge:
            scenarioIndex === 0
              ? "Monitoring Baseline"
              : scenarioIndex === 1
              ? "Scale Event Dispatched"
              : scenarioIndex === 2
              ? "Threat Mitigation Active"
              : "Replicas Synchronized",
          tag: "15ms Loop",
          icon: "activity",
          iconBg:
            scenarioIndex === 1
              ? "bg-amber-500/15"
              : scenarioIndex === 2
              ? "bg-rose-500/15"
              : "bg-emerald-500/15",
          iconColor:
            scenarioIndex === 1
              ? "text-amber-400"
              : scenarioIndex === 2
              ? "text-rose-400"
              : "text-emerald-400",
          statusDotColor: current.accent,
          pulseGlow: scenarioIndex === 1,
          isAlert: scenarioIndex === 2,
          hasTopHandle: true,
          hasBottomHandle: true,
        } satisfies PipelineNodeData,
      },
      {
        id: "metrics",
        type: "pipelineNode",
        position: { x: 15, y: 265 },
        data: {
          title: "Metrics Engine",
          subtitle: "Latency & RPS Profiler",
          badge: `P95: ${current.latency}`,
          tag: "P95 SLA",
          icon: "zap",
          iconBg: "bg-amber-500/10",
          iconColor: "text-amber-400",
          statusDotColor: scenarioIndex === 1 ? "#f59e0b" : "#10b981",
          pulseGlow: scenarioIndex === 1,
          hasTopHandle: true,
          hasBottomHandle: false,
        } satisfies PipelineNodeData,
      },
      {
        id: "threat",
        type: "pipelineNode",
        position: { x: 265, y: 265 },
        data: {
          title: "Threat Shield",
          subtitle: "Signature & Ingress WAF",
          badge: current.threats,
          tag: "WAF",
          icon: "shield",
          iconBg: scenarioIndex === 2 ? "bg-rose-500/20" : "bg-zinc-800/80",
          iconColor: scenarioIndex === 2 ? "text-rose-400" : "text-zinc-400",
          statusDotColor: scenarioIndex === 2 ? "#f43f5e" : "#52525b",
          isAlert: scenarioIndex === 2,
          hasTopHandle: true,
          hasBottomHandle: false,
        } satisfies PipelineNodeData,
      },
    ];
  }, [scenarioIndex, current]);

  // Construct Dynamic React Flow Edges with Animated Gradient Beams
  const edges = useMemo<Edge[]>(() => {
    if (scenarioIndex === 1) {
      // Traffic Spike: Warm Amber & Red surges
      return [
        {
          id: "e-pods-socket",
          source: "pods",
          target: "socket",
          type: "animatedBeam",
          data: {
            gradientStartColor: "#f59e0b",
            gradientStopColor: "#ef4444",
            duration: 1.2,
          } satisfies AnimatedBeamEdgeData,
        },
        {
          id: "e-socket-engine",
          source: "socket",
          target: "engine",
          type: "animatedBeam",
          data: {
            gradientStartColor: "#ef4444",
            gradientStopColor: "#f59e0b",
            duration: 1.0,
          } satisfies AnimatedBeamEdgeData,
        },
        {
          id: "e-engine-metrics",
          source: "engine",
          target: "metrics",
          type: "animatedBeam",
          data: {
            gradientStartColor: "#f59e0b",
            gradientStopColor: "#ef4444",
            duration: 1.1,
          } satisfies AnimatedBeamEdgeData,
        },
        {
          id: "e-engine-threat",
          source: "engine",
          target: "threat",
          type: "animatedBeam",
          data: {
            gradientStartColor: "#71717a",
            gradientStopColor: "#52525b",
            duration: 3.5,
          } satisfies AnimatedBeamEdgeData,
        },
      ];
    }

    if (scenarioIndex === 2) {
      // DDoS / Attack: Threat Shield highlighted with Crimson Beams
      return [
        {
          id: "e-pods-socket",
          source: "pods",
          target: "socket",
          type: "animatedBeam",
          data: {
            gradientStartColor: "#f43f5e",
            gradientStopColor: "#e11d48",
            duration: 1.2,
          } satisfies AnimatedBeamEdgeData,
        },
        {
          id: "e-socket-engine",
          source: "socket",
          target: "engine",
          type: "animatedBeam",
          data: {
            gradientStartColor: "#e11d48",
            gradientStopColor: "#f43f5e",
            duration: 1.0,
          } satisfies AnimatedBeamEdgeData,
        },
        {
          id: "e-engine-metrics",
          source: "engine",
          target: "metrics",
          type: "animatedBeam",
          data: {
            gradientStartColor: "#71717a",
            gradientStopColor: "#52525b",
            duration: 3.5,
          } satisfies AnimatedBeamEdgeData,
        },
        {
          id: "e-engine-threat",
          source: "engine",
          target: "threat",
          type: "animatedBeam",
          data: {
            gradientStartColor: "#f43f5e",
            gradientStopColor: "#fb7185",
            duration: 0.9,
          } satisfies AnimatedBeamEdgeData,
        },
      ];
    }

    if (scenarioIndex === 3) {
      // Capacity Mutated: Reconciled Emerald & Cyan convergence
      return [
        {
          id: "e-pods-socket",
          source: "pods",
          target: "socket",
          type: "animatedBeam",
          data: {
            gradientStartColor: "#06b6d4",
            gradientStopColor: "#10b981",
            duration: 2.0,
          } satisfies AnimatedBeamEdgeData,
        },
        {
          id: "e-socket-engine",
          source: "socket",
          target: "engine",
          type: "animatedBeam",
          data: {
            gradientStartColor: "#10b981",
            gradientStopColor: "#06b6d4",
            duration: 1.8,
          } satisfies AnimatedBeamEdgeData,
        },
        {
          id: "e-engine-metrics",
          source: "engine",
          target: "metrics",
          type: "animatedBeam",
          data: {
            gradientStartColor: "#06b6d4",
            gradientStopColor: "#10b981",
            duration: 2.2,
          } satisfies AnimatedBeamEdgeData,
        },
        {
          id: "e-engine-threat",
          source: "engine",
          target: "threat",
          type: "animatedBeam",
          data: {
            gradientStartColor: "#06b6d4",
            gradientStopColor: "#8b5cf6",
            duration: 2.5,
          } satisfies AnimatedBeamEdgeData,
        },
      ];
    }

    // Default: State 0 (Steady State Baseline)
    return [
      {
        id: "e-pods-socket",
        source: "pods",
        target: "socket",
        type: "animatedBeam",
        data: {
          gradientStartColor: "#6366f1",
          gradientStopColor: "#0ea5e9",
          duration: 2.8,
        } satisfies AnimatedBeamEdgeData,
      },
      {
        id: "e-socket-engine",
        source: "socket",
        target: "engine",
        type: "animatedBeam",
        data: {
          gradientStartColor: "#0ea5e9",
          gradientStopColor: "#10b981",
          duration: 2.4,
        } satisfies AnimatedBeamEdgeData,
      },
      {
        id: "e-engine-metrics",
        source: "engine",
        target: "metrics",
        type: "animatedBeam",
        data: {
          gradientStartColor: "#10b981",
          gradientStopColor: "#f59e0b",
          duration: 3.0,
        } satisfies AnimatedBeamEdgeData,
      },
      {
        id: "e-engine-threat",
        source: "engine",
        target: "threat",
        type: "animatedBeam",
        data: {
          gradientStartColor: "#10b981",
          gradientStopColor: "#8b5cf6",
          duration: 3.2,
        } satisfies AnimatedBeamEdgeData,
      },
    ];
  }, [scenarioIndex]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
  }, []);

  const handleCopyTelemetry = () => {
    const payload = {
      scenario: current.badge,
      latency: current.latency,
      replicas: current.sync,
      logThroughput: current.logRate,
      activeThreats: current.threats,
      selectedNode: selectedNodeId || "all",
      pipelineStatus: "healthy",
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="w-full max-w-[540px] mx-auto rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden font-sans select-none flex flex-col"
      id="hero-pipeline-flow-container"
    >
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md">
        {/* Status Indicator & Scenario Title */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-2.5 w-2.5 items-center justify-center">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: current.accent }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ backgroundColor: current.accent }}
            />
          </div>
          <span className="font-mono text-[11px] font-bold tracking-wider uppercase text-zinc-200 truncate">
            {current.badge}
          </span>
        </div>

        {/* Pill-style Segmented Control / Tabs + Play/Pause */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {SCENARIOS.map((sc) => {
            const isActive = scenarioIndex === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => {
                  setScenarioIndex(sc.id);
                  setIsPlaying(false);
                }}
                className={`px-2.5 py-1 rounded-md font-mono text-[10px] uppercase tracking-wider transition-all duration-200 cursor-pointer border ${
                  isActive
                    ? "bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold shadow-sm"
                    : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800"
                }`}
              >
                {sc.id + 1}. {sc.label}
              </button>
            );
          })}

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pause auto sequence" : "Resume auto sequence"}
            className="p-1.5 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer ml-0.5"
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Context Banner below header */}
      <div className="px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-900/40 flex items-start gap-3 text-xs leading-relaxed">
        <div className="p-1 rounded-md bg-zinc-800/80 border border-zinc-700/60 shrink-0 mt-0.5">
          <Radio className="w-3.5 h-3.5 animate-pulse" style={{ color: current.accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-zinc-300 font-light text-[11.5px] leading-snug">
            {current.narrative}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-3 font-mono text-[10px] text-zinc-400 border-l border-zinc-800 pl-3 shrink-0">
          <div>
            <span className="text-zinc-400">LATENCY:</span>{" "}
            <span className="font-semibold text-zinc-200">{current.latency}</span>
          </div>
          <div>
            <span className="text-zinc-400">SYNC:</span>{" "}
            <span className="font-semibold text-zinc-200">{current.sync}</span>
          </div>
        </div>
      </div>

      {/* 3. Canvas Area: React Flow Canvas with Animated Beam Edges */}
      <div className="relative w-full h-[390px] bg-zinc-950 overflow-hidden">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeClick={onNodeClick}
            fitView
            fitViewOptions={{ padding: 0.12 }}
            zoomOnScroll={false}
            panOnDrag={false}
            nodesDraggable={false}
            preventScrolling={false}
            nodesConnectable={false}
            elementsSelectable={true}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              color="#27272a"
              gap={16}
              size={1}
              variant={BackgroundVariant.Dots}
            />
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      {/* 4. Footer HUD */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-zinc-400">
        <div className="flex items-center gap-3 font-mono text-[10.5px]">
          <div className="flex items-center gap-1 text-zinc-300">
            <Cpu className="w-3 h-3 text-sky-400" />
            <span>EVAL: 15ms</span>
          </div>
          <div className="flex items-center gap-1 text-zinc-300">
            <RefreshCw className="w-3 h-3 text-emerald-400" />
            <span>SYNC: &lt; 50ms</span>
          </div>
          <span className="border border-zinc-700 bg-zinc-800/80 text-zinc-300 px-1.5 py-0.5 rounded text-[9.5px]">
            ZERO-SIDECAR
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-400">
            Click nodes to inspect live telemetry
          </span>
          <button
            onClick={handleCopyTelemetry}
            className="flex items-center gap-1 font-mono text-[9.5px] px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer border border-zinc-700/60"
            title="Copy snapshot JSON"
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
        </div>
      </div>
    </div>
  );
}
