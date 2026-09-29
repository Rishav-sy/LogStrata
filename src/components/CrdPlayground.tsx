"use client";

import React, { useState, useMemo } from "react";
import { Check, Copy, Download, Sliders, Shield, Terminal, AlertCircle, CheckCircle2 } from "lucide-react";

type PolicyType = "autoscaler" | "threat" | "ratelimit";

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function CrdPlayground() {
  const [policyType, setPolicyType] = useState<PolicyType>("autoscaler");
  const [deploymentName, setDeploymentName] = useState("api-gateway");
  const [namespace, setNamespace] = useState("production");
  const [minReplicas, setMinReplicas] = useState(3);
  const [maxReplicas, setMaxReplicas] = useState(30);
  const [targetRPS, setTargetRPS] = useState(120);
  const [headroom, setHeadroom] = useState(1.25);
  const [scaleUpCooldown, setScaleUpCooldown] = useState(15);
  const [scaleDownCooldown, setScaleDownCooldown] = useState(90);
  const [lockOnThreat, setLockOnThreat] = useState(true);
  const [quarantineNetpol, setQuarantineNetpol] = useState(true);
  const [copied, setCopied] = useState(false);

  // Validate CRD constraints in real-time
  const validation: ValidationResult = useMemo(() => {
    const errs: string[] = [];
    const dns1123Regex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

    if (!dns1123Regex.test(deploymentName)) {
      errs.push("Deployment name must comply with RFC 1123 DNS label format (lowercase letters, numbers, hyphens)");
    }
    if (!dns1123Regex.test(namespace)) {
      errs.push("Namespace must comply with RFC 1123 DNS label format");
    }
    if (minReplicas < 1) {
      errs.push("minReplicas must be at least 1");
    }
    if (minReplicas > maxReplicas) {
      errs.push(`minReplicas (${minReplicas}) cannot exceed maxReplicas (${maxReplicas})`);
    }
    if (headroom < 1.0) {
      errs.push("headroomFactor must be at least 1.00");
    }
    if (targetRPS < 1) {
      errs.push("targetRPSPerPod must be greater than 0");
    }

    return {
      valid: errs.length === 0,
      errors: errs,
    };
  }, [deploymentName, namespace, minReplicas, maxReplicas, headroom, targetRPS]);

  // Generate dynamic YAML
  const generatedYaml = useMemo(() => {
    if (policyType === "autoscaler") {
      return `# LogStrata Proactive Autoscaler Custom Resource Definition
apiVersion: core.logstrata.io/v1alpha1
kind: LogAutoscalerPolicy
metadata:
  name: ${deploymentName}-autoscaler
  namespace: ${namespace}
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
  cooldown:
    scaleUpSec: ${scaleUpCooldown}
    scaleDownSec: ${scaleDownCooldown}
  rules:
    - metric: "http_requests_per_second"
      threshold: ${(targetRPS * minReplicas).toFixed(1)}
      window: "10s"
      action: "scale_up"
  security:
    lockScaleDownOnThreat: ${lockOnThreat}
    dynamicNetworkPolicy: ${quarantineNetpol}
`;
    }

    if (policyType === "threat") {
      return `# LogStrata Threat Detection & Auto-Quarantine Policy
apiVersion: security.logstrata.io/v1alpha1
kind: LogThreatPolicy
metadata:
  name: ${deploymentName}-threat-defense
  namespace: ${namespace}
  labels:
    app.kubernetes.io/managed-by: logstrata
spec:
  targetDeploymentRef:
    name: ${deploymentName}
    namespace: ${namespace}
  threatTriggers:
    - type: "RegexPatternMatch"
      pattern: "(401|403|auth_fail|invalid_token)"
      thresholdPerMinute: 45
      action: "quarantine_ip"
  actions:
    quarantineTTLSec: 600
    lockdownMinimumReplicas: ${Math.max(minReplicas, 6)}
    generateNetworkPolicy: ${quarantineNetpol}
  notifications:
    slackWebhookSecretRef:
      name: logstrata-alerts
      key: slack-webhook-url
`;
    }

    return `# LogStrata Multi-Backend Rate Limit Specification
apiVersion: networking.logstrata.io/v1alpha1
kind: MultiBackendRateLimit
metadata:
  name: ${deploymentName}-ratelimit
  namespace: ${namespace}
spec:
  backends:
    - engine: "nginx"
      zoneSize: "10m"
      rate: "${Math.round(targetRPS * 1.2)}r/s"
      burst: ${Math.round(targetRPS * 0.4)}
    - engine: "envoy"
      domain: "${deploymentName}-routes"
      requestsPerUnit: ${Math.round(targetRPS * 1.2)}
      unit: "SECOND"
    - engine: "cilium"
      enforceEgressNetpol: true
`;
  }, [
    policyType,
    deploymentName,
    namespace,
    minReplicas,
    maxReplicas,
    targetRPS,
    headroom,
    scaleUpCooldown,
    scaleDownCooldown,
    lockOnThreat,
    quarantineNetpol,
  ]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedYaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedYaml], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deploymentName}-${policyType}-policy.yaml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full rounded-[8px] border border-hairline bg-canvas p-6 shadow-diffused my-6">
      {/* Playground Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono font-bold mb-1">
            <Sliders className="h-3 w-3" />
            <span>INTERACTIVE CRD POLICY PLAYGROUND</span>
          </div>
          <h3 className="text-base font-bold text-ink">Declarative Spec Builder & Schema Validator</h3>
          <p className="text-xs text-body mt-0.5">
            Configure target parameters to synthesize production-ready, validated Kubernetes custom resources.
          </p>
        </div>

        {/* Validation Status Badge */}
        <div>
          {validation.valid ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>SCHEMA: VALID</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-error/10 border border-error/20 text-error text-xs font-mono font-bold">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{validation.errors.length} SCHEMA ERRORS</span>
            </div>
          )}
        </div>
      </div>

      {/* Policy Type Tabs */}
      <div className="flex gap-2 mb-6 border-b border-hairline pb-3">
        {(
          [
            { id: "autoscaler", label: "LogAutoscalerPolicy", icon: Sliders },
            { id: "threat", label: "LogThreatPolicy", icon: Shield },
            { id: "ratelimit", label: "MultiBackendRateLimit", icon: Terminal },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setPolicyType(t.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-xs font-mono transition-all ${
                policyType === t.id
                  ? "bg-primary text-on-primary font-bold shadow-xs"
                  : "bg-canvas-soft border border-hairline text-body hover:text-ink"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Grid: Form Controls (Left) & Live YAML Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-mute block mb-1 uppercase font-semibold">
                Deployment Name:
              </label>
              <input
                type="text"
                value={deploymentName}
                onChange={(e) => setDeploymentName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-[4px] border border-hairline bg-canvas-soft text-ink focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-mute block mb-1 uppercase font-semibold">
                Namespace:
              </label>
              <input
                type="text"
                value={namespace}
                onChange={(e) => setNamespace(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-[4px] border border-hairline bg-canvas-soft text-ink focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {policyType === "autoscaler" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-mute block mb-1 uppercase font-semibold">
                    Min Replicas:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={minReplicas}
                    onChange={(e) => setMinReplicas(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-[4px] border border-hairline bg-canvas-soft text-ink focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-mute block mb-1 uppercase font-semibold">
                    Max Replicas:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="150"
                    value={maxReplicas}
                    onChange={(e) => setMaxReplicas(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-[4px] border border-hairline bg-canvas-soft text-ink focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-mono text-mute mb-1">
                  <span className="uppercase font-semibold">Target RPS Per Pod:</span>
                  <span className="text-cyan font-bold">{targetRPS} RPS</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="500"
                  step="10"
                  value={targetRPS}
                  onChange={(e) => setTargetRPS(Number(e.target.value))}
                  className="w-full accent-cyan h-2 bg-canvas-soft rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-mono text-mute mb-1">
                  <span className="uppercase font-semibold">Headroom Factor:</span>
                  <span className="text-link font-bold">{headroom.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="2.5"
                  step="0.05"
                  value={headroom}
                  onChange={(e) => setHeadroom(Number(e.target.value))}
                  className="w-full accent-link h-2 bg-canvas-soft rounded-lg cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-mute block mb-1 uppercase font-semibold">
                    Scale-Up Cooldown:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={scaleUpCooldown}
                    onChange={(e) => setScaleUpCooldown(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-[4px] border border-hairline bg-canvas-soft text-ink focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-mute block mb-1 uppercase font-semibold">
                    Scale-Down Cooldown:
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="600"
                    value={scaleDownCooldown}
                    onChange={(e) => setScaleDownCooldown(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-[4px] border border-hairline bg-canvas-soft text-ink focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Security Toggles */}
              <div className="pt-2 border-t border-hairline space-y-2">
                <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lockOnThreat}
                    onChange={(e) => setLockOnThreat(e.target.checked)}
                    className="rounded border-hairline text-primary focus:ring-0"
                  />
                  <span>Lock scale-down during active security threats</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quarantineNetpol}
                    onChange={(e) => setQuarantineNetpol(e.target.checked)}
                    className="rounded border-hairline text-primary focus:ring-0"
                  />
                  <span>Inject dynamic NetworkPolicy CIDR drop rules</span>
                </label>
              </div>
            </>
          )}

          {/* Validation errors summary */}
          {!validation.valid && (
            <div className="p-3 rounded-[6px] bg-error/10 border border-error/20 text-error text-[11px] font-mono space-y-1">
              <span className="font-bold block uppercase tracking-wider">Validation Errors:</span>
              {validation.errors.map((err, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span>•</span>
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live YAML Preview (Right) */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-[6px] border border-hairline bg-canvas-soft overflow-hidden">
          {/* Editor Header */}
          <div className="px-4 py-2 border-b border-hairline bg-canvas flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-ink flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-mute" />
              {deploymentName}-{policyType}.yaml
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!validation.valid}
                className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] border border-hairline bg-canvas hover:bg-canvas-soft text-[11px] font-mono text-ink transition-colors disabled:opacity-50 cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
              <button
                onClick={handleDownload}
                disabled={!validation.valid}
                className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] border border-hairline bg-canvas hover:bg-canvas-soft text-[11px] font-mono text-ink transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Code Body */}
          <pre className="p-4 font-mono text-[11px] text-ink leading-relaxed overflow-x-auto flex-1">
            <code>{generatedYaml}</code>
          </pre>

          {/* Kubectl Quick Apply Footer */}
          <div className="px-4 py-2 border-t border-hairline bg-canvas text-[10px] font-mono text-mute flex items-center justify-between">
            <span>Apply to cluster:</span>
            <code className="text-ink bg-canvas-soft px-1.5 py-0.5 rounded border border-hairline">
              kubectl apply -f {deploymentName}-{policyType}.yaml
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
