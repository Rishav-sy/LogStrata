"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";

export function HeroDiagram() {
  const [heroState, setHeroState] = useState(0);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timings = [6000, 4500, 5000];
    const run = () => {
      setHeroState((prev) => (prev + 1) % 3);
    };
    let timer = setTimeout(function tick() {
      run();
      const currentTiming = timings[(heroState + 1) % 3];
      timer = setTimeout(tick, currentTiming);
    }, timings[0]);

    return () => clearTimeout(timer);
  }, [heroState]);

  // Derived properties based on state
  const pingColor = heroState === 1 ? "bg-amber-500" : "bg-emerald-500";
  const stateLabel =
    heroState === 0
      ? "LOOP // STABLE"
      : heroState === 1
        ? "LOOP // LOAD SPIKE DETECTED"
        : "LOOP // REPLICAS MUTATED";
  const syncLabel =
    heroState === 0
      ? "REPLICAS: 3/12"
      : heroState === 1
        ? "SPIKE TRIGGERED"
        : "REPLICAS: 9/12";

  const podsReps = heroState === 2 ? "replicas: 9 / 12" : "replicas: 3 / 12";
  const podsDotColor = heroState === 1 ? "#f59e0b" : "#10b981";
  const logsRate = heroState === 0 ? "rate: 42 events/sec" : "rate: 1.2K events/sec";
  const engineStatus =
    heroState === 0
      ? "Status: ANALYSIS ACTIVE"
      : heroState === 1
        ? "Status: SPIKE PRE-EMPTED"
        : "Status: CAPACITY ADJUSTED";

  const metricsLatency =
    heroState === 0
      ? "Latency: 82ms"
      : heroState === 1
        ? "Latency: 480ms (SPIKE)"
        : "Latency: 120ms (Recovered)";
  const metricsColor = heroState === 1 ? "#f59e0b" : "#10b981";

  const securityStatus =
    heroState === 1 ? "1 threat anomaly blocked" : "0 active threats";
  const securityColor =
    heroState === 0 ? "#a1a1aa" : heroState === 1 ? "#ef4444" : "#10b981";

  const autoFactor =
    heroState === 1 ? "Scale ratio: 3.0x (Triggered)" : "Scale ratio: 1.0x (Idle)";
  const scaleStatus =
    heroState === 0
      ? "Status: Synced"
      : heroState === 1
        ? "Status: PENDING PROVISION"
        : "Status: Replicated";

  const isLight = mounted && resolvedTheme === "light";

  // Flow and color tokens based on state
  const activeColor =
    heroState === 0
      ? "#00f0ff"
      : heroState === 1
        ? "#f59e0b"
        : "#10b981";

  const flowDuration =
    heroState === 0
      ? "6.0s"
      : heroState === 1
        ? "2.2s"
        : "4.0s";

  const nodeGlowColor =
    heroState === 0
      ? "rgba(0, 240, 255, 0.08)"
      : heroState === 1
        ? "rgba(245, 158, 11, 0.12)"
        : "rgba(16, 185, 129, 0.1)";

  // Paths
  const paths = {
    podsLogs: "M 230 56 L 230 66",
    logsEngine: "M 230 100 L 230 108",
    engineMetrics: "M 210 154 C 210 168, 130 158, 130 172",
    engineSecurity: "M 250 154 C 250 168, 330 158, 330 172",
    metricsAuto: "M 130 210 C 130 222, 210 214, 210 222",
    securityAuto: "M 330 210 C 330 222, 250 214, 250 222",
    autoScale: "M 230 268 L 230 278",
    feedback: "M 140 315 C 50 315, 22 230, 22 160 C 22 90, 50 20, 140 20"
  };

  // Node styles
  const getNodeBorder = (nodeId: string) => {
    if (heroState === 0) {
      if (nodeId === "engine") return "rgba(0, 240, 255, 0.3)";
    } else if (heroState === 1) {
      if (nodeId === "logs") return "rgba(0, 240, 255, 0.3)";
      if (nodeId === "metrics") return "rgba(245, 158, 11, 0.4)";
      if (nodeId === "security") return "rgba(239, 68, 68, 0.4)";
      if (nodeId === "auto") return "rgba(245, 158, 11, 0.3)";
    } else if (heroState === 2) {
      if (nodeId === "pods" || nodeId === "scale") return "rgba(16, 185, 129, 0.4)";
    }
    return isLight ? "#e2e8f0" : "#1e293b";
  };

  const getNodeFilter = (nodeId: string) => {
    if (heroState === 0) {
      if (nodeId === "engine") return "url(#glow-node-cyan)";
    } else if (heroState === 1) {
      if (nodeId === "logs") return "url(#glow-node-cyan)";
      if (nodeId === "metrics") return "url(#glow-node-amber)";
      if (nodeId === "security") return "url(#glow-node-red)";
      if (nodeId === "auto") return "url(#glow-node-amber)";
    } else if (heroState === 2) {
      if (nodeId === "pods" || nodeId === "scale") return "url(#glow-node-emerald)";
    }
    return "none";
  };

  return (
    <div className="hero-dfd relative w-full select-none" id="hero-dfd-root">
      {/* CSS Stylesheet Injector for smooth fluid animations */}
      <style>{`
        .path-base {
          stroke: ${isLight ? "rgba(15, 23, 42, 0.05)" : "rgba(255, 255, 255, 0.03)"};
          stroke-width: 1px;
          fill: none;
          stroke-linecap: round;
        }

        .path-flow-glow {
          stroke-linecap: round;
          stroke-width: 1.2px;
          fill: none;
          filter: url(#glow-blur);
          stroke-dasharray: 10 90;
          animation: flow-offset var(--flow-dur, 6.0s) linear infinite;
        }

        @keyframes flow-offset {
          to {
            stroke-dashoffset: -100;
          }
        }

        .node-group {
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .node-group:hover {
          transform: translateY(-1px);
        }

        .node-rect {
          transition: stroke 0.4s ease, fill 0.4s ease, filter 0.4s ease;
        }

        .icon-spin {
          transform-box: fill-box;
          transform-origin: center;
          animation: spin-clockwise 180s linear infinite;
        }

        .icon-spin-reverse {
          transform-box: fill-box;
          transform-origin: center;
          animation: spin-counter 120s linear infinite;
        }

        .icon-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: ambient-pulse 4s ease-in-out infinite;
        }

        @keyframes spin-clockwise {
          to { transform: rotate(360deg); }
        }

        @keyframes spin-counter {
          to { transform: rotate(-360deg); }
        }

        @keyframes ambient-pulse {
          0%, 100% { opacity: 0.75; transform: scale(1); }
          50% { opacity: 0.95; transform: scale(1.02); }
        }

        .pulsing-indicator {
          animation: indicator-glowing 2s ease-in-out infinite;
        }

        @keyframes indicator-glowing {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Status bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 transition-colors duration-300"
            id="hero-state-label"
          >
            {stateLabel}
          </span>
        </div>
        <div
          className="font-mono text-[8px] text-zinc-600 transition-colors duration-300"
          id="hero-state-sync"
        >
          {syncLabel}
        </div>
      </div>

      {/* SVG Canvas — Widescreen structured layout */}
      <svg
        className="w-full h-auto overflow-visible"
        viewBox="0 0 460 335"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="LogStrata control-loop architecture"
        id="hero-svg"
      >
        <defs>
          {/* Laser trail glow filter */}
          <filter id="glow-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1.2 0" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Node external glow filters */}
          <filter id="glow-node-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#00f0ff" floodOpacity="0.08" />
          </filter>
          <filter id="glow-node-amber" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#f59e0b" floodOpacity="0.08" />
          </filter>
          <filter id="glow-node-emerald" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#10b981" floodOpacity="0.08" />
          </filter>
          <filter id="glow-node-red" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#ef4444" floodOpacity="0.12" />
          </filter>

          {/* Gradients along the connection curves */}
          <linearGradient id="grad-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="100%" stopColor="#7928ca" />
          </linearGradient>
          <linearGradient id="grad-amber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <linearGradient id="grad-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#00f0ff" />
          </linearGradient>
          <linearGradient id="grad-red" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#7928ca" />
          </linearGradient>

          {/* Node body background gradients */}
          <linearGradient id="node-bg-dark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f1013" />
            <stop offset="100%" stopColor="#050505" />
          </linearGradient>
          <linearGradient id="node-bg-light" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f8fafc" />
          </linearGradient>

          {/* Clip paths for nodes */}
          <clipPath id="hclip-200x46"><rect x="0" y="0" width="200" height="46" /></clipPath>
          <clipPath id="hclip-150x34"><rect x="0" y="0" width="150" height="34" /></clipPath>
          <clipPath id="hclip-160x38"><rect x="0" y="0" width="160" height="38" /></clipPath>
        </defs>

        {/* ═══════════ CONNECTOR PATHS ═══════════ */}
        {(() => {
          const flowGradient =
            heroState === 0
              ? "url(#grad-cyan)"
              : heroState === 1
                ? "url(#grad-amber)"
                : "url(#grad-emerald)";

          const styleRules = { "--flow-dur": flowDuration } as React.CSSProperties;

          return (
            <g id="connector-lines-group">
              {/* Pods → Logs */}
              <path id="cp-pods-logs" d={paths.podsLogs} className="path-base" />
              <path d={paths.podsLogs} className="path-flow-glow" stroke={flowGradient} style={styleRules} />

              {/* Logs → Engine */}
              <path id="cp-logs-engine" d={paths.logsEngine} className="path-base" />
              <path d={paths.logsEngine} className="path-flow-glow" stroke={flowGradient} style={styleRules} />

              {/* Engine → Metrics (curved left) */}
              <path id="cp-engine-metrics" d={paths.engineMetrics} className="path-base" />
              <path d={paths.engineMetrics} className="path-flow-glow" stroke={flowGradient} style={styleRules} />

              {/* Engine → Security (curved right) */}
              <path id="cp-engine-security" d={paths.engineSecurity} className="path-base" />
              <path
                d={paths.engineSecurity}
                className="path-flow-glow"
                stroke={heroState === 1 ? "url(#grad-red)" : flowGradient}
                style={styleRules}
              />

              {/* Metrics → Auto (curved in) */}
              <path id="cp-metrics-auto" d={paths.metricsAuto} className="path-base" />
              <path d={paths.metricsAuto} className="path-flow-glow" stroke={flowGradient} style={styleRules} />

              {/* Security → Auto (curved in) */}
              <path id="cp-security-auto" d={paths.securityAuto} className="path-base" />
              <path
                d={paths.securityAuto}
                className="path-flow-glow"
                stroke={heroState === 1 ? "url(#grad-red)" : flowGradient}
                style={styleRules}
              />

              {/* Auto → Scale */}
              <path id="cp-auto-scale" d={paths.autoScale} className="path-base" />
              <path d={paths.autoScale} className="path-flow-glow" stroke={flowGradient} style={styleRules} />

              {/* Feedback Loop */}
              <path id="cp-feedback" d={paths.feedback} className="path-base" strokeDasharray="3,5" />
              <path
                d={paths.feedback}
                className="path-flow-glow"
                stroke={flowGradient}
                style={{
                  ...styleRules,
                  strokeDasharray: "15 120",
                  animationDuration: heroState === 1 ? "3s" : "8s"
                }}
              />
            </g>
          );
        })()}

        {/* ═══════════ FLOWING GLOWING PARTICLES ═══════════ */}
        {(() => {
          const particleColor =
            heroState === 0
              ? "#00f0ff"
              : heroState === 1
                ? "#f59e0b"
                : "#10b981";

          const secParticleColor = heroState === 1 ? "#ef4444" : particleColor;

          return (
            <g id="animated-particles-group">
              {/* Pods → Logs */}
              <g className="particle-glow-group">
                <circle r="4.5" fill={particleColor} filter="url(#glow-blur)" opacity="0.8" />
                <circle r="1.5" fill="#ffffff" />
                <animateMotion dur={flowDuration} repeatCount="indefinite">
                  <mpath href="#cp-pods-logs" />
                </animateMotion>
              </g>

              {/* Logs → Engine */}
              <g className="particle-glow-group">
                <circle r="4.5" fill={particleColor} filter="url(#glow-blur)" opacity="0.8" />
                <circle r="1.5" fill="#ffffff" />
                <animateMotion dur={flowDuration} repeatCount="indefinite" begin="0.2s">
                  <mpath href="#cp-logs-engine" />
                </animateMotion>
              </g>
              <g className="particle-glow-group">
                <circle r="3.5" fill={particleColor} filter="url(#glow-blur)" opacity="0.5" />
                <circle r="1" fill="#ffffff" />
                <animateMotion dur={flowDuration} repeatCount="indefinite" begin="0.7s">
                  <mpath href="#cp-logs-engine" />
                </animateMotion>
              </g>

              {/* Engine → Metrics */}
              <g className="particle-glow-group">
                <circle r="4.5" fill={particleColor} filter="url(#glow-blur)" opacity="0.8" />
                <circle r="1.5" fill="#ffffff" />
                <animateMotion dur={flowDuration} repeatCount="indefinite" begin="0.1s">
                  <mpath href="#cp-engine-metrics" />
                </animateMotion>
              </g>
              <g className="particle-glow-group">
                <circle r="3.5" fill={particleColor} filter="url(#glow-blur)" opacity="0.5" />
                <circle r="1" fill="#ffffff" />
                <animateMotion dur={flowDuration} repeatCount="indefinite" begin="0.6s">
                  <mpath href="#cp-engine-metrics" />
                </animateMotion>
              </g>

              {/* Engine → Security */}
              <g className="particle-glow-group">
                <circle r="4.5" fill={secParticleColor} filter="url(#glow-blur)" opacity="0.8" />
                <circle r="1.5" fill="#ffffff" />
                <animateMotion dur={flowDuration} repeatCount="indefinite" begin="0.3s">
                  <mpath href="#cp-engine-security" />
                </animateMotion>
              </g>
              <g className="particle-glow-group">
                <circle r="3.5" fill={secParticleColor} filter="url(#glow-blur)" opacity="0.5" />
                <circle r="1" fill="#ffffff" />
                <animateMotion dur={flowDuration} repeatCount="indefinite" begin="0.8s">
                  <mpath href="#cp-engine-security" />
                </animateMotion>
              </g>

              {/* Metrics → Auto */}
              <g className="particle-glow-group">
                <circle r="4.5" fill={particleColor} filter="url(#glow-blur)" opacity="0.8" />
                <circle r="1.5" fill="#ffffff" />
                <animateMotion dur={flowDuration} repeatCount="indefinite" begin="0.4s">
                  <mpath href="#cp-metrics-auto" />
                </animateMotion>
              </g>

              {/* Security → Auto */}
              <g className="particle-glow-group">
                <circle r="4.5" fill={secParticleColor} filter="url(#glow-blur)" opacity="0.8" />
                <circle r="1.5" fill="#ffffff" />
                <animateMotion dur={flowDuration} repeatCount="indefinite" begin="0.5s">
                  <mpath href="#cp-security-auto" />
                </animateMotion>
              </g>

              {/* Auto → Scale */}
              <g className="particle-glow-group">
                <circle r="4.5" fill={particleColor} filter="url(#glow-blur)" opacity="0.8" />
                <circle r="1.5" fill="#ffffff" />
                <animateMotion dur={flowDuration} repeatCount="indefinite" begin="0.2s">
                  <mpath href="#cp-auto-scale" />
                </animateMotion>
              </g>

              {/* Feedback loop */}
              <g className="particle-glow-group">
                <circle r="4" fill={particleColor} filter="url(#glow-blur)" opacity="0.4" />
                <circle r="1" fill="#ffffff" />
                <animateMotion dur={heroState === 1 ? "4s" : "10s"} repeatCount="indefinite" begin="0.5s">
                  <mpath href="#cp-feedback" />
                </animateMotion>
              </g>
            </g>
          );
        })()}

        {/* ═══════════ SYSTEM NODES ═══════════ */}
        {(() => {
          const textX = 44;
          const textXLogs = 36;
          const nodeBg = isLight ? "url(#node-bg-light)" : "url(#node-bg-dark)";

          return (
            <g id="system-nodes-group">
              {/* 1. Kubernetes Pods */}
              <g transform="translate(130, 10)" className="node-group cursor-pointer" clipPath="url(#hclip-200x46)">
                <rect
                  id="hn-pods"
                  x="0"
                  y="0"
                  width="200"
                  height="46"
                  rx="6"
                  fill={nodeBg}
                  stroke={getNodeBorder("pods")}
                  strokeWidth="1"
                  className="node-rect"
                  style={{
                    filter: getNodeFilter("pods"),
                    transition: "stroke 0.4s ease, filter 0.4s ease",
                  }}
                />
                <g>
                  <rect
                    x="8"
                    y="9"
                    width="28"
                    height="28"
                    rx="6"
                    fill={isLight ? "#eff6ff" : "rgba(59, 130, 246, 0.08)"}
                    stroke={isLight ? "#bfdbfe" : "rgba(59, 130, 246, 0.2)"}
                    strokeWidth="1"
                  />
                  <g className="icon-spin" stroke={isLight ? "#2563eb" : "#60a5fa"} strokeWidth="1.25" fill="none">
                    <circle cx="22" cy="23" r="7" />
                    <ellipse cx="22" cy="23" rx="2.2" ry="7" />
                    <line x1="15" y1="23" x2="29" y2="23" />
                  </g>
                </g>
                <text
                  x={textX}
                  y={20}
                  fill={isLight ? "#0f172a" : "#e4e4e7"}
                  fontFamily="Inter, system-ui, sans-serif"
                  fontSize="10"
                  fontWeight="600"
                >
                  Kubernetes Pods
                </text>
                <text
                  id="hval-pods-reps"
                  x={textX}
                  y="32"
                  fill={isLight ? "#64748b" : "#71717a"}
                  fontFamily="'JetBrains Mono', monospace"
                  fontSize="7.5"
                >
                  {podsReps}
                </text>
                <circle cx="184" cy="20" r="3.5" fill={podsDotColor} id="hdot-pods" className="pulsing-indicator" />
              </g>

              {/* 2. stdout logs stream */}
              <g transform="translate(155, 66)" className="node-group cursor-pointer" clipPath="url(#hclip-150x34)">
                <rect
                  id="hn-logs"
                  x="0"
                  y="0"
                  width="150"
                  height="34"
                  rx="5"
                  fill={nodeBg}
                  stroke={getNodeBorder("logs")}
                  strokeWidth="1"
                  className="node-rect"
                  style={{
                    filter: getNodeFilter("logs"),
                    transition: "stroke 0.4s ease, filter 0.4s ease",
                  }}
                />
                <g>
                  <rect
                    x="6"
                    y="6"
                    width="22"
                    height="22"
                    rx="4"
                    fill={isLight ? "#ecfeff" : "rgba(6, 182, 212, 0.08)"}
                    stroke={isLight ? "#a5f3fc" : "rgba(6, 182, 212, 0.2)"}
                    strokeWidth="1"
                  />
                  <g className="icon-pulse" stroke={isLight ? "#0891b2" : "#22d3ee"} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none">
                    <path d="M 13 11 H 19 L 21 13 V 21 H 13 Z" />
                    <path d="M 19 11 V 13 H 21" />
                  </g>
                </g>
                <text
                  x={textXLogs}
                  y={16}
                  fill={isLight ? "#0f172a" : "#e4e4e7"}
                  fontFamily="Inter, system-ui, sans-serif"
                  fontSize="9"
                  fontWeight="600"
                >
                  stdout log stream
                </text>
                <text
                  id="hval-logs-rate"
                  x={textXLogs}
                  y={27}
                  fill={isLight ? "#4f46e5" : "#00f0ff"}
                  fontFamily="'JetBrains Mono', monospace"
                  fontSize="7.5"
                >
                  {logsRate}
                </text>
              </g>

              {/* 3. LogStrata Engine */}
              <g transform="translate(130, 108)" className="node-group cursor-pointer" clipPath="url(#hclip-200x46)">
                <rect
                  id="hn-engine"
                  x="0"
                  y="0"
                  width="200"
                  height="46"
                  rx="6"
                  fill={nodeBg}
                  stroke={getNodeBorder("engine")}
                  strokeWidth="1"
                  className="node-rect"
                  style={{
                    filter: getNodeFilter("engine"),
                    transition: "stroke 0.4s ease, filter 0.4s ease",
                  }}
                />
                <g>
                  <rect
                    x="8"
                    y="9"
                    width="28"
                    height="28"
                    rx="6"
                    fill={isLight ? "#eef2ff" : "rgba(99, 102, 241, 0.08)"}
                    stroke={isLight ? "#c7d2fe" : "rgba(99, 102, 241, 0.2)"}
                    strokeWidth="1"
                  />
                  <g className="icon-spin-reverse" stroke={isLight ? "#4f46e5" : "#818cf8"} strokeWidth="1.25" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M 22 13 L 28 16.5 V 25.5 L 22 29 L 16 25.5 V 16.5 Z" />
                    <line x1="19" y1="18" x2="25" y2="18" />
                    <line x1="19" y1="21" x2="25" y2="21" />
                    <line x1="19" y1="24" x2="25" y2="24" />
                  </g>
                </g>
                <text
                  x={textX}
                  y={20}
                  fill={isLight ? "#0f172a" : "#e4e4e7"}
                  fontFamily="Inter, system-ui, sans-serif"
                  fontSize="10"
                  fontWeight="600"
                >
                  LogStrata Engine
                </text>
                <text
                  id="hval-engine-status"
                  x={textX}
                  y="32"
                  fill={isLight ? "#64748b" : "#71717a"}
                  fontFamily="'JetBrains Mono', monospace"
                  fontSize="7.5"
                >
                  {engineStatus}
                </text>
              </g>

              {/* 4a. Metrics Engine (pill) */}
              <g transform="translate(50, 172)" className="node-group cursor-pointer" clipPath="url(#hclip-160x38)">
                <rect
                  id="hn-metrics"
                  x="0"
                  y="0"
                  width="160"
                  height="38"
                  rx="19"
                  fill={nodeBg}
                  stroke={getNodeBorder("metrics")}
                  strokeWidth="1"
                  className="node-rect"
                  style={{
                    filter: getNodeFilter("metrics"),
                    transition: "stroke 0.4s ease, filter 0.4s ease",
                  }}
                />
                <text
                  x="16"
                  y="15"
                  fill={isLight ? "#0f172a" : "#e4e4e7"}
                  fontFamily="Inter, system-ui, sans-serif"
                  fontSize="9"
                  fontWeight="600"
                >
                  Metrics Engine
                </text>
                <text
                  id="hval-metrics-latency"
                  x="16"
                  y="27"
                  fill={isLight && metricsColor === "#10b981" ? "#6366f1" : metricsColor}
                  fontFamily="'JetBrains Mono', monospace"
                  fontSize="7.5"
                >
                  {metricsLatency}
                </text>
              </g>

              {/* 4b. Security Analytics (pill) */}
              <g transform="translate(250, 172)" className="node-group cursor-pointer" clipPath="url(#hclip-160x38)">
                <rect
                  id="hn-security"
                  x="0"
                  y="0"
                  width="160"
                  height="38"
                  rx="19"
                  fill={nodeBg}
                  stroke={getNodeBorder("security")}
                  strokeWidth="1"
                  className="node-rect"
                  style={{
                    filter: getNodeFilter("security"),
                    transition: "stroke 0.4s ease, filter 0.4s ease",
                  }}
                />
                <text
                  x="16"
                  y="15"
                  fill={isLight ? "#0f172a" : "#e4e4e7"}
                  fontFamily="Inter, system-ui, sans-serif"
                  fontSize="9"
                  fontWeight="600"
                >
                  Security Analytics
                </text>
                <text
                  id="hval-security-status"
                  x="16"
                  y="27"
                  fill={isLight && securityColor === "#10b981" ? "#6366f1" : securityColor}
                  fontFamily="'JetBrains Mono', monospace"
                  fontSize="7.5"
                >
                  {securityStatus}
                </text>
              </g>

              {/* 5. Autoscaler */}
              <g transform="translate(130, 222)" className="node-group cursor-pointer" clipPath="url(#hclip-200x46)">
                <rect
                  id="hn-auto"
                  x="0"
                  y="0"
                  width="200"
                  height="46"
                  rx="6"
                  fill={nodeBg}
                  stroke={getNodeBorder("auto")}
                  strokeWidth="1"
                  className="node-rect"
                  style={{
                    filter: getNodeFilter("auto"),
                    transition: "stroke 0.4s ease, filter 0.4s ease",
                  }}
                />
                <g>
                  <rect
                    x="8"
                    y="9"
                    width="28"
                    height="28"
                    rx="6"
                    fill={isLight ? "#f0fdf4" : "rgba(16, 185, 129, 0.08)"}
                    stroke={isLight ? "#bbf7d0" : "rgba(16, 185, 129, 0.2)"}
                    strokeWidth="1"
                  />
                  <g className="icon-pulse" stroke={isLight ? "#16a34a" : "#10b981"} strokeWidth="1.25" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="22" cy="23" r="8" />
                    <path d="M 16 23 Q 19 18 22 23 T 28 23" />
                  </g>
                </g>
                <text
                  x={textX}
                  y={20}
                  fill={isLight ? "#0f172a" : "#e4e4e7"}
                  fontFamily="Inter, system-ui, sans-serif"
                  fontSize="10"
                  fontWeight="600"
                >
                  Autoscaler
                </text>
                <text
                  id="hval-auto-factor"
                  x={textX}
                  y="32"
                  fill={isLight ? "#64748b" : "#71717a"}
                  fontFamily="'JetBrains Mono', monospace"
                  fontSize="7.5"
                >
                  {autoFactor}
                </text>
              </g>

              {/* 6. Cluster Scaling */}
              <g transform="translate(130, 278)" className="node-group cursor-pointer" clipPath="url(#hclip-200x46)">
                <rect
                  id="hn-scale"
                  x="0"
                  y="0"
                  width="200"
                  height="46"
                  rx="6"
                  fill={nodeBg}
                  stroke={getNodeBorder("scale")}
                  strokeWidth="1"
                  className="node-rect"
                  style={{
                    filter: getNodeFilter("scale"),
                    transition: "stroke 0.4s ease, filter 0.4s ease",
                  }}
                />
                <g>
                  <rect
                    x="8"
                    y="9"
                    width="28"
                    height="28"
                    rx="6"
                    fill={isLight ? "#f0fdf4" : "rgba(16, 185, 129, 0.08)"}
                    stroke={isLight ? "#bbf7d0" : "rgba(16, 185, 129, 0.2)"}
                    strokeWidth="1"
                  />
                  <g className="icon-pulse" stroke={isLight ? "#16a34a" : "#10b981"} strokeWidth="1.25" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="22" cy="23" r="8" />
                    <path d="M 18 23 L 21 26 L 26 19" />
                  </g>
                </g>
                <text
                  x={textX}
                  y={20}
                  fill={isLight ? "#0f172a" : "#e4e4e7"}
                  fontFamily="Inter, system-ui, sans-serif"
                  fontSize="10"
                  fontWeight="600"
                >
                  Cluster Scaling
                </text>
                <text
                  id="hval-scale-status"
                  x={44}
                  y="32"
                  fill="#10b981"
                  fontFamily="'JetBrains Mono', monospace"
                  fontSize="7.5"
                >
                  {scaleStatus}
                </text>
              </g>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
