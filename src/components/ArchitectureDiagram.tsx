"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";

export function ArchitectureDiagram() {
  const [currentState, setCurrentState] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const isLight = mounted && resolvedTheme === "light";

  const setSimulationState = (state: number) => {
    setCurrentState(state);
  };

  const advanceSimulation = (state: number) => {
    const nextState = (state + 1) % 7;
    setSimulationState(nextState);

    const durations = [
      6000, // State 0 (Normal)
      4000, // State 1 (Latency Spike)
      4000, // State 2 (Error Spike)
      3500, // State 3 (Autoscale Trigger)
      3500, // State 4 (API Patch)
      5000, // State 5 (Pods Spin Up)
      6000, // State 6 (Stabilized)
    ];

    timerRef.current = setTimeout(() => advanceSimulation(nextState), durations[nextState]);
  };

  useEffect(() => {
    // Start automatic loop after 4 seconds of initial idle normal state
    timerRef.current = setTimeout(() => advanceSimulation(0), 4000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const triggerLatencySpike = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setSimulationState(1);
    timerRef.current = setTimeout(() => advanceSimulation(1), 4000);
  };

  // State-based content definitions
  const stateLabel =
    currentState === 0
      ? "SYS TOPOLOGY LOOP // STABLE"
      : currentState === 1
      ? "SYS TOPOLOGY LOOP // LATENCY SPIKE DETECTED"
      : currentState === 2
      ? "SYS TOPOLOGY LOOP // ERROR RATE INCREASING"
      : currentState === 3
      ? "SYS TOPOLOGY LOOP // CALCULATING SCALE FACTOR"
      : currentState === 4
      ? "SYS TOPOLOGY LOOP // KUBERNETES PATCH SUBMITTED"
      : currentState === 5
      ? "SYS TOPOLOGY LOOP // SPINNING UP REPLICAS"
      : "SYS TOPOLOGY LOOP // SYSTEM NORMALIZED";

  const statePingFill =
    currentState === 0
      ? "#10b981"
      : currentState === 1
      ? "#f59e0b"
      : currentState === 2
      ? "#e11d48"
      : currentState === 3
      ? "#3b82f6"
      : currentState === 4
      ? "#059669"
      : "#10b981";

  const topRate =
    currentState === 0
      ? "RATE: 12.4 kb/s"
      : currentState === 6
      ? "RATE: 12.8 kb/s"
      : "RATE: 38.6 kb/s";

  const topReplicas =
    currentState === 5 || currentState === 6 ? "REPLICAS: 9/12" : "REPLICAS: 3/12";

  // Pod space values
  const frontendReplicasText =
    currentState === 5 || currentState === 6 ? "replicas: 9" : "replicas: 3";
  const apiReplicasText =
    currentState === 5 || currentState === 6 ? "replicas: 9" : "replicas: 3";

  const frontHealthText =
    currentState === 2 || currentState === 3 || currentState === 4
      ? "health: 94.6%"
      : "health: 100%";
  const frontHealthColor =
    currentState === 2 || currentState === 3 || currentState === 4 ? "#e11d48" : "#10b981";

  const apiHealthText =
    currentState === 2 || currentState === 3 || currentState === 4
      ? "health: 93.8%"
      : "health: 100%";
  const apiHealthColor =
    currentState === 2 || currentState === 3 || currentState === 4 ? "#e11d48" : "#10b981";

  // Telemetry rates
  const clRateText = "rate: 42 evts/s";
  const ilRateText =
    currentState === 0
      ? "rate: 80 evts/s"
      : currentState === 6
      ? "rate: 90 evts/s"
      : "rate: 1.2k evts/s";
  const aeRateText =
    currentState === 2 || currentState === 3 || currentState === 4
      ? "rate: 180 evts/s"
      : "rate: 18 evts/s";

  // Observability metrics
  const throughputText =
    currentState === 0
      ? "140 requests/sec"
      : currentState === 6
      ? "162 requests/sec"
      : "1.2k requests/sec";

  const latencyText =
    currentState === 0
      ? "82ms (nominal)"
      : currentState === 6
      ? "118ms (nominal)"
      : "480ms (SPIKE ACTIVE)";
  const latencyColor = currentState === 0 || currentState === 6 ? "#10b981" : "#f59e0b";
  const latencyStroke = currentState === 0 || currentState === 6 ? "#10b981" : "#f59e0b";
  const latencyPathD =
    currentState === 0 || currentState === 6
      ? "M 115 32 L 122 28 L 130 26 L 138 24 L 145 30 L 152 29"
      : "M 115 32 L 122 20 L 130 14 L 138 8 L 145 6 L 152 4";

  const errorText =
    currentState === 2 || currentState === 3 || currentState === 4
      ? "5.4% (CRITICAL)"
      : currentState === 6
      ? "0.01% (nominal)"
      : "0.02% (nominal)";
  const errorColor =
    currentState === 2 || currentState === 3 || currentState === 4 ? "#e11d48" : "#10b981";
  const errorStroke =
    currentState === 2 || currentState === 3 || currentState === 4 ? "#e11d48" : "#10b981";
  const errorPathD =
    currentState === 2 || currentState === 3 || currentState === 4
      ? "M 115 28 L 122 20 L 130 14 L 138 8 L 145 6 L 152 4"
      : "M 115 28 L 122 28 L 130 26 L 138 28 L 145 28 L 152 28";

  // Decision & scaler status
  const decTriggerText =
    currentState === 0
      ? "Status: Normal operation"
      : currentState === 1
      ? "Evaluating latency threshold breach"
      : currentState === 2
      ? "Alert: Latency & HTTP 5xx error rate"
      : currentState === 3 || currentState === 4 || currentState === 5
      ? "Latency + Error Rate rules matched"
      : "Status: Within capacity bounds";

  const scalerFactorText =
    currentState === 0 || currentState === 1 || currentState === 2
      ? "Scale Factor: 1.0x (idle)"
      : "Scale Factor: 3.0x (limits unlocked)";

  const kubeRequestText =
    currentState === 4 || currentState === 5 || currentState === 6
      ? "PATCH commerce-frontend reps: 3 → 9"
      : "Request: None (Cluster synced)";

  const kubeStatusText =
    currentState === 4 || currentState === 5 || currentState === 6
      ? "Status: 202 Accepted (Patching replicas)"
      : "Status: 200 OK (Config active)";

  const feedbackAllocationText =
    currentState === 5 || currentState === 6
      ? "Pod Allocation: 9 running"
      : "Pod Allocation: 3 running";

  const feedbackStatusText =
    currentState === 5
      ? "System state: Syncing replica health"
      : currentState === 6
      ? "System state: HEALTHY (9 replicas)"
      : "System state: HEALTHY";

  // Widgets
  const widgetIngestVal =
    currentState === 0
      ? "2.84K"
      : currentState === 1
      ? "18.24K"
      : currentState === 2
      ? "24.50K"
      : currentState === 3
      ? "24.80K"
      : currentState === 4
      ? "24.10K"
      : currentState === 5
      ? "15.40K"
      : "3.12K";

  const widgetLatencyVal =
    currentState === 0
      ? "0.85s"
      : currentState === 1
      ? "1.12s"
      : currentState === 2 || currentState === 3 || currentState === 4
      ? "1.45s"
      : currentState === 5
      ? "0.98s"
      : "0.82s";

  const widgetLatencyBarWidth =
    currentState === 0
      ? "35%"
      : currentState === 1
      ? "65%"
      : currentState === 2 || currentState === 3 || currentState === 4
      ? "90%"
      : currentState === 5
      ? "45%"
      : "30%";

  const widgetLatencyBarClass =
    currentState === 0 || currentState === 5 || currentState === 6
      ? "bg-emerald-500"
      : currentState === 1
      ? "bg-amber-500"
      : "bg-rose-500";

  const widgetParseVal =
    currentState === 0
      ? "12.4 GB/s"
      : currentState === 1
      ? "38.6 GB/s"
      : currentState === 6
      ? "12.8 GB/s"
      : "42.1 GB/s";

  const widgetThreatVal =
    currentState === 2 || currentState === 3 || currentState === 4
      ? "1 active event"
      : "0 active events";

  const widgetThreatColorClass =
    currentState === 2 || currentState === 3 || currentState === 4
      ? "text-rose-500"
      : "text-emerald-400";

  const widgetThreatPingClass =
    currentState === 2 || currentState === 3 || currentState === 4
      ? "bg-rose-500"
      : "bg-emerald-400";

  const widgetThreatStatusText =
    currentState === 2 || currentState === 3 || currentState === 4
      ? "ALERT // ANOMALY BLOCKED"
      : "SECURE // AUDIT ACTIVE";

  // Flow classes mapping
  const isFlowAmber =
    currentState === 1 ||
    currentState === 2 ||
    currentState === 3 ||
    currentState === 4;
  const isFlowRose =
    currentState === 2 || currentState === 3 || currentState === 4;
  const isFlowEmerald =
    currentState === 3 ||
    currentState === 4 ||
    currentState === 5 ||
    currentState === 6;

  const pathFrontToIngressClass = isFlowAmber ? "path-flow-amber" : "";
  const pathIlToLatencyClass = isFlowAmber ? "path-flow-amber" : "";
  const pathLatencyToMetricClass = isFlowAmber ? "path-flow-amber" : "";
  const pathLatToAutoClass = isFlowAmber ? "path-flow-amber" : "";

  const pathApiToContainerClass = isFlowRose ? "path-flow-rose" : "";
  const pathAeToErrorClass = isFlowRose ? "path-flow-rose" : "";
  const pathErrorToMetricClass = isFlowRose ? "path-flow-rose" : "";
  const pathSatToAutoClass = isFlowRose ? "path-flow-rose" : "";

  const pathDecToAutoClass =
    currentState === 3 || currentState === 4 ? "path-flow-emerald" : "";
  const pathAutoToApiClass = currentState === 4 ? "path-flow-emerald" : "";
  const pathApiToFeedbackClass = currentState === 5 ? "path-flow-emerald" : "";
  const pathLoopFeedbackClass = currentState === 5 ? "path-flow-emerald" : "";

  // Nodes pulsing
  const nodeLatencyDetClass = isFlowAmber ? "pulse-amber" : "";
  const nodeLatencyMetricClass = isFlowAmber ? "pulse-amber" : "";

  const nodeErrorDetClass = isFlowRose ? "pulse-rose" : "";
  const nodeErrorMetricClass = isFlowRose ? "pulse-rose" : "";

  const nodeDecEngineClass =
    currentState === 3 || currentState === 4 ? "pulse-emerald" : "";
  const nodeAutoscalerClass =
    currentState === 3 || currentState === 4 ? "pulse-emerald" : "";

  const nodeKubeApiClass = currentState === 4 ? "pulse-emerald" : "";
  const nodeFeedbackClass = currentState === 5 ? "pulse-emerald" : "";

  const nodeFrontClass = currentState === 6 ? "pulse-emerald" : "";
  const nodeApiClass = currentState === 6 ? "pulse-emerald" : "";

  // Dynamic coordinates and colors for light vs dark theme
  const textX = 46;
  const textXLogs = 38;
  const yTitleLogs = showDetails ? 16 : 20;
  const ySecLogs = showDetails ? 28 : 32;
  const yTitleDet = showDetails ? 15 : 19;
  const ySecDet = showDetails ? 27 : 31;
  
  const colorTeal = isLight ? "#6366f1" : "#00f0ff";
  const colorEmerald = isLight ? "#7c3aed" : "#10b981";
  const colorBlue = isLight ? "#4f46e5" : "#3b82f6";
  const colorGreen = isLight ? "#6366f1" : "#059669";

  return (
    <div className={`w-full overflow-hidden border p-6 relative select-none transition-colors duration-300 ${isLight ? "bg-[#fcfcfd] border-zinc-200" : "bg-[#090b0f] border-zinc-800"}`}>
      {/* Corner Labels & Control Room Aesthetic */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <span className={`font-mono text-[10px] uppercase tracking-widest \${isLight ? "text-zinc-500" : "text-zinc-400"}`} id="state-label">
          {isLight && currentState === 0 ? "SYS TOPOLOGY LOOP // STABLE" : stateLabel}
        </span>
      </div>
      <div className="absolute top-4 right-4 flex items-center gap-3 font-mono text-[9px]">
        <button
          onClick={() => setShowDetails(d => !d)}
          id="btn-toggle-details"
          className={`rounded-[4px] px-2.5 py-1 font-mono text-[9px] cursor-pointer transition-colors focus:outline-none focus:ring-1 ${
            showDetails
              ? isLight
                ? "border border-indigo-300 bg-indigo-50 text-indigo-700 focus:ring-indigo-500"
                : "bg-zinc-700/60 text-zinc-200 border border-zinc-600 focus:ring-zinc-400"
              : isLight
              ? "border border-zinc-300 bg-white text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 focus:ring-zinc-400"
              : "bg-zinc-800/40 hover:bg-zinc-700/50 text-zinc-500 hover:text-zinc-300 border border-zinc-700 focus:ring-zinc-500"
          }`}
        >
          {showDetails ? "⊟ COMPACT" : "⊞ DETAILS"}
        </button>
        <button
          onClick={triggerLatencySpike}
          id="btn-trigger-simulation"
          className={`rounded-[4px] px-2.5 py-1 font-mono text-[9px] cursor-pointer transition-colors focus:outline-none focus:ring-1 ${
            isLight
              ? "border border-purple-200 bg-white text-purple-600 hover:bg-purple-50 hover:border-purple-300 focus:ring-purple-500"
              : "bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 text-rose-400 border border-rose-500/30 focus:ring-rose-500"
          }`}
        >
          ⚡ TRIGGER
        </button>
        <span className="text-zinc-500">•</span>
        <span className="text-zinc-500" id="top-rate">
          {topRate}
        </span>
        <span className="text-zinc-500">•</span>
        <span className="text-zinc-500" id="top-replicas">
          {topReplicas}
        </span>
      </div>

      <div className="mt-8 flex justify-center">
        <svg
          className="w-full max-w-[900px] h-auto"
          viewBox="0 0 960 700"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="LogStrata Interactive Workflow Topology"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="diagram-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke={isLight ? "#f1f5f9" : "#111521"} strokeWidth="0.8" />
            </pattern>
            {/* ── Clip paths for every standard node size ── */}
            <clipPath id="clip-165x58"><rect x="0" y="0" width="165" height="58" /></clipPath>
            <clipPath id="clip-155x52"><rect x="0" y="0" width="155" height="52" /></clipPath>
            <clipPath id="clip-135x48"><rect x="0" y="0" width="135" height="48" /></clipPath>
            <clipPath id="clip-150x48"><rect x="0" y="0" width="150" height="48" /></clipPath>
            <clipPath id="clip-130x46"><rect x="0" y="0" width="130" height="46" /></clipPath>
            <clipPath id="clip-150x46"><rect x="0" y="0" width="150" height="46" /></clipPath>
            <clipPath id="clip-165x50"><rect x="0" y="0" width="165" height="50" /></clipPath>
            <clipPath id="clip-300x60"><rect x="0" y="0" width="300" height="60" /></clipPath>
          </defs>

          {/* Draw Grid */}
          <rect width="100%" height="100%" fill="url(#diagram-grid)" />

          {/* ==================== LOGICAL BACKDROP REGIONS ==================== */}

          {/* Backdrop 1: Workload Surface */}
          <g className="backdrop-group opacity-45">
            <rect
              x="35"
              y="35"
              width="405"
              height="215"
              rx="8"
              fill={isLight ? "#f8fafc" : "#0c1017"}
              fillOpacity={isLight ? "0.4" : "0.3"}
              stroke={isLight ? "#cbd5e1" : "#222b3c"}
              strokeWidth="1.2"
              strokeDasharray="4,4"
            />
            <text
              x="45"
              y="52"
              fill={isLight ? "#94a3b8" : "#52525b"}
              fontFamily="monospace"
              fontSize="8"
              fontWeight="bold"
              letterSpacing="0.1em"
            >
              CLUSTER // WORKLOAD SURFACE
            </text>
          </g>

          {/* Backdrop 2: Ingestion & Analysis Edge */}
          <g className="backdrop-group opacity-45">
            <rect
              x="465"
              y="35"
              width="465"
              height="325"
              rx="8"
              fill={isLight ? "#f8fafc" : "#0c1017"}
              fillOpacity={isLight ? "0.4" : "0.3"}
              stroke={isLight ? "#cbd5e1" : "#222b3c"}
              strokeWidth="1.2"
              strokeDasharray="4,4"
            />
            <text
              x="475"
              y="52"
              fill={isLight ? "#94a3b8" : "#52525b"}
              fontFamily="monospace"
              fontSize="8"
              fontWeight="bold"
              letterSpacing="0.1em"
            >
              TELEMETRY // INGESTION &amp; ANALYSIS EDGE
            </text>
          </g>

          {/* Backdrop 3: Metrics Stream Observability */}
          <g className="backdrop-group opacity-45">
            <rect
              x="35"
              y="275"
              width="405"
              height="185"
              rx="8"
              fill={isLight ? "#f8fafc" : "#0c1017"}
              fillOpacity={isLight ? "0.4" : "0.3"}
              stroke={isLight ? "#cbd5e1" : "#222b3c"}
              strokeWidth="1.2"
              strokeDasharray="4,4"
            />
            <text
              x="45"
              y="292"
              fill={isLight ? "#94a3b8" : "#52525b"}
              fontFamily="monospace"
              fontSize="8"
              fontWeight="bold"
              letterSpacing="0.1em"
            >
              METRICS // STREAM OBSERVABILITY
            </text>
          </g>

          {/* Backdrop 4: Control Plane // Autoscale Engine */}
          <g className="backdrop-group opacity-45">
            <rect
              x="35"
              y="480"
              width="895"
              height="195"
              rx="8"
              fill={isLight ? "#f8fafc" : "#0c1017"}
              fillOpacity={isLight ? "0.4" : "0.3"}
              stroke={isLight ? "#cbd5e1" : "#222b3c"}
              strokeWidth="1.2"
              strokeDasharray="4,4"
            />
            <text
              x="45"
              y="497"
              fill={isLight ? "#94a3b8" : "#52525b"}
              fontFamily="monospace"
              fontSize="8"
              fontWeight="bold"
              letterSpacing="0.1em"
            >
              CONTROL PLANE // AUTOSCALE ENGINE
            </text>
          </g>

          {/* ==================== ORGANIC CURVED BEZIER CONNECTIONS ==================== */}

          {/* Pods (Left-top) to Ingestion Edge (Right-top) */}
          <path
            id="path-front-to-container"
            d="M 215 99 Q 355 80 495 89"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            className="transition-all duration-300"
          />
          <path
            id="path-front-to-ingress"
            d="M 215 99 Q 440 60 670 99"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            className={`transition-all duration-300 ${pathFrontToIngressClass}`}
          />

          {/* API to Container Logs & Security Events */}
          <path
            id="path-api-to-container"
            d="M 415 114 Q 455 100 495 89"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            className={`transition-all duration-300 ${pathApiToContainerClass}`}
          />
          <path
            id="path-api-to-security"
            d="M 415 114 Q 465 140 515 159"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            className="transition-all duration-300"
          />

          {/* Worker to Container Logs & Application Events */}
          <path
            id="path-worker-to-container"
            d="M 215 191 Q 355 130 495 89"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            className="transition-all duration-300"
          />
          <path
            id="path-worker-to-app"
            d="M 215 191 Q 450 180 690 169"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            className="transition-all duration-300"
          />

          {/* Database to Container Logs & Application Events */}
          <path
            id="path-db-to-container"
            d="M 415 201 Q 455 140 495 89"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            className="transition-all duration-300"
          />
          <path
            id="path-db-to-app"
            d="M 415 201 Q 550 185 690 169"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            className="transition-all duration-300"
          />

          {/* Ingestion Edge (Right-top) to Analysis Engine (Right-mid) */}
          <path
            id="path-cl-to-pattern"
            d="M 562.5 113 L 555 220"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            className="transition-all duration-300"
          />
          <path
            id="path-cl-to-latency"
            d="M 562.5 113 Q 630 160 700 225"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            className={`transition-all duration-300 ${pathIlToLatencyClass}`}
          />

          {/* Ingress Logs -> Latency Detection & Error Detection */}
          <path
            id="path-il-to-latency"
            d="M 737.5 123 L 700 225"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            className={`transition-all duration-300 ${pathIlToLatencyClass}`}
          />
          <path
            id="path-il-to-error"
            d="M 737.5 123 L 845 215"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            className="transition-all duration-300"
          />

          {/* Security Events -> Anomaly Detection & Threat Detection */}
          <path
            id="path-se-to-anomaly"
            d="M 582.5 183 L 600 295"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            className="transition-all duration-300"
          />
          <path
            id="path-se-to-threat"
            d="M 582.5 183 Q 680 230 780 295"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            className="transition-all duration-300"
          />

          {/* Application Events -> Error Detection & Anomaly Detection */}
          <path
            id="path-ae-to-error"
            d="M 757.5 193 L 845 215"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            className={`transition-all duration-300 ${pathAeToErrorClass}`}
          />
          <path
            id="path-ae-to-anomaly"
            d="M 757.5 193 L 600 295"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            className="transition-all duration-300"
          />

          {/* Analysis Engine (Right-mid) to Metrics Stream (Left-mid) */}
          <path
            id="path-pattern-to-throughput"
            d="M 490 243 Q 350 280 225 335"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            className="transition-all duration-300"
          />
          <path
            id="path-latency-to-latmetric"
            d="M 635 248 Q 430 320 225 410"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            className={`transition-all duration-300 ${pathLatencyToMetricClass}`}
          />
          <path
            id="path-error-to-errmetric"
            d="M 780 238 Q 600 280 415 340"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            className={`transition-all duration-300 ${pathErrorToMetricClass}`}
          />
          <path
            id="path-anomaly-to-satmetric"
            d="M 535 318 Q 475 360 415 410"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            className="transition-all duration-300"
          />
          <path
            id="path-threat-to-satmetric"
            d="M 715 318 Q 565 360 415 410"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            className="transition-all duration-300"
          />

          {/* Metrics Stream (Left-mid) to Control Plane (Bottom-center) */}
          <path
            id="path-through-to-dec"
            d="M 142.5 360 L 210 515"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            className="transition-all duration-300"
          />
          <path
            id="path-err-to-dec"
            d="M 332.5 365 L 210 515"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            className="transition-all duration-300"
          />
          <path
            id="path-lat-to-auto"
            d="M 142.5 435 Q 370 480 610 515"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            className={`transition-all duration-300 ${pathLatToAutoClass}`}
          />
          <path
            id="path-sat-to-auto"
            d="M 332.5 435 L 610 515"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            className={`transition-all duration-300 ${pathSatToAutoClass}`}
          />

          {/* Decision Engine to Autoscaler link */}
          <path
            id="path-dec-to-auto"
            d="M 360 545 L 460 545"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            strokeDasharray="4,4"
            className={`transition-all duration-300 ${pathDecToAutoClass}`}
          />

          {/* Control Plane Nodes link */}
          <path
            id="path-auto-to-api"
            d="M 610 575 Q 440 610 270 595"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            strokeDasharray="2,2"
            className={`transition-all duration-300 ${pathAutoToApiClass}`}
          />
          <path
            id="path-api-to-feedback"
            d="M 420 625 L 520 625"
            stroke={isLight ? "#e2e8f0" : "#1f293d"}
            strokeWidth="1.5"
            className={`transition-all duration-300 ${pathApiToFeedbackClass}`}
          />

          {/* PREDICTIVE FEEDBACK LOOP */}
          <path
            id="path-loop-feedback"
            d="M 820 625 C 970 625 970 20 440 20 C 240 20 130 50 50 99"
            stroke={isLight ? "#cbd5e1" : "#1f293d"}
            strokeWidth="1.25"
            strokeDasharray="6,6"
            className={`transition-all duration-300 ${pathLoopFeedbackClass}`}
          />

          {/* ==================== ANIMATED SIGNAL DOTS ==================== */}
          <g id="telemetry-pulses">
            <circle id="pulse-front-ingress" r="2.5" fill="#00f0ff" className="particle pointer-events-none mix-blend-mode-screen">
              <animateMotion dur="2.2s" repeatCount="indefinite">
                <mpath href="#path-front-to-ingress" />
              </animateMotion>
            </circle>
            <circle id="pulse-api-security" r="2.5" fill="#e11d48" className="particle pointer-events-none mix-blend-mode-screen">
              <animateMotion dur="3s" repeatCount="indefinite">
                <mpath href="#path-api-to-security" />
              </animateMotion>
            </circle>
            <circle id="pulse-cl-latency" r="2.5" fill="#00f0ff" className="particle pointer-events-none mix-blend-mode-screen">
              <animateMotion dur="2.5s" repeatCount="indefinite">
                <mpath href="#path-cl-to-latency" />
              </animateMotion>
            </circle>
            <circle id="pulse-il-error" r="2.5" fill="#f59e0b" className="particle pointer-events-none mix-blend-mode-screen">
              <animateMotion dur="2.8s" repeatCount="indefinite">
                <mpath href="#path-il-to-error" />
              </animateMotion>
            </circle>
            <circle id="pulse-lat-metric" r="2.5" fill="#3b82f6" className="particle pointer-events-none mix-blend-mode-screen">
              <animateMotion dur="3.2s" repeatCount="indefinite">
                <mpath href="#path-latency-to-latmetric" />
              </animateMotion>
            </circle>
            <circle id="pulse-auto-decision" r="3" fill="#10b981" className="particle pointer-events-none mix-blend-mode-screen">
              <animateMotion dur="2s" repeatCount="indefinite">
                <mpath href="#path-sat-to-auto" />
              </animateMotion>
            </circle>
            <circle id="pulse-api-patch" r="3.5" fill="#10b981" className="particle pointer-events-none mix-blend-mode-screen">
              <animateMotion dur="1.5s" repeatCount="indefinite">
                <mpath href="#path-auto-to-api" />
              </animateMotion>
            </circle>
            <circle id="pulse-feedback-loop" r="3" fill="#059669" className="particle pointer-events-none mix-blend-mode-screen">
              <animateMotion dur="4s" repeatCount="indefinite">
                <mpath href="#path-loop-feedback" />
              </animateMotion>
            </circle>
          </g>

          {/* ==================== TOPOLOGY NODES ==================== */}

          {/* Frontend Service */}
          <g transform="translate(50, 70)" className="cursor-pointer group select-none">
            <rect
              id="node-rect-frontend"
              x="0"
              y="0"
              width="165"
              height="58"
              rx="6"
              fill={isLight ? "#f8fafc" : "#0a0b0d"}
              stroke={isLight ? "#e2e8f0" : "#1f293d"}
              strokeWidth="1.5"
              style={{
                filter: isLight ? "drop-shadow(0 1px 3px rgba(0,0,0,0.05))" : "none",
                transition: "stroke 0.2s ease, filter 0.2s ease",
              }}
              className={`transition-all duration-200 ${nodeFrontClass}`}
            />
            <g>
              <rect x="10" y="15" width="28" height="28" rx="6" fill={isLight ? "#eff6ff" : "rgba(59, 130, 246, 0.08)"} stroke={isLight ? "#bfdbfe" : "rgba(59, 130, 246, 0.2)"} strokeWidth="1" />
              <g stroke={isLight ? "#2563eb" : "#60a5fa"} strokeWidth="1.25" fill="none">
                <circle cx="24" cy="29" r="7" />
                <ellipse cx="24" cy="29" rx="2.2" ry="7" />
                <line x1="17" y1="29" x2="31" y2="29" />
              </g>
            </g>
            <circle cx="6" cy="29" r="3" display="none" />
            <text x={textX} y={20} fill={isLight ? "#0f172a" : "#fafafa"} fontFamily="sans-serif" fontSize="10" fontWeight="bold">
              Frontend Service
            </text>
            <text x={textX} y="34" fill={frontHealthColor} fontFamily="monospace" fontSize="8" id="val-frontend-health">
              {frontHealthText}
            </text>
            {showDetails && (
              <text x={textX} y="46" fill={isLight ? "#64748b" : "#71717a"} fontFamily="monospace" fontSize="8" id="val-frontend-replicas">
                {frontendReplicasText}
              </text>
            )}
            <circle cx="152" cy="20" r="3" fill={frontHealthColor} id="dot-frontend-health" />
            <circle cx="82.5" cy="58" r="3" display="none" />
          </g>

          {/* API Service */}
          <g transform="translate(250, 85)" className="cursor-pointer group select-none">
            <rect
              id="node-rect-api"
              x="0"
              y="0"
              width="165"
              height="58"
              rx="6"
              fill={isLight ? "#f8fafc" : "#0a0b0d"}
              stroke={isLight ? "#e2e8f0" : "#1f293d"}
              strokeWidth="1.5"
              style={{
                filter: isLight ? "drop-shadow(0 1px 3px rgba(0,0,0,0.05))" : "none",
                transition: "stroke 0.2s ease, filter 0.2s ease",
              }}
              className={`transition-all duration-200 ${nodeApiClass}`}
            />
            <g>
              <rect x="10" y="15" width="28" height="28" rx="6" fill={isLight ? "#eff6ff" : "rgba(59, 130, 246, 0.08)"} stroke={isLight ? "#bfdbfe" : "rgba(59, 130, 246, 0.2)"} strokeWidth="1" />
              <g stroke={isLight ? "#2563eb" : "#60a5fa"} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <path d="M 20 26 L 17 29 L 20 32 M 28 26 L 31 29 L 28 32" />
                <line x1="26" y1="25" x2="22" y2="33" />
              </g>
            </g>
            <circle cx="6" cy="29" r="3" display="none" />
            <text x={textX} y="20" fill={isLight ? "#0f172a" : "#fafafa"} fontFamily="sans-serif" fontSize="10" fontWeight="bold">
              API Service
            </text>
            <text x={textX} y="34" fill={apiHealthColor} fontFamily="monospace" fontSize="8" id="val-api-health">
              {apiHealthText}
            </text>
            {showDetails && (
              <text x={textX} y="46" fill={isLight ? "#64748b" : "#71717a"} fontFamily="monospace" fontSize="8" id="val-api-replicas">
                {apiReplicasText}
              </text>
            )}
            <circle cx="152" cy="20" r="3" fill={apiHealthColor} id="dot-api-health" />
            <circle cx="82.5" cy="58" r="3" display="none" />
          </g>

          {/* Worker Service */}
          <g transform="translate(60, 165)" className="cursor-pointer group select-none">
            <rect
              id="node-rect-worker"
              x="0"
              y="0"
              width="155"
              height="52"
              rx="6"
              fill={isLight ? "#f8fafc" : "#0a0b0d"}
              stroke={isLight ? "#e2e8f0" : "#1f293d"}
              strokeWidth="1.5"
              style={{
                filter: isLight ? "drop-shadow(0 1px 3px rgba(0,0,0,0.05))" : "none",
                transition: "stroke 0.2s ease, filter 0.2s ease",
              }}
              className="transition-all duration-200"
            />
            <g>
              <rect x="10" y="12" width="28" height="28" rx="6" fill={isLight ? "#eff6ff" : "rgba(59, 130, 246, 0.08)"} stroke={isLight ? "#bfdbfe" : "rgba(59, 130, 246, 0.2)"} strokeWidth="1" />
              <g stroke={isLight ? "#2563eb" : "#60a5fa"} strokeWidth="1.25" fill="none" strokeLinecap="round">
                <circle cx="24" cy="26" r="3.5" />
                <path d="M24 20 v2 M24 30 v2 M18 26 h2 M28 26 h2 M20 22 l1.5 1.5 M26.5 28.5 l1.5 1.5 M20 30 l1.5 -1.5 M26.5 22 l1.5 -1.5" />
              </g>
            </g>
            <circle cx="6" cy="26" r="3" display="none" />
            <text x={textX} y={20} fill={isLight ? "#0f172a" : "#fafafa"} fontFamily="sans-serif" fontSize="10" fontWeight="bold">
              Worker Service
            </text>
            <text x={textX} y="32" fill="#10b981" fontFamily="monospace" fontSize="8">
              health: 100%
            </text>
            {showDetails && (
              <text x={textX} y="44" fill={isLight ? "#64748b" : "#71717a"} fontFamily="monospace" fontSize="8">replicas: 5</text>
            )}
            <circle cx="142" cy="20" r="3" fill="#10b981" />
            <circle cx="77.5" cy="52" r="3" display="none" />
          </g>

          {/* Database Node */}
          <g transform="translate(260, 175)" className="cursor-pointer group select-none">
            <rect
              id="node-rect-db"
              x="0"
              y="0"
              width="155"
              height="52"
              rx="6"
              fill={isLight ? "#f8fafc" : "#0a0b0d"}
              stroke={isLight ? "#818cf8" : "#10b981"}
              strokeWidth="1.5"
              style={{
                filter: isLight ? "drop-shadow(0 1px 3px rgba(0,0,0,0.05))" : "none",
                transition: "stroke 0.2s ease, filter 0.2s ease",
              }}
              className="transition-all duration-200"
            />
            <g>
              <rect x="10" y="12" width="28" height="28" rx="6" fill={isLight ? "#eef2ff" : "rgba(99, 102, 241, 0.08)"} stroke={isLight ? "#c7d2fe" : "rgba(99, 102, 241, 0.2)"} strokeWidth="1" />
              <g stroke={isLight ? "#4f46e5" : "#818cf8"} strokeWidth="1.25" fill="none">
                <ellipse cx="24" cy="21" rx="6" ry="1.8" />
                <path d="M 18 21 V 25.5 C 18 27, 30 27, 30 25.5 V 21" />
                <path d="M 18 25.5 V 30 C 18 31.5, 30 31.5, 30 30 V 25.5" />
              </g>
            </g>
            <circle cx="6" cy="26" r="3" display="none" />
            <text x={textX} y={20} fill={isLight ? "#0f172a" : "#fafafa"} fontFamily="sans-serif" fontSize="10" fontWeight="bold">
              Database (Postgres)
            </text>
            <text x={textX} y="32" fill="#10b981" fontFamily="monospace" fontSize="8">
              Primary mode
            </text>
            {showDetails && (
              <text x={textX} y="44" fill={isLight ? "#64748b" : "#71717a"} fontFamily="monospace" fontSize="8">active conns: 42</text>
            )}
            <circle cx="142" cy="20" r="3" fill="#10b981" />
            <circle cx="77.5" cy="52" r="3" display="none" />
          </g>

          {/* Container Logs */}
          <g transform="translate(495, 65)" className="cursor-pointer group select-none">
            <rect
              id="node-rect-container-logs"
              x="0"
              y="0"
              width="135"
              height="48"
              rx="5"
              fill={isLight ? "#f8fafc" : "#0a0b0d"}
              stroke={isLight ? "#e2e8f0" : "#1f293d"}
              strokeWidth="1.5"
              style={{
                filter: isLight ? "drop-shadow(0 1px 3px rgba(0,0,0,0.05))" : "none",
                transition: "stroke 0.2s ease, filter 0.2s ease",
              }}
              className="transition-all duration-200"
            />
            <g transform="translate(-2, 0)">
              <rect x="8" y="10" width="28" height="28" rx="6" fill={isLight ? "#ecfeff" : "rgba(6, 182, 212, 0.08)"} stroke={isLight ? "#a5f3fc" : "rgba(6, 182, 212, 0.2)"} strokeWidth="1" />
              <g stroke={isLight ? "#0891b2" : "#22d3ee"} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <path d="M 16 19 H 24 L 28 23 V 29 H 16 Z" />
                <path d="M 24 19 V 23 H 28" />
              </g>
            </g>
            <circle cx="67.5" cy="0" r="2.5" display="none" />
            <text x={textXLogs} y={yTitleLogs} fill={isLight ? "#0f172a" : "#fafafa"} fontFamily="sans-serif" fontSize="9" fontWeight="bold">
              Container Logs
            </text>
            <text x={textXLogs} y={ySecLogs} fill={isLight ? "#64748b" : "#71717a"} fontFamily="monospace" fontSize="8" id="val-logs-rate-cl">
              {clRateText}
            </text>
            {showDetails && (
              <text x={textXLogs} y="38" fill={isLight ? "#6366f1" : "#22d3ee"} fontFamily="monospace" fontSize="7">/var/log/pods/*.log</text>
            )}
            <circle cx="67.5" cy="48" r="2.5" display="none" />
          </g>

          {/* Ingress Logs */}
          <g transform="translate(670, 75)" className="cursor-pointer group select-none">
            <rect
              id="node-rect-ingress-logs"
              x="0"
              y="0"
              width="135"
              height="48"
              rx="5"
              fill={isLight ? "#f8fafc" : "#0a0b0d"}
              stroke={isLight ? "#e2e8f0" : "#1f293d"}
              strokeWidth="1.5"
              style={{
                filter: isLight ? "drop-shadow(0 1px 3px rgba(0,0,0,0.05))" : "none",
                transition: "stroke 0.2s ease, filter 0.2s ease",
              }}
              className="transition-all duration-200"
            />
            <g transform="translate(-2, 0)">
              <rect x="8" y="10" width="28" height="28" rx="6" fill={isLight ? "#ecfeff" : "rgba(6, 182, 212, 0.08)"} stroke={isLight ? "#a5f3fc" : "rgba(6, 182, 212, 0.2)"} strokeWidth="1" />
              <g stroke={isLight ? "#0891b2" : "#22d3ee"} strokeWidth="1.25" strokeLinecap="round" fill="none">
                <path d="M 16 21 H 20 C 22 21, 22 27, 24 27 H 28" />
                <path d="M 16 27 H 20 C 22 27, 22 21, 24 21 H 28" />
                <path d="M 26 18 L 29 21 L 26 24 M 26 24 L 29 27 L 26 30" />
              </g>
            </g>
            <circle cx="67.5" cy="0" r="2.5" display="none" />
            <text x={textXLogs} y={yTitleLogs} fill={isLight ? "#0f172a" : "#fafafa"} fontFamily="sans-serif" fontSize="9" fontWeight="bold">
              Ingress Logs
            </text>
            <text x={textXLogs} y={ySecLogs} fill={isLight ? "#64748b" : "#71717a"} fontFamily="monospace" fontSize="8" id="val-logs-rate-il">
              {ilRateText}
            </text>
            {showDetails && (
              <text x={textXLogs} y="38" fill={isLight ? "#6366f1" : "#22d3ee"} fontFamily="monospace" fontSize="7">nginx-ingress-*:stdout</text>
            )}
            <circle cx="67.5" cy="48" r="2.5" display="none" />
          </g>

          {/* Security Events */}
          <g transform="translate(515, 135)" className="cursor-pointer group select-none">
            <rect
              id="node-rect-security-logs"
              x="0"
              y="0"
              width="135"
              height="48"
              rx="5"
              fill={isLight ? "#f8fafc" : "#0a0b0d"}
              stroke={isLight ? "#e2e8f0" : "#1f293d"}
              strokeWidth="1.5"
              style={{
                filter: isLight ? "drop-shadow(0 1px 3px rgba(0,0,0,0.05))" : "none",
                transition: "stroke 0.2s ease, filter 0.2s ease",
              }}
              className="transition-all duration-200"
            />
            <g transform="translate(-2, 0)">
              <rect x="8" y="10" width="28" height="28" rx="6" fill={isLight ? "#fff1f2" : "rgba(225, 29, 72, 0.08)"} stroke={isLight ? "#fecdd3" : "rgba(225, 29, 72, 0.2)"} strokeWidth="1" />
              <g stroke={isLight ? "#e11d48" : "#fb7185"} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <path d="M 16 19 C 16 19, 22 17, 22 17 C 22 17, 28 19, 28 19 V 23 C 28 27, 22 30, 22 30 C 22 30, 16 27, 16 23 Z" />
              </g>
            </g>
            <circle cx="67.5" cy="0" r="2.5" display="none" />
            <text x={textXLogs} y={yTitleLogs} fill={isLight ? "#0f172a" : "#fafafa"} fontFamily="sans-serif" fontSize="9" fontWeight="bold">
              Security Events
            </text>
            <text x={textXLogs} y={ySecLogs} fill={isLight ? "#64748b" : "#71717a"} fontFamily="monospace" fontSize="8" id="val-logs-rate-se">
              rate: 0 evt/s
            </text>
            {showDetails && (
              <text x={textXLogs} y="38" fill={isLight ? "#64748b" : "#a1a1aa"} fontFamily="monospace" fontSize="7">audit log parser</text>
            )}
            <circle cx="67.5" cy="48" r="2.5" display="none" />
          </g>

          {/* Application Events */}
          <g transform="translate(690, 145)" className="cursor-pointer group select-none">
            <rect
              id="node-rect-app-logs"
              x="0"
              y="0"
              width="135"
              height="48"
              rx="5"
              fill={isLight ? "#f8fafc" : "#0a0b0d"}
              stroke={isLight ? "#e2e8f0" : "#1f293d"}
              strokeWidth="1.5"
              style={{
                filter: isLight ? "drop-shadow(0 1px 3px rgba(0,0,0,0.05))" : "none",
                transition: "stroke 0.2s ease, filter 0.2s ease",
              }}
              className="transition-all duration-200"
            />
            <g transform="translate(-2, 0)">
              <rect x="8" y="10" width="28" height="28" rx="6" fill={isLight ? "#ecfeff" : "rgba(6, 182, 212, 0.08)"} stroke={isLight ? "#a5f3fc" : "rgba(6, 182, 212, 0.2)"} strokeWidth="1" />
              <g stroke={isLight ? "#0891b2" : "#22d3ee"} fill="none">
                <rect x="15" y="17" width="5" height="4" rx="0.5" />
                <rect x="23" y="17" width="5" height="4" rx="0.5" />
                <rect x="15" y="23" width="5" height="4" rx="0.5" />
                <rect x="23" y="23" width="5" height="4" rx="0.5" />
              </g>
            </g>
            <circle cx="67.5" cy="0" r="2.5" display="none" />
            <text x={textXLogs} y={yTitleLogs} fill={isLight ? "#0f172a" : "#fafafa"} fontFamily="sans-serif" fontSize="9" fontWeight="bold">
              Application Logs
            </text>
            <text x={textXLogs} y={ySecLogs} fill={isLight ? "#64748b" : "#71717a"} fontFamily="monospace" fontSize="8" id="val-logs-rate-ae">
              {aeRateText}
            </text>
            {showDetails && (
              <text x={textXLogs} y="38" fill={isLight ? "#64748b" : "#a1a1aa"} fontFamily="monospace" fontSize="7">stdout, stderr stream</text>
            )}
            <circle cx="67.5" cy="48" r="2.5" display="none" />
          </g>

          {/* Pattern Extraction */}
          <g transform="translate(490, 220)" className="cursor-pointer group select-none">
            <rect
              id="node-rect-pattern-det"
              x="0"
              y="0"
              width="130"
              height="46"
              rx="5"
              fill={isLight ? "#f8fafc" : "#0a0b0d"}
              stroke={isLight ? "#e2e8f0" : "#1f293d"}
              strokeWidth="1.5"
              style={{
                filter: isLight ? "drop-shadow(0 1px 3px rgba(0,0,0,0.05))" : "none",
                transition: "stroke 0.2s ease, filter 0.2s ease",
              }}
              className="transition-all duration-200"
            />
            <g transform="translate(-2, 0)">
              <rect x="8" y="9" width="28" height="28" rx="6" fill={isLight ? "#fffbeb" : "rgba(245, 158, 11, 0.08)"} stroke={isLight ? "#fde68a" : "rgba(245, 158, 11, 0.2)"} strokeWidth="1" />
              <g stroke={isLight ? "#d97706" : "#fbbf24"} strokeWidth="1.25" strokeLinecap="round" fill="none">
                <circle cx="21" cy="22" r="3.5" />
                <line x1="23.5" y1="24.5" x2="28" y2="29" />
              </g>
            </g>
            <circle cx="65" cy="0" r="2.5" display="none" />
            <text x={textXLogs} y={yTitleDet} fill={isLight ? "#0f172a" : "#fafafa"} fontFamily="sans-serif" fontSize="9" fontWeight="bold">
              Pattern Extract
            </text>
            <text x={textXLogs} y={ySecDet} fill={isLight ? "#d97706" : "#fbbf24"} fontFamily="monospace" fontSize="8">
              Regex &amp; JIT
            </text>
            {showDetails && (
              <text x={textXLogs} y="37" fill={isLight ? "#64748b" : "#71717a"} fontFamily="monospace" fontSize="7">JSON paths resolved</text>
            )}
            <circle cx="65" cy="46" r="2.5" display="none" />
          </g>

          {/* Latency Detection */}
          <g transform="translate(635, 225)" className="cursor-pointer group select-none">
            <rect
              id="node-rect-latency-det"
              x="0"
              y="0"
              width="130"
              height="46"
              rx="5"
              fill={isLight ? "#f8fafc" : "#0a0b0d"}
              stroke={isLight ? "#e2e8f0" : "#1f293d"}
              strokeWidth="1.5"
              style={{
                filter: isLight ? "drop-shadow(0 1px 3px rgba(0,0,0,0.05))" : "none",
                transition: "stroke 0.2s ease, filter 0.2s ease",
              }}
              className={`transition-all duration-200 ${nodeLatencyDetClass}`}
            />
            <g transform="translate(-2, 0)">
              <rect x="8" y="9" width="28" height="28" rx="6" fill={isLight ? "#fffbeb" : "rgba(245, 158, 11, 0.08)"} stroke={isLight ? "#fde68a" : "rgba(245, 158, 11, 0.2)"} strokeWidth="1" />
              <path d="M 14 23 H 17 L 19 16 L 21 30 L 23 20 L 25 24 H 29" stroke={isLight ? "#d97706" : "#fbbf24"} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>
            <circle cx="65" cy="0" r="2.5" display="none" />
            <text x={textXLogs} y={yTitleDet} fill={isLight ? "#0f172a" : "#fafafa"} fontFamily="sans-serif" fontSize="9" fontWeight="bold">
              Latency Detect
            </text>
            <text x={textXLogs} y={ySecDet} fill={isLight ? "#d97706" : "#fbbf24"} fontFamily="monospace" fontSize="8">
              p95 &amp; p99 Limits
            </text>
            {showDetails && (
              <text x={textXLogs} y="37" fill={isLight ? "#64748b" : "#71717a"} fontFamily="monospace" fontSize="7" id="val-det-latency">stream + dbms</text>
            )}
            <circle cx="65" cy="46" r="2.5" display="none" />
          </g>

          {/* Error Detection */}
          <g transform="translate(780, 215)" className="cursor-pointer group select-none">
            <rect
              id="node-rect-error-det"
              x="0"
              y="0"
              width="130"
              height="46"
              rx="5"
              fill={isLight ? "#f8fafc" : "#0a0b0d"}
              stroke={isLight ? "#e2e8f0" : "#1f293d"}
              strokeWidth="1.5"
              style={{
                filter: isLight ? "drop-shadow(0 1px 3px rgba(0,0,0,0.05))" : "none",
                transition: "stroke 0.2s ease, filter 0.2s ease",
              }}
              className={`transition-all duration-200 ${nodeErrorDetClass}`}
            />
            <g transform="translate(-2, 0)">
              <rect x="8" y="9" width="28" height="28" rx="6" fill={isLight ? "#fff1f2" : "rgba(225, 29, 72, 0.08)"} stroke={isLight ? "#fecdd3" : "rgba(225, 29, 72, 0.2)"} strokeWidth="1" />
              <g stroke={isLight ? "#e11d48" : "#fb7185"} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <path d="M 22 17 L 27 27 H 17 Z" />
                <line x1="22" y1="20" x2="22" y2="23" />
                <circle cx="22" cy="25" r="0.5" fill={isLight ? "#e11d48" : "#fb7185"} />
              </g>
            </g>
            <circle cx="65" cy="0" r="2.5" display="none" />
            <text x={textXLogs} y={yTitleDet} fill={isLight ? "#0f172a" : "#fafafa"} fontFamily="sans-serif" fontSize="9" fontWeight="bold">
              Error Detect
            </text>
            <text x={textXLogs} y={ySecDet} fill={isLight ? "#e11d48" : "#fb7185"} fontFamily="monospace" fontSize="8">
              5xx Rate Spikes
            </text>
            {showDetails && (
              <text x={textXLogs} y="37" fill={isLight ? "#64748b" : "#71717a"} fontFamily="monospace" fontSize="7" id="val-det-error">thresholds</text>
            )}
            <circle cx="65" cy="46" r="2.5" display="none" />
          </g>

          {/* Anomaly Detection */}
          <g transform="translate(535, 295)" className="cursor-pointer group select-none">
            <rect
              id="node-rect-anomaly-det"
              x="0"
              y="0"
              width="130"
              height="46"
              rx="5"
              fill={isLight ? "#f8fafc" : "#0a0b0d"}
              stroke={isLight ? "#e2e8f0" : "#1f293d"}
              strokeWidth="1.5"
              style={{
                filter: isLight ? "drop-shadow(0 1px 3px rgba(0,0,0,0.05))" : "none",
                transition: "stroke 0.2s ease, filter 0.2s ease",
              }}
              className="transition-all duration-200"
            />
            <g transform="translate(-2, 0)">
              <rect x="8" y="9" width="28" height="28" rx="6" fill={isLight ? "#fff1f2" : "rgba(225, 29, 72, 0.08)"} stroke={isLight ? "#fecdd3" : "rgba(225, 29, 72, 0.2)"} strokeWidth="1" />
              <g stroke={isLight ? "#e11d48" : "#fb7185"} strokeWidth="1.25" strokeLinecap="round" fill="none">
                <line x1="14" y1="20" x2="28" y2="20" />
                <line x1="14" y1="26" x2="28" y2="26" />
                <circle cx="18" cy="20" r="1.5" fill={isLight ? "#e11d48" : "#fb7185"} />
                <circle cx="24" cy="26" r="1.5" fill={isLight ? "#e11d48" : "#fb7185"} />
              </g>
            </g>
            <circle cx="65" cy="0" r="2.5" display="none" />
            <text x={textXLogs} y={yTitleDet} fill={isLight ? "#0f172a" : "#fafafa"} fontFamily="sans-serif" fontSize="9" fontWeight="bold">
              Anomaly Detect
            </text>
            <text x={textXLogs} y={ySecDet} fill={isLight ? "#e11d48" : "#fb7185"} fontFamily="monospace" fontSize="8">
              ML Baseline Drift
            </text>
            {showDetails && (
              <text x={textXLogs} y="37" fill={isLight ? "#64748b" : "#71717a"} fontFamily="monospace" fontSize="7">standard deviation</text>
            )}
            <circle cx="65" cy="46" r="2.5" display="none" />
          </g>

          {/* Threat Detection */}
          <g transform="translate(715, 295)" className="cursor-pointer group select-none">
            <rect
              id="node-rect-threat-det"
              x="0"
              y="0"
              width="130"
              height="46"
              rx="5"
              fill={isLight ? "#f8fafc" : "#0a0b0d"}
              stroke={isLight ? "#e2e8f0" : "#1f293d"}
              strokeWidth="1.5"
              style={{
                filter: isLight ? "drop-shadow(0 1px 3px rgba(0,0,0,0.05))" : "none",
                transition: "stroke 0.2s ease, filter 0.2s ease",
              }}
              className="transition-all duration-200"
            />
            <g transform="translate(-2, 0)">
              <rect x="8" y="9" width="28" height="28" rx="6" fill={isLight ? "#fff1f2" : "rgba(225, 29, 72, 0.08)"} stroke={isLight ? "#fecdd3" : "rgba(225, 29, 72, 0.2)"} strokeWidth="1" />
              <g stroke={isLight ? "#e11d48" : "#fb7185"} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <path d="M 16 19 C 16 19, 22 17, 22 17 C 22 17, 28 19, 28 19 V 23 C 28 27, 22 30, 22 30 C 22 30, 16 27, 16 23 Z" />
              </g>
            </g>
            <circle cx="65" cy="0" r="2.5" display="none" />
            <text x={textXLogs} y={yTitleDet} fill={isLight ? "#0f172a" : "#fafafa"} fontFamily="sans-serif" fontSize="9" fontWeight="bold">
              Threat Detect
            </text>
            <text x={textXLogs} y={ySecDet} fill={isLight ? "#e11d48" : "#fb7185"} fontFamily="monospace" fontSize="8">
              CVE &amp; WAF Shield
            </text>
            {showDetails && (
              <text x={textXLogs} y="37" fill={isLight ? "#64748b" : "#71717a"} fontFamily="monospace" fontSize="7">auth scan monitors</text>
            )}
            <circle cx="65" cy="46" r="2.5" display="none" />
          </g>

          {/* Throughput Pill */}
          <g transform="translate(60, 310)" className="cursor-pointer group select-none">
            <rect
              id="node-rect-throughput-metric"
              x="0"
              y="0"
              width="165"
              height="50"
              rx="25"
              fill={isLight ? "#ffffff" : "#0a0b0d"}
              stroke={isLight ? "#e2e8f0" : "#1f293d"}
              strokeWidth="1.5"
              style={{
                filter: isLight ? "drop-shadow(0 1px 3px rgba(0,0,0,0.05))" : "none",
                transition: "stroke 0.2s ease, filter 0.2s ease",
              }}
              className="transition-all duration-200"
            />
            <circle cx="82.5" cy="0" r="2.5" display="none" />
            <text x="20" y="18" fill={isLight ? "#0f172a" : "#fafafa"} fontFamily="sans-serif" fontSize="9" fontWeight="bold">
              Throughput
            </text>
            <text x="20" y="32" fill={isLight ? "#6366f1" : "#10b981"} fontFamily="monospace" fontSize="8" id="val-throughput">
              {currentState === 0 ? "140 requests/sec" : currentState === 6 ? "162 requests/sec" : "1.2k requests/sec"}
            </text>
            <path
              d="M 115 28 L 122 22 L 130 30 L 138 20 L 145 34 L 152 24"
              fill="none"
              stroke={isLight ? "#6366f1" : "#10b981"}
              strokeWidth="1"
              id="metric-chart-throughput"
            />
            <circle cx="82.5" cy="50" r="2.5" display="none" />
          </g>

          {/* Error Rate Pill */}
          <g transform="translate(250, 315)" className="cursor-pointer group select-none">
            <rect
              id="node-rect-error-metric"
              x="0"
              y="0"
              width="165"
              height="50"
              rx="25"
              fill={isLight ? "#ffffff" : "#0a0b0d"}
              stroke={isLight ? "#e2e8f0" : "#1f293d"}
              strokeWidth="1.5"
              style={{
                filter: isLight ? "drop-shadow(0 1px 3px rgba(0,0,0,0.05))" : "none",
                transition: "stroke 0.2s ease, filter 0.2s ease",
              }}
              className={`transition-all duration-200 ${nodeErrorMetricClass}`}
            />
            <circle cx="82.5" cy="0" r="2.5" display="none" />
            <text x="20" y="18" fill={isLight ? "#0f172a" : "#fafafa"} fontFamily="sans-serif" fontSize="9" fontWeight="bold">
              Error Rate
            </text>
            <text x="20" y="32" fill={isLight && errorColor === "#10b981" ? "#6366f1" : errorColor} fontFamily="monospace" fontSize="8" id="val-error-metric">
              {isLight && errorText === "0.02% (nominal)" ? "0.02% (nominal)" : errorText}
            </text>
            <path
              d={errorPathD}
              fill="none"
              stroke={isLight && errorStroke === "#10b981" ? "#6366f1" : errorStroke}
              strokeWidth="1"
              id="metric-chart-error"
            />
            <circle cx="82.5" cy="50" r="2.5" display="none" />
          </g>

          {/* Latency Pill */}
          <g transform="translate(60, 385)" className="cursor-pointer group select-none">
            <rect
              id="node-rect-latency-metric"
              x="0"
              y="0"
              width="165"
              height="50"
              rx="25"
              fill={isLight ? "#ffffff" : "#0a0b0d"}
              stroke={isLight ? "#e2e8f0" : "#1f293d"}
              strokeWidth="1.5"
              style={{
                filter: isLight ? "drop-shadow(0 1px 3px rgba(0,0,0,0.05))" : "none",
                transition: "stroke 0.2s ease, filter 0.2s ease",
              }}
              className={`transition-all duration-200 ${nodeLatencyMetricClass}`}
            />
            <circle cx="82.5" cy="0" r="2.5" display="none" />
            <text x="20" y="18" fill={isLight ? "#0f172a" : "#fafafa"} fontFamily="sans-serif" fontSize="9" fontWeight="bold">
              Latency (p95)
            </text>
            <text x="20" y="32" fill={isLight && latencyColor === "#10b981" ? "#6366f1" : latencyColor} fontFamily="monospace" fontSize="8" id="val-latency-metric">
              {latencyText}
            </text>
            <path
              d={latencyPathD}
              fill="none"
              stroke={isLight && latencyStroke === "#10b981" ? "#6366f1" : latencyStroke}
              strokeWidth="1"
              id="metric-chart-latency"
            />
            <circle cx="82.5" cy="50" r="2.5" display="none" />
          </g>

          {/* Saturation Pill */}
          <g transform="translate(250, 385)" className="cursor-pointer group select-none">
            <rect
              id="node-rect-saturation-metric"
              x="0"
              y="0"
              width="165"
              height="50"
              rx="25"
              fill={isLight ? "#ffffff" : "#0a0b0d"}
              stroke={isLight ? "#e2e8f0" : "#1f293d"}
              strokeWidth="1.5"
              style={{
                filter: isLight ? "drop-shadow(0 1px 3px rgba(0,0,0,0.05))" : "none",
                transition: "stroke 0.2s ease, filter 0.2s ease",
              }}
              className="transition-all duration-200"
            />
            <circle cx="82.5" cy="0" r="2.5" display="none" />
            <text x="20" y="18" fill={isLight ? "#0f172a" : "#fafafa"} fontFamily="sans-serif" fontSize="9" fontWeight="bold">
              Saturation
            </text>
            <text x="20" y="32" fill={isLight ? "#64748b" : "#71717a"} fontFamily="monospace" fontSize="8" id="val-saturation">
              {currentState === 2 || currentState === 3 || currentState === 4
                ? "Queue Depth: 128"
                : "Queue Depth: 12"}
            </text>
            <path d="M 115 30 L 122 26 L 130 24 L 138 28 L 145 26 L 152 30" fill="none" stroke={isLight ? "#64748b" : "#71717a"} strokeWidth="1" />
            <circle cx="82.5" cy="50" r="2.5" display="none" />
          </g>

          {/* Decision Engine */}
          <g transform="translate(60, 515)" className="cursor-pointer group select-none">
            <rect
              id="node-rect-dec-engine"
              x="0"
              y="0"
              width="300"
              height="60"
              rx="6"
              fill={isLight ? "#ffffff" : "#0a0b0d"}
              stroke={isLight ? "#e2e8f0" : "#1f293d"}
              strokeWidth="1.5"
              style={{
                filter: isLight ? "drop-shadow(0 1px 3px rgba(0,0,0,0.05))" : "none",
                transition: "stroke 0.2s ease, filter 0.2s ease",
              }}
              className={`transition-all duration-200 ${nodeDecEngineClass}`}
            />
            {isLight ? (
              <g>
                <rect x="12" y="16" width="28" height="28" rx="6" fill="#f5f3ff" stroke="#e9d5ff" strokeWidth="1" />
                <g stroke="#7c3aed" strokeWidth="1.25" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M 26 20 L 32 23 V 32 L 26 35 L 20 32 V 23 Z" />
                  <line x1="23" y1="25" x2="29" y2="25" />
                  <line x1="23" y1="28" x2="29" y2="28" />
                  <line x1="23" y1="31" x2="29" y2="31" />
                </g>
              </g>
            ) : (
              <g stroke="#10b981" strokeWidth="1.25" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 26 20 L 32 23 V 32 L 26 35 L 20 32 V 23 Z" />
                <line x1="23" y1="25" x2="29" y2="25" />
                <line x1="23" y1="28" x2="29" y2="28" />
                <line x1="23" y1="31" x2="29" y2="31" />
              </g>
            )}
            <circle cx="150" cy="0" r="3" display="none" />
            <text x="50" y="20" fill={isLight ? "#0f172a" : "#fafafa"} fontFamily="sans-serif" fontSize="10" fontWeight="bold">
              Decision Engine // Evaluate Rules
            </text>
            <text x="50" y="36" fill={isLight ? "#64748b" : "#71717a"} fontFamily="monospace" fontSize="8" id="val-dec-trigger">
              {decTriggerText}
            </text>
            {showDetails && (
              <text x="50" y="48" fill={isLight ? "#64748b" : "#52525b"} fontFamily="monospace" fontSize="8" id="val-dec-cooldown">
                Cooldown Window: 60s
              </text>
            )}
            <circle cx="150" cy="60" r="3" display="none" />
          </g>

          {/* Autoscaler */}
          <g transform="translate(460, 515)" className="cursor-pointer group select-none">
            <rect
              id="node-rect-autoscaler"
              x="0"
              y="0"
              width="300"
              height="60"
              rx="6"
              fill={isLight ? "#ffffff" : "#0a0b0d"}
              stroke={isLight ? "#e2e8f0" : "#1f293d"}
              strokeWidth="1.5"
              style={{
                filter: isLight ? "drop-shadow(0 1px 3px rgba(0,0,0,0.05))" : "none",
                transition: "stroke 0.2s ease, filter 0.2s ease",
              }}
              className={`transition-all duration-200 ${nodeAutoscalerClass}`}
            />
            {isLight ? (
              <g>
                <rect x="12" y="16" width="28" height="28" rx="6" fill="#f5f3ff" stroke="#e9d5ff" strokeWidth="1" />
                <g stroke="#7c3aed" strokeWidth="1.25" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="26" cy="30" r="8" />
                  <path d="M 20 30 Q 23 25 26 30 T 32 30" />
                </g>
              </g>
            ) : (
              <g stroke="#10b981" strokeWidth="1.25" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="26" cy="30" r="8" />
                <path d="M 20 30 Q 23 25 26 30 T 32 30" />
              </g>
            )}
            <circle cx="150" cy="0" r="3" display="none" />
            <text x="50" y="20" fill={isLight ? "#0f172a" : "#fafafa"} fontFamily="sans-serif" fontSize="10" fontWeight="bold">
              Autoscaler // Kube HPA Patch
            </text>
            <text x="50" y="36" fill={isLight ? "#64748b" : "#71717a"} fontFamily="monospace" fontSize="8" id="val-scaler-factor">
              {scalerFactorText}
            </text>
            {showDetails && (
              <text x="50" y="48" fill={isLight ? "#64748b" : "#52525b"} fontFamily="monospace" fontSize="8" id="val-scaler-target">
                Target: deployment/commerce-frontend
              </text>
            )}
            <circle cx="150" cy="60" r="3" display="none" />
          </g>

          {/* Kubernetes API */}
          <g transform="translate(120, 595)" className="cursor-pointer group select-none">
            <rect
              id="node-rect-kube-api"
              x="0"
              y="0"
              width="300"
              height="60"
              rx="6"
              fill={isLight ? "#ffffff" : "#0a0b0d"}
              stroke={isLight ? "#e2e8f0" : "#1f293d"}
              strokeWidth="1.5"
              style={{
                filter: isLight ? "drop-shadow(0 1px 3px rgba(0,0,0,0.05))" : "none",
                transition: "stroke 0.2s ease, filter 0.2s ease",
              }}
              className={`transition-all duration-200 ${nodeKubeApiClass}`}
            />
            {isLight ? (
              <g>
                <rect x="12" y="16" width="28" height="28" rx="6" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
                <g stroke="#2563eb" strokeWidth="1.25" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M26 20 l6.5 3 v8 l-6.5 3 l-6.5 -3 v-8 Z" />
                  <path d="M26 20 v14 M19.5 23 l13 6 M32.5 23 l-13 6" strokeWidth="1" />
                </g>
              </g>
            ) : (
              <g stroke="#10b981" strokeWidth="1.25" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M26 20 l6.5 3 v8 l-6.5 3 l-6.5 -3 v-8 Z" />
                <path d="M26 20 v14 M19.5 23 l13 6 M32.5 23 l-13 6" strokeWidth="1" />
              </g>
            )}
            <circle cx="150" cy="0" r="3" display="none" />
            <text x="50" y="20" fill={isLight ? "#0f172a" : "#fafafa"} fontFamily="sans-serif" fontSize="10" fontWeight="bold">
              Kubernetes API Server
            </text>
            <text x="50" y="36" fill="#10b981" fontFamily="monospace" fontSize="8" id="val-kube-status">
              {kubeStatusText}
            </text>
            {showDetails && (
              <text x="50" y="48" fill={isLight ? "#64748b" : "#52525b"} fontFamily="monospace" fontSize="8" id="val-kube-request">
                {kubeRequestText}
              </text>
            )}
            <circle cx="150" cy="60" r="3" display="none" />
          </g>

          {/* Replica Feedback Loop */}
          <g transform="translate(520, 595)" className="cursor-pointer group select-none">
            <rect
              id="node-rect-feedback"
              x="0"
              y="0"
              width="300"
              height="60"
              rx="6"
              fill={isLight ? "#ffffff" : "#0a0b0d"}
              stroke={isLight ? "#e2e8f0" : "#1f293d"}
              strokeWidth="1.5"
              style={{
                filter: isLight ? "drop-shadow(0 1px 3px rgba(0,0,0,0.05))" : "none",
                transition: "stroke 0.2s ease, filter 0.2s ease",
              }}
              className={`transition-all duration-200 ${nodeFeedbackClass}`}
            />
            {isLight ? (
              <g>
                <rect x="12" y="16" width="28" height="28" rx="6" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1" />
                <g stroke="#16a34a" strokeWidth="1.25" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="26" cy="30" r="8" />
                  <path d="M 22 30 L 25 33 L 30 26" />
                </g>
              </g>
            ) : (
              <g stroke="#10b981" strokeWidth="1.25" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="26" cy="30" r="8" />
                <path d="M 22 30 L 25 33 L 30 26" />
              </g>
            )}
            <circle cx="150" cy="0" r="3" display="none" />
            <text x="50" y="20" fill={isLight ? "#0f172a" : "#fafafa"} fontFamily="sans-serif" fontSize="10" fontWeight="bold">
              Updated Replica Counts // Feedback
            </text>
            <text x="50" y="36" fill="#10b981" fontFamily="monospace" fontSize="8" id="val-feedback-status">
              {feedbackStatusText}
            </text>
            {showDetails && (
              <text x="50" y="48" fill={isLight ? "#64748b" : "#52525b"} fontFamily="monospace" fontSize="8" id="val-feedback-allocation">
                {feedbackAllocationText}
              </text>
            )}
            <circle cx="150" cy="60" r="3" display="none" />
          </g>
        </svg>
      </div>

      {/* Dashboard Widget Feature Cards */}
      <div className={`mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t pt-6 font-mono transition-colors duration-300 ${isLight ? "border-zinc-200" : "border-zinc-800"}`}>
        {/* Widget 1: Log Ingestion */}
        <div className={`border rounded-[6px] p-4 flex flex-col justify-between min-h-[110px] relative overflow-hidden group transition-all duration-300 ${isLight ? "border-zinc-200 bg-white shadow-sm" : "border-zinc-800 bg-[#0d1117]/60"}`}>
          <div className="flex items-center justify-between text-[9px] z-10">
            <span className={`font-bold tracking-wider uppercase ${isLight ? "text-slate-500" : "text-zinc-400"}`}>LOG INGESTION</span>
            {isLight && (
              <div className="w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                </svg>
              </div>
            )}
          </div>
          <div className="my-1 z-10">
            <div className={`text-xl font-bold tracking-tight font-mono ${isLight ? "text-slate-900" : "text-white"}`} id="widget-ingest-val">
              {widgetIngestVal}
            </div>
            <div className={`text-[9px] leading-normal mt-0.5 ${isLight ? "text-slate-400" : "text-zinc-500"}`}>Real-time container stdout/stderr events/sec.</div>
          </div>
          {/* Continuous Sparkline */}
          <div className="absolute bottom-0 left-0 right-0 h-8 opacity-95">
            <svg className="w-full h-full" viewBox="0 0 200 30" preserveAspectRatio="none">
              <path
                d="M 0 20 L 5 18 L 10 22 L 15 15 L 20 25 L 25 12 L 30 20 L 35 15 L 40 28 L 45 18 L 50 22 L 55 12 L 60 20 L 65 14 L 70 24 L 75 16 L 80 22 L 85 10 L 90 20 L 95 15 L 100 25 L 105 18 L 110 22 L 115 15 L 120 25 L 125 12 L 130 20 L 135 15 L 140 28 L 145 18 L 150 22 L 155 12 L 160 20 L 165 14 L 170 24 L 175 16 L 180 22 L 185 10 L 190 20 L 195 15 L 200 20"
                fill="none"
                stroke={isLight ? "#6366f1" : "#10b981"}
                strokeWidth="1.25"
              />
            </svg>
          </div>
        </div>

        {/* Widget 2: Autoscale Latency */}
        <div className={`border rounded-[6px] p-4 flex flex-col justify-between min-h-[110px] relative overflow-hidden group transition-all duration-300 ${isLight ? "border-zinc-200 bg-white shadow-sm" : "border-zinc-800 bg-[#0d1117]/60"}`}>
          <div className="flex items-center justify-between text-[9px] z-10">
            <span className={`font-bold tracking-wider uppercase ${isLight ? "text-slate-500" : "text-zinc-400"}`}>AUTOSCALE SYNC</span>
            {isLight && (
              <div className="w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
            )}
          </div>
          <div className="my-1 z-10">
            <div className={`text-xl font-bold tracking-tight font-mono ${isLight ? "text-slate-900" : "text-white"}`} id="widget-latency-val">
              {widgetLatencyVal}
            </div>
            <div className={`text-[9px] leading-normal mt-0.5 ${isLight ? "text-slate-400" : "text-zinc-500"}`}>Log breach trigger to HPA mutation speed.</div>
          </div>
          {/* Continuous Sparkline */}
          <div className="absolute bottom-0 left-0 right-0 h-8 opacity-95">
            <svg className="w-full h-full" viewBox="0 0 200 30" preserveAspectRatio="none">
              <path
                d="M 0 15 L 15 18 L 30 10 L 45 22 L 60 14 L 75 25 L 90 12 L 105 18 L 120 8 L 135 20 L 150 15 L 165 24 L 180 12 L 195 18 L 200 15"
                fill="none"
                stroke={isLight ? "#6366f1" : "#10b981"}
                strokeWidth="1.25"
              />
            </svg>
          </div>
        </div>

        {/* Widget 3: Regex Parse Rate */}
        <div className={`border rounded-[6px] p-4 flex flex-col justify-between min-h-[110px] relative overflow-hidden group transition-all duration-300 ${isLight ? "border-zinc-200 bg-white shadow-sm" : "border-zinc-800 bg-[#0d1117]/60"}`}>
          <div className="flex items-center justify-between text-[9px] z-10">
            <span className={`font-bold tracking-wider uppercase ${isLight ? "text-slate-500" : "text-zinc-400"}`}>REGEX PARSE SPEED</span>
            {isLight && (
              <div className="w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3"></path>
                </svg>
              </div>
            )}
          </div>
          <div className="my-1 z-10">
            <div className={`text-xl font-bold tracking-tight font-mono ${isLight ? "text-slate-900" : "text-white"}`} id="widget-parse-val">
              {widgetParseVal}
            </div>
            <div className={`text-[9px] leading-normal mt-0.5 ${isLight ? "text-slate-400" : "text-zinc-500"}`}>JIT pattern parsing extraction bandwidth.</div>
          </div>
          {/* Continuous Sparkline */}
          <div className="absolute bottom-0 left-0 right-0 h-8 opacity-95">
            <svg className="w-full h-full" viewBox="0 0 200 30" preserveAspectRatio="none">
              <path
                d="M 0 15 L 8 10 L 16 22 L 24 14 L 32 18 L 40 8 L 48 20 L 56 12 L 64 24 L 72 10 L 80 16 L 88 14 L 96 22 L 104 8 L 112 18 L 120 12 L 128 24 L 136 10 L 144 16 L 152 14 L 160 22 L 168 8 L 176 18 L 184 12 L 192 24 L 200 15"
                fill="none"
                stroke={isLight ? "#6366f1" : "#10b981"}
                strokeWidth="1.25"
              />
            </svg>
          </div>
        </div>

        {/* Widget 4: Threat Defense */}
        <div className={`border rounded-[6px] p-4 flex flex-col justify-between min-h-[110px] relative overflow-hidden group transition-all duration-300 ${isLight ? "border-zinc-200 bg-white shadow-sm" : "border-zinc-800 bg-[#0d1117]/60"}`}>
          <div className="flex items-center justify-between text-[9px] z-10">
            <span className={`font-bold tracking-wider uppercase ${isLight ? "text-slate-500" : "text-zinc-400"}`}>THREAT MITIGATION</span>
            {isLight && (
              <div className="w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
            )}
          </div>
          <div className="my-1 z-10">
            <div className={`text-xl font-bold tracking-tight font-mono ${isLight ? "text-slate-900" : "text-white"}`} id="widget-threat-val">
              {widgetThreatVal}
            </div>
            <div className={`text-[9px] leading-normal mt-0.5 ${isLight ? "text-slate-400" : "text-zinc-500"}`}>Autonomous anomaly IP blocking filters.</div>
          </div>
          {/* Continuous Sparkline */}
          <div className="absolute bottom-0 left-0 right-0 h-8 opacity-95">
            <svg className="w-full h-full" viewBox="0 0 200 30" preserveAspectRatio="none">
              <path
                d={currentState === 2 || currentState === 3 || currentState === 4
                  ? "M 0 20 L 20 20 L 40 19 L 60 20 L 80 20 L 90 22 L 100 8 L 110 28 L 120 18 L 130 20 L 140 20 L 160 19 L 180 20 L 200 20"
                  : "M 0 20 L 20 20 L 40 19 L 60 20 L 80 20 L 100 21 L 120 20 L 140 20 L 160 19 L 180 20 L 200 20"}
                fill="none"
                stroke={isLight ? "#6366f1" : "#10b981"}
                strokeWidth="1.25"
              />
            </svg>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        /* SVG Custom styling for state transitions */
        @keyframes node-pulse-rose {
          0%, 100% { stroke: ${isLight ? "#cbd5e1" : "#222b3c"}; }
          50% { stroke: #e11d48; filter: drop-shadow(0 0 8px rgba(225, 29, 72, ${isLight ? "0.4" : "0.7"})); }
        }
        @keyframes node-pulse-amber {
          0%, 100% { stroke: ${isLight ? "#cbd5e1" : "#222b3c"}; }
          50% { stroke: #f59e0b; filter: drop-shadow(0 0 8px rgba(245, 158, 11, ${isLight ? "0.4" : "0.7"})); }
        }
        @keyframes node-pulse-emerald {
          0%, 100% { stroke: ${isLight ? "#cbd5e1" : "#10b981"}; }
          50% { stroke: ${isLight ? "#6366f1" : "#10b981"}; filter: drop-shadow(0 0 8px ${isLight ? "rgba(99, 102, 241, 0.5)" : "rgba(16, 185, 129, 0.7)"}); }
        }

        .pulse-rose { animation: node-pulse-rose 1.5s infinite !important; }
        .pulse-amber { animation: node-pulse-amber 1.5s infinite !important; }
        .pulse-emerald { animation: node-pulse-emerald 1.5s infinite !important; }

        /* Animated glowing critical connection paths */
        @keyframes path-flow-move {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }

        .path-flow-rose {
          stroke: #e11d48 !important;
          stroke-dasharray: 6, 6;
          animation: path-flow-move 0.8s linear infinite;
          filter: drop-shadow(0 0 4px rgba(225, 29, 72, ${isLight ? "0.4" : "0.8"}));
          transition: all 0.3s ease;
        }

        .path-flow-amber {
          stroke: #f59e0b !important;
          stroke-dasharray: 6, 6;
          animation: path-flow-move 0.8s linear infinite;
          filter: drop-shadow(0 0 4px rgba(245, 158, 11, ${isLight ? "0.4" : "0.8"}));
          transition: all 0.3s ease;
        }

        .path-flow-emerald {
          stroke: ${isLight ? "#6366f1" : "#10b981"} !important;
          stroke-dasharray: 6, 6;
          animation: path-flow-move 0.8s linear infinite;
          filter: drop-shadow(0 0 4px ${isLight ? "rgba(99, 102, 241, 0.5)" : "rgba(16, 185, 129, 0.8)"});
          transition: all 0.3s ease;
        }

        /* Interactive Hover states */
        g.group:hover rect {
          stroke: ${isLight ? "#6366f1" : "#52525b"} !important;
          filter: drop-shadow(0 0 5px ${isLight ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.1)"});
        }
        
        /* Fallback transitions */
        path {
          transition: stroke 0.3s ease, filter 0.3s ease;
        }
      `}} />
    </div>
  );
}
