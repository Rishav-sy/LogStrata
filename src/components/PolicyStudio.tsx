"use client";

import React, { useState } from "react";
import { Copy, Check, Sliders, Shield, Download, Terminal, Sparkles } from "lucide-react";

type PolicyType = "autoscaler" | "threat" | "ratelimit";
type RateLimitBackend = "nginx" | "envoy" | "traefik" | "cilium";

interface Preset {
  name: string;
  deployment: string;
  targetRPS: number;
  headroom: number;
  minReplicas: number;
  maxReplicas: number;
  lockThreat: boolean;
  blockIPs: boolean;
}

const PRESETS: Record<string, Preset> = {
  ecommerce: {
    name: "E-Commerce Flash Sale",
    deployment: "storefront-checkout",
    targetRPS: 220,
    headroom: 1.35,
    minReplicas: 4,
    maxReplicas: 35,
    lockThreat: true,
    blockIPs: true,
  },
  ai: {
    name: "LLM API Gateway",
    deployment: "inference-gateway",
    targetRPS: 45,
    headroom: 1.5,
    minReplicas: 2,
    maxReplicas: 20,
    lockThreat: true,
    blockIPs: true,
  },
  fintech: {
    name: "FinTech Auth Shield",
    deployment: "auth-service",
    targetRPS: 120,
    headroom: 1.2,
    minReplicas: 3,
    maxReplicas: 25,
    lockThreat: true,
    blockIPs: true,
  },
};

