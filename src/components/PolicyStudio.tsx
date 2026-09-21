"use client";

import React, { useState } from "react";
import { Copy, Check, Sliders, Shield, Download } from "lucide-react";

export function PolicyStudio() {
  const [deploymentName, setDeploymentName] = useState("commerce-frontend");
  const [targetRPS, setTargetRPS] = useState(120);
  const [headroom, setHeadroom] = useState(1.2);
  const [minReplicas, setMinReplicas] = useState(3);
  const [maxReplicas, setMaxReplicas] = useState(25);
  const [lockOnThreat, setLockOnThreat] = useState(true);
  const [autoBlockIPs, setAutoBlockIPs] = useState(true);
  const [copied, setCopied] = useState(false);

  const generatedYAML = `# LogStrata Custom Resource Definition Policy
apiVersion: logstrata.io/v1alpha1
kind: LogThreatPolicy
metadata:
  name: ${deploymentName}-policy
  namespace: default
spec:
  targetDeployment:
    name: ${deploymentName}
    namespace: default
  scalingRules:
    minReplicas: ${minReplicas}
    maxReplicas: ${maxReplicas}
    targetRPSPerPod: ${targetRPS}
    targetP95LatencyMs: 250
    scaleUpCooldownSec: 15
    scaleDownCooldownSec: 90
    panicScaleFactor: ${headroom.toFixed(1)}
  threatDetection:
    bruteForceThresholdRPS: 40
    errorRatioThresholdPct: 20.0
    scaleDownLockoutSec: ${lockOnThreat ? 300 : 0}
    dynamicNetworkPolicy:
      enabled: ${autoBlockIPs}
      blockTTLSec: 600
  notifications:
    slackWebhookURL: ""
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedYAML);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedYAML], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deploymentName}-policy.yaml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full rounded-2xl border border-hairline bg-canvas-soft/80 backdrop-blur-md p-6 shadow-xl text-ink font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-hairline">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink flex items-center gap-2">
              Visual Policy Studio
              <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-medium">
                v1alpha1
              </span>
            </h3>
            <p className="text-xs text-mute font-light">
              Design and synthesize atomic Kubernetes autoscaling and active edge threat policies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
        {/* Left Column: Interactive Controls */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          {/* Target Workload */}
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

        {/* Right Column: Real-Time YAML Output */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-hairline text-xs font-mono text-mute">
            <span>generated-crd-manifest.yaml</span>
            <span className="text-emerald-500 flex items-center gap-1 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              VALID OPENAPI V3
            </span>
          </div>
          <div className="p-4 rounded-xl bg-black/90 dark:bg-black font-mono text-[11px] leading-relaxed text-emerald-400 overflow-x-auto border border-hairline/40 h-full min-h-[360px]">
            <pre className="select-text">{generatedYAML}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