export function PolicyStudio() {
  const [activeTab, setActiveTab] = useState<PolicyType>("autoscaler");
  const [rateLimitBackend, setRateLimitBackend] = useState<RateLimitBackend>("nginx");
  const [deploymentName, setDeploymentName] = useState("commerce-frontend");
  const [targetRPS, setTargetRPS] = useState(120);
  const [headroom, setHeadroom] = useState(1.25);
  const [minReplicas, setMinReplicas] = useState(3);
  const [maxReplicas, setMaxReplicas] = useState(25);
  const [lockOnThreat, setLockOnThreat] = useState(true);
  const [autoBlockIPs, setAutoBlockIPs] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedKubectl, setCopiedKubectl] = useState(false);

  const applyPreset = (preset: Preset) => {
    setDeploymentName(preset.deployment);
    setTargetRPS(preset.targetRPS);
    setHeadroom(preset.headroom);
    setMinReplicas(preset.minReplicas);
    setMaxReplicas(preset.maxReplicas);
    setLockOnThreat(preset.lockThreat);
    setAutoBlockIPs(preset.blockIPs);
  };

  // 1. LogAutoscalerPolicy CRD
  const autoscalerYAML = `# LogStrata Proactive Autoscaler Custom Resource Definition
apiVersion: core.logstrata.io/v1alpha1
kind: LogAutoscalerPolicy
metadata:
  name: ${deploymentName}-scaler
  namespace: default
  labels:
    app.kubernetes.io/managed-by: logstrata
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${deploymentName}
  minReplicas: ${minReplicas}
  maxReplicas: ${maxReplicas}
  targetRPSPerPod: ${targetRPS}.0
  headroomFactor: ${headroom.toFixed(2)}
  rules:
    - metric: "http_requests_per_second"
      threshold: ${(targetRPS * minReplicas).toFixed(1)}
      window: "10s"
      action: "scale_up"
  security:
    lockScaleDownOnThreat: ${lockOnThreat}
    autoBlockMaliciousIPs: ${autoBlockIPs}
    threatThreshold: 50.0
`;

  // 2. LogThreatPolicy CRD
  const threatYAML = `# LogStrata Dynamic Ingress Threat Mitigation Policy
apiVersion: security.logstrata.io/v1alpha1
kind: LogThreatPolicy
metadata:
  name: ${deploymentName}-threat-defense
  namespace: default
  labels:
    app.kubernetes.io/managed-by: logstrata
spec:
  targetIngressRef:
    apiVersion: networking.k8s.io/v1
    kind: Ingress
    name: ${deploymentName}-ingress
  threatMetrics:
    - type: "RegexPatternMatch"
      pattern: "(union.*select|exec.*xp_|/etc/passwd)"
      thresholdPerMinute: 20
      action:
        - type: "IPBlocklist"
          duration: "30m"
          blocklistConfigMap: "${deploymentName}-blocked-ips"
        - type: "ScalingModifierLock"
          lockMinReplicas: ${Math.max(minReplicas, 6)}
`;

  // 3. Multi-Backend Rate Limiter Configuration
  const getRateLimitYAML = () => {
    switch (rateLimitBackend) {
      case "nginx":
        return `# NGINX Ingress Rate-Limiting Annotation Snippet
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${deploymentName}-ratelimit
  namespace: default
  annotations:
    nginx.ingress.kubernetes.io/limit-rps: "${targetRPS}"
    nginx.ingress.kubernetes.io/limit-burst-multiplier: "${Math.round(headroom * 2)}"
    nginx.ingress.kubernetes.io/limit-whitelist: "10.0.0.0/8,172.16.0.0/12"
spec:
  ingressClassName: nginx
  rules:
    - http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: ${deploymentName}
                port:
                  number: 80
`;
      case "envoy":
        return `# Envoy Proxy Global RateLimit Service Config
domain: ${deploymentName}-ratelimit
descriptors:
  - key: remote_address
    rate_limit:
      unit: second
      requests_per_unit: ${targetRPS}
  - key: path
    value: /api/v1/auth
    rate_limit:
      unit: minute
      requests_per_unit: 60
`;
      case "traefik":
        return `# Traefik Middleware RateLimit Manifest
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: ${deploymentName}-ratelimit
  namespace: default
spec:
  rateLimit:
    average: ${targetRPS}
    burst: ${Math.round(targetRPS * headroom)}
    period: 1s
    sourceCriterion:
      ipStrategy:
        depth: 1
`;
      case "cilium":
        return `# Cilium eBPF Clusterwide Host Network Policy
apiVersion: cilium.io/v2
kind: CiliumClusterwideNetworkPolicy
metadata:
  name: ${deploymentName}-ebpf-ingress-shield
  labels:
    app.kubernetes.io/managed-by: logstrata
spec:
  nodeSelector:
    matchLabels: {}
  ingressDeny:
    - fromCIDR:
        - "185.220.101.5/32"
        - "198.51.100.42/32"
`;
    }
  };

  const currentYAML =
    activeTab === "autoscaler"
      ? autoscalerYAML
      : activeTab === "threat"
      ? threatYAML
      : getRateLimitYAML();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentYAML);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyKubectl = () => {
    const cmd = `cat <<EOF | kubectl apply -f -\n${currentYAML}\nEOF`;
    navigator.clipboard.writeText(cmd);
    setCopiedKubectl(true);
    setTimeout(() => setCopiedKubectl(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentYAML], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deploymentName}-${activeTab}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full rounded-2xl border border-hairline bg-canvas-soft/80 backdrop-blur-md p-6 shadow-xl text-ink font-sans">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-hairline">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink flex items-center gap-2">
              Visual Policy Studio
              <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-medium">
                OpenAPI v3
              </span>
            </h3>
            <p className="text-xs text-mute font-light">
              Synthesize validated Custom Resource Definitions and multi-backend ingress security policies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyKubectl}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-hairline bg-canvas hover:bg-canvas-soft text-xs font-mono text-ink transition-colors cursor-pointer"
            title="Copy one-liner cat <<EOF | kubectl apply -f -"
          >
            {copiedKubectl ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500">Copied kubectl</span>
              </>
            ) : (
              <>
                <Terminal className="w-3.5 h-3.5 text-purple-400" />
                <span>Copy kubectl</span>
              </>
            )}
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-hairline bg-canvas hover:bg-canvas-soft text-xs font-mono text-ink transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy YAML</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-hairline bg-canvas hover:bg-canvas-soft text-xs font-mono text-ink transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="pt-4 pb-2 flex items-center gap-2 flex-wrap text-xs">
        <span className="font-mono text-[10px] uppercase text-mute tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" /> Presets:
        </span>
        {Object.entries(PRESETS).map(([key, p]) => (
          <button
            key={key}
            onClick={() => applyPreset(p)}
            className="px-2.5 py-1 rounded-md border border-hairline bg-canvas hover:border-primary/50 text-[11px] font-medium text-body hover:text-ink transition-all cursor-pointer"
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
        {/* Left Column: Interactive Controls */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          {/* Target Workload Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-ink flex items-center justify-between">
              <span>Target Workload Name</span>
              <span className="font-mono text-[10px] text-mute">apps/v1 Deployment</span>
            </label>
            <input
              type="text"
              value={deploymentName}
              onChange={(e) => setDeploymentName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              className="px-3 py-2 rounded-lg bg-canvas border border-hairline text-xs font-mono focus:outline-none focus:border-primary text-ink"
              placeholder="e.g. commerce-frontend"
            />
          </div>

          {/* Target RPS per Pod */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-ink">
              <span>RPS Capacity Per Pod</span>
              <span className="font-mono font-semibold text-primary">{targetRPS} req/s</span>
            </div>
            <input
              type="range"
              min="20"
              max="500"
              step="10"
              value={targetRPS}
              onChange={(e) => setTargetRPS(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <span className="text-[10.5px] text-mute font-light">
              Maximum concurrent throughput a single pod handles before scale-up triggers.
            </span>
          </div>

          {/* Headroom Factor */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-ink">
              <span>Safety Headroom Multiplier</span>
              <span className="font-mono font-semibold text-primary">{headroom.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="2.0"
              step="0.05"
              value={headroom}
              onChange={(e) => setHeadroom(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <span className="text-[10.5px] text-mute font-light">
              Proactive capacity buffer allocated in advance of traffic surges.
            </span>
          </div>

          {/* Bounds: Min / Max Replicas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink">Min Replicas</label>
              <input
                type="number"
                min="1"
                max={maxReplicas - 1}
                value={minReplicas}
                onChange={(e) => setMinReplicas(Number(e.target.value))}
                className="px-3 py-2 rounded-lg bg-canvas border border-hairline text-xs font-mono focus:outline-none focus:border-primary text-ink"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink">Max Replicas</label>
              <input
                type="number"
                min={minReplicas + 1}
                max="100"
                value={maxReplicas}
                onChange={(e) => setMaxReplicas(Number(e.target.value))}
                className="px-3 py-2 rounded-lg bg-canvas border border-hairline text-xs font-mono focus:outline-none focus:border-primary text-ink"
              />
            </div>
          </div>

          {/* Security & Ingress Mitigations */}
          <div className="flex flex-col gap-3 pt-2 border-t border-hairline">
            <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-rose-500" />
              Ingress & SecOps Defense Flags
            </span>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={lockOnThreat}
                onChange={(e) => setLockOnThreat(e.target.checked)}
                className="rounded accent-primary cursor-pointer"
              />
              <span className="text-body font-light">
                <strong className="font-medium text-ink">Lock Scale-Down:</strong> Suppress HPA cooldown during ongoing brute-force or DDoS attacks.
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={autoBlockIPs}
                onChange={(e) => setAutoBlockIPs(e.target.checked)}
                className="rounded accent-primary cursor-pointer"
              />
              <span className="text-body font-light">
                <strong className="font-medium text-ink">Auto-Block Malicious IPs:</strong> Synthesize dynamic NetworkPolicy ingress CIDR drop rules.
              </span>
            </label>
          </div>
        </div>

        {/* Right Column: Multi-Tab Manifest Preview */}
        <div className="lg:col-span-6 flex flex-col">
          {/* Tabs */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-hairline text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab("autoscaler")}
                className={`px-2.5 py-1 rounded-md font-mono text-[11px] transition-colors cursor-pointer ${
                  activeTab === "autoscaler"
                    ? "bg-primary/20 text-primary font-bold border border-primary/30"
                    : "text-mute hover:text-ink"
                }`}
              >
                LogAutoscalerPolicy
              </button>
              <button
                onClick={() => setActiveTab("threat")}
                className={`px-2.5 py-1 rounded-md font-mono text-[11px] transition-colors cursor-pointer ${
                  activeTab === "threat"
                    ? "bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30"
                    : "text-mute hover:text-ink"
                }`}
              >
                LogThreatPolicy
              </button>
              <button
                onClick={() => setActiveTab("ratelimit")}
                className={`px-2.5 py-1 rounded-md font-mono text-[11px] transition-colors cursor-pointer ${
                  activeTab === "ratelimit"
                    ? "bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30"
                    : "text-mute hover:text-ink"
                }`}
              >
                RateLimiter
              </button>
            </div>

            {activeTab === "ratelimit" ? (
              <select
                value={rateLimitBackend}
                onChange={(e) => setRateLimitBackend(e.target.value as RateLimitBackend)}
                className="bg-canvas border border-hairline rounded px-2 py-0.5 font-mono text-[10px] text-ink focus:outline-none"
              >
                <option value="nginx">NGINX Ingress</option>
                <option value="envoy">Envoy Proxy</option>
                <option value="traefik">Traefik</option>
                <option value="cilium">Cilium eBPF</option>
              </select>
            ) : (
              <span className="text-emerald-500 flex items-center gap-1 text-[10px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                CRD VALIDATED
              </span>
            )}
          </div>

          <div className="p-4 rounded-xl bg-black/90 dark:bg-black font-mono text-[11px] leading-relaxed text-emerald-400 overflow-x-auto border border-hairline/40 h-full min-h-[360px]">
            <pre className="select-text">{currentYAML}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
