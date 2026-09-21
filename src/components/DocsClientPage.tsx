"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MenuItem {
  label: string;
  slug: string;
  path: string;
}

const MENU_ITEMS: MenuItem[] = [
  { label: "Getting Started", slug: "getting-started", path: "/docs/getting-started" },
  { label: "Architecture", slug: "architecture", path: "/docs/architecture" },
  { label: "Configuration", slug: "configuration", path: "/docs/configuration" },
  { label: "Scaling Policies", slug: "scaling-policies", path: "/docs/scaling-policies" },
  { label: "Security Analytics", slug: "security-analytics", path: "/docs/security-analytics" },
  { label: "API Reference", slug: "api-reference", path: "/docs/api-reference" },
];

interface DocContent {
  title: string;
  description: string;
  category: string;
  titleHeader: string;
  subHeader: string;
  element: React.ReactNode;
}

const DOCS_DATA: Record<string, DocContent> = {
  "getting-started": {
    title: "Getting Started",
    description: "How to install and set up LogStrata on your Kubernetes cluster.",
    category: "Guide",
    titleHeader: "Getting Started",
    subHeader: "Deploy LogStrata's ultra-low-latency Go containerd daemon and Kubernetes operator in under 2 minutes.",
    element: (
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">System Prerequisites</h2>
          <p className="text-xs text-body leading-relaxed">
            LogStrata is completely self-contained with <strong>zero external database dependencies</strong> (no Elasticsearch, OpenSearch, Kafka, or Prometheus Operator required). Verify your environment has:
          </p>
          <ul className="list-disc list-inside text-xs text-body flex flex-col gap-1.5 pl-2">
            <li>
              Kubernetes cluster version{" "}
              <code className="bg-canvas-soft px-1.5 py-0.5 rounded-none border border-hairline font-mono text-[10px]">
                v1.26+
              </code>{" "}
              (containerd, CRI-O, or Docker shim)
            </li>
            <li>
              <code className="bg-canvas-soft px-1.5 py-0.5 rounded-none border border-hairline font-mono text-[10px]">kubectl</code>{" "}
              or Helm 3.8+ installed locally
            </li>
            <li>Cluster admin permissions to create Custom Resource Definitions (CRDs)</li>
            <li>Node filesystem read access to container log paths (<code className="font-mono text-[10px]">/var/log/pods</code>)</li>
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">1. Quickstart Installation (Automated)</h2>
          <p className="text-xs text-body leading-relaxed">
            Run the automated installation script to deploy CRDs, the DaemonSet log harvester, and the Controller operator:
          </p>
          <div className="bg-canvas-soft p-4 rounded-none border border-hairline font-mono text-[11px] text-ink leading-relaxed">
            <span className="text-mute"># Deploy LogStrata in one command</span>
            <br />
            <span className="text-mute">$</span> curl -sSL https://raw.githubusercontent.com/Rishav-sy/LogStrata/main/scripts/install.sh | bash
          </div>
          <p className="text-xs text-body leading-relaxed">
            Alternatively, deploy using the official Helm chart:
          </p>
          <div className="bg-canvas-soft p-4 rounded-none border border-hairline font-mono text-[11px] text-ink leading-relaxed">
            <span className="text-mute"># Install via Helm</span>
            <br />
            <span className="text-mute">$</span> helm install logstrata ./charts/logstrata \<br />
            &nbsp;&nbsp;--namespace logstrata-system \<br />
            &nbsp;&nbsp;--create-namespace \<br />
            &nbsp;&nbsp;--set daemon.logPath=/var/log/pods \<br />
            &nbsp;&nbsp;--set controller.reconcileInterval=5s
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">2. Verify Cluster Health</h2>
          <p className="text-xs text-body leading-relaxed">
            Run the verification script or inspect the pods running in the <code className="font-mono text-[10px]">logstrata-system</code> namespace:
          </p>
          <div className="bg-canvas-soft p-4 rounded-none border border-hairline font-mono text-[11px] text-ink leading-relaxed">
            <span className="text-mute">$</span> ./scripts/verify-cluster.sh
            <br />
            <span className="text-mute"># Or directly via kubectl</span>
            <br />
            <span className="text-mute">$</span> kubectl get pods -n logstrata-system
          </div>
          <p className="text-xs text-body leading-relaxed">Expected output:</p>
          <div className="bg-canvas-soft p-4 rounded-none border border-hairline font-mono text-[11px] text-body leading-relaxed">
            NAME&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;READY&nbsp;&nbsp;&nbsp;STATUS&nbsp;&nbsp;&nbsp;&nbsp;RESTARTS&nbsp;&nbsp;&nbsp;AGE
            <br />
            logstrata-controller-7f8d9b4c2-k8s90&nbsp;&nbsp;&nbsp;1/1&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Running&nbsp;&nbsp;&nbsp;0&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;45s
            <br />
            logstrata-daemon-node1-v7x2q&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1/1&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Running&nbsp;&nbsp;&nbsp;0&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;45s
            <br />
            logstrata-daemon-node2-m3p4r&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1/1&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Running&nbsp;&nbsp;&nbsp;0&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;45s
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">3. Apply Your First LogThreatPolicy</h2>
          <p className="text-xs text-body leading-relaxed">
            Define a custom policy to auto-scale on P95 latency and enforce DDoS scale-down lockouts:
          </p>
          <div className="bg-canvas-soft p-4 rounded-none border border-hairline font-mono text-[11px] text-ink leading-relaxed">
            <pre className="whitespace-pre-wrap">
              <code>
                {`apiVersion: logstrata.io/v1alpha1
kind: LogThreatPolicy
metadata:
  name: api-gateway-autoscaler
  namespace: default
spec:
  targetDeployment:
    name: api-gateway
    namespace: default
  scalingRules:
    minReplicas: 3
    maxReplicas: 20
    targetRPSPerPod: 150
    targetP95LatencyMs: 250
    scaleUpCooldownSec: 15
    scaleDownCooldownSec: 90
  threatDetection:
    bruteForceThresholdRPS: 40
    errorRatioThresholdPct: 20.0
    scaleDownLockoutSec: 300
    dynamicNetworkPolicy:
      enabled: true
      blockTTLSec: 600`}
              </code>
            </pre>
          </div>
          <p className="text-xs text-body leading-relaxed">Apply it directly to your cluster:</p>
          <div className="bg-canvas-soft p-4 rounded-none border border-hairline font-mono text-[11px] text-ink leading-relaxed">
            <span className="text-mute">$</span> kubectl apply -f api-gateway-policy.yaml
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">Next Steps</h2>
          <p className="text-xs text-body leading-relaxed">
            Explore the{" "}
            <Link href="/docs/architecture" className="text-link hover:underline">
              zero-indexing architecture
            </Link>
            , review the{" "}
            <Link href="/docs/configuration" className="text-link hover:underline">
              CRD configuration specs
            </Link>
            , or test the{" "}
            <Link href="/docs/api-reference" className="text-link hover:underline">
              daemon HTTP &amp; Prometheus endpoints
            </Link>
            .
          </p>
        </section>
      </div>
    ),
  },
  architecture: {
    title: "Architecture",
    description: "Deep dive into LogStrata's zero-indexing pipeline, circular ring buffers, and operator reconciliation.",
    category: "Concepts",
    titleHeader: "System Architecture",
    subHeader: "Sub-millisecond log ingestion, in-memory circular time-series, and attack-aware Kubernetes reconciliation.",
    element: (
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">Zero-Indexing Architecture</h2>
          <p className="text-xs text-body leading-relaxed">
            Traditional log-based autoscaling relies on multi-layer pipelines: Log Harvester &rarr; Kafka &rarr; Logstash &rarr; Elasticsearch &rarr; Cron Query. This introduces 30&ndash;90 seconds of lag and massive cloud storage bills. LogStrata eliminates the entire indexing tier.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div className="bg-canvas-soft p-4 rounded-none border border-hairline flex flex-col gap-1.5">
              <span className="font-mono text-xs text-primary font-bold">1. LogStrata Daemon</span>
              <p className="text-[11px] text-body leading-relaxed">
                Lightweight Go DaemonSet reading container stdout (<code className="font-mono text-[10px]">/var/log/pods</code>) or Unix sockets with sub-microsecond parsing (~1.1&micro;s/op).
              </p>
            </div>
            <div className="bg-canvas-soft p-4 rounded-none border border-hairline flex flex-col gap-1.5">
              <span className="font-mono text-xs text-primary font-bold">2. In-Memory SWTR Buffer</span>
              <p className="text-[11px] text-body leading-relaxed">
                Second-Window Time Ring (SWTR) 60-bucket circular buffer calculating RPS, P50/P90/P95/P99 latency, and error rates in 9.35 nanoseconds with zero heap allocations.
              </p>
            </div>
            <div className="bg-canvas-soft p-4 rounded-none border border-hairline flex flex-col gap-1.5">
              <span className="font-mono text-xs text-primary font-bold">3. Controller Operator</span>
              <p className="text-[11px] text-body leading-relaxed">
                Watches <code className="font-mono text-[10px]">LogThreatPolicy</code> CRDs and issues atomic JSON patches to Deployment replica counts while generating dynamic NetworkPolicy CIDR drop rules.
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">Real-Time Data Pipeline</h2>
          <p className="text-xs text-body leading-relaxed">
            How a single log line triggers an instantaneous scaling decision:
          </p>
          <ol className="list-decimal list-inside text-xs text-body flex flex-col gap-2.5 pl-2">
            <li>
              <strong className="text-ink">Log Output:</strong> Application container outputs standard JSON or Combined NGINX/Envoy log to stdout.
            </li>
            <li>
              <strong className="text-ink">Zero-Copy Ingestion:</strong> The node-level <code className="text-ink">logstrata-daemon</code> captures the event via inotify or FIFO pipe, strips CRI wrapper prefixes, and parses HTTP status, method, latency, and client IP.
            </li>
            <li>
              <strong className="text-ink">SWTR Circular Aggregation:</strong> Log metrics are pushed to the current second bucket. Quantiles are computed over the sliding window in constant time <code className="text-ink">O(1)</code>.
            </li>
            <li>
              <strong className="text-ink">Threat &amp; Surge Detection:</strong> If traffic surges &gt;2.5&times; or 401/403 brute-force rates exceed thresholds, the detector flags the surge and locks down the scale-down gate.
            </li>
            <li>
              <strong className="text-ink">Operator Reconciliation:</strong> The operator computes required capacity: <code className="text-ink">ceil(CurrentReplicas * (CurrentRPS / TargetRPS))</code> and issues an immediate JSON Patch to the Deployment scale subresource.
            </li>
          </ol>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">Scale-Down Lockout &amp; Yo-Yo Defense</h2>
          <p className="text-xs text-body leading-relaxed">
            During attack events or traffic volatility, LogStrata activates its <strong className="text-ink">Scale-Down Suppression Lock</strong>. While normal scaling honors <code className="text-ink">scaleDownCooldownSec</code> (default 90s), any detected threat extends the minimum replica floor for up to 300s, preventing attackers from orchestrating pod exhaustion storms.
          </p>
        </section>
      </div>
    ),
  },
  configuration: {
    title: "Configuration",
    description: "YAML schema definitions and Custom Resource (CRD) configuration options.",
    category: "Reference",
    titleHeader: "Configuration Reference",
    subHeader: "Examine the full YAML schema specifications for LogThreatPolicy Custom Resource Definitions.",
    element: (
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">LogThreatPolicy CRD Outline</h2>
          <p className="text-xs text-body leading-relaxed">
            Below is a complete <code className="bg-canvas-soft px-1.5 py-0.5 border border-hairline font-mono text-[10px]">LogThreatPolicy</code> resource (<code className="font-mono text-[10px]">logstrata.io/v1alpha1</code>):
          </p>

          <div className="bg-canvas-soft p-4 rounded-none border border-hairline font-mono text-[11px] text-ink leading-relaxed">
            <pre className="whitespace-pre-wrap">
              <code>
                {`apiVersion: logstrata.io/v1alpha1
kind: LogThreatPolicy
metadata:
  name: prod-checkout-autoscaler
  namespace: e-commerce
spec:
  # Target Deployment Reference
  targetDeployment:
    name: checkout-service
    namespace: e-commerce

  # Scaling Parameters
  scalingRules:
    minReplicas: 4
    maxReplicas: 40
    targetRPSPerPod: 120
    targetP95LatencyMs: 300
    scaleUpCooldownSec: 15
    scaleDownCooldownSec: 90
    panicScaleFactor: 2.0

  # Threat Detection & Defense
  threatDetection:
    bruteForceThresholdRPS: 50
    errorRatioThresholdPct: 25.0
    scaleDownLockoutSec: 300
    dynamicNetworkPolicy:
      enabled: true
      blockTTLSec: 600

  # Alert Notifications
  notifications:
    slackWebhookURL: "https://hooks.slack.com/services/T00/B00/XXXX"
    discordWebhookURL: ""
    customWebhookURL: "https://ops.internal.net/alerts"`}
              </code>
            </pre>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">Field Descriptions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-hairline-strong text-ink font-semibold">
                  <th className="py-2 pr-4">YAML Path</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2">Description</th>
                </tr>
              </thead>
              <tbody className="text-body divide-y divide-hairline">
                <tr>
                  <td className="py-2.5 font-mono text-[11px] text-ink">targetDeployment.name</td>
                  <td className="py-2.5">String</td>
                  <td className="py-2.5">Target Kubernetes Deployment name to monitor and scale.</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-mono text-[11px] text-ink">scalingRules.minReplicas</td>
                  <td className="py-2.5">Integer</td>
                  <td className="py-2.5">Minimum replica floor under normal operating conditions.</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-mono text-[11px] text-ink">scalingRules.maxReplicas</td>
                  <td className="py-2.5">Integer</td>
                  <td className="py-2.5">Absolute maximum replica ceiling to protect cluster capacity and cloud spend.</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-mono text-[11px] text-ink">scalingRules.targetRPSPerPod</td>
                  <td className="py-2.5">Integer</td>
                  <td className="py-2.5">Nominal throughput capacity per pod used for capacity ratio calculations.</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-mono text-[11px] text-ink">scalingRules.targetP95LatencyMs</td>
                  <td className="py-2.5">Integer</td>
                  <td className="py-2.5">P95 SLA latency ceiling; exceeding this triggers proactive scale-out.</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-mono text-[11px] text-ink">threatDetection.bruteForceThresholdRPS</td>
                  <td className="py-2.5">Integer</td>
                  <td className="py-2.5">Rate of 401/403 responses per second that triggers security threat state.</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-mono text-[11px] text-ink">threatDetection.dynamicNetworkPolicy</td>
                  <td className="py-2.5">Object</td>
                  <td className="py-2.5">Automatically generates Kubernetes NetworkPolicy CIDR drops for offensive client IPs.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    ),
  },
  "scaling-policies": {
    title: "Scaling Policies",
    description: "Understanding how log metrics map to Kubernetes scale decisions.",
    category: "Logic",
    titleHeader: "Scaling Policies",
    subHeader: "Capacity ratios, latency percentile triggers, and anti-thrashing cooldown mechanics.",
    element: (
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">Core Autoscaling Equation</h2>
          <p className="text-xs text-body leading-relaxed">
            LogStrata computes desired replicas at sub-second intervals using a dual-factor capacity algorithm balancing RPS load and P95 latency:
          </p>
          <div className="bg-canvas-soft p-4 rounded-none border border-hairline font-mono text-[11px] text-ink text-center">
            DesiredReplicas = clamp( ceil( max( RPSRatio, LatencyRatio ) * CurrentReplicas ), MinReplicas, MaxReplicas )
          </div>
          <p className="text-xs text-body leading-relaxed">
            Where <code className="text-ink">RPSRatio = TotalClusterRPS / (TargetRPSPerPod * CurrentReplicas)</code>.
          </p>
          <p className="text-xs text-body leading-relaxed">
            For example, if <code className="text-ink">CurrentReplicas = 4</code>, <code className="text-ink">TargetRPSPerPod = 100</code>, and current incoming traffic spikes to <code className="text-ink">750 RPS</code>:
          </p>
          <div className="bg-canvas-soft p-4 rounded-none border border-hairline font-mono text-[11px] text-body">
            DesiredReplicas = clamp( ceil( 750 / 100 ), 4, 30 ) = 8 replicas (instant scale-out)
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">Sub-Millisecond Percentile Calculations</h2>
          <p className="text-xs text-body leading-relaxed">
            Traditional metrics servers evaluate averages, completely missing tail latency spikes. LogStrata&apos;s SWTR buffer aggregates response latencies across 60 second-level buckets and computes exact <strong>P50, P90, P95, and P99</strong> metrics in under 10 nanoseconds.
          </p>
          <p className="text-xs text-body leading-relaxed">
            When P95 latency exceeds <code className="text-ink">targetP95LatencyMs</code> for two consecutive seconds, LogStrata proactively scales the workload before HTTP error rates begin to climb.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">Anti-Thrashing Cooldown Enforcements</h2>
          <p className="text-xs text-body leading-relaxed">To prevent rapid oscillations, LogStrata enforces separate asymmetric cooldown periods:</p>
          <ul className="list-disc list-inside text-xs text-body flex flex-col gap-1.5 pl-2">
            <li>
              <strong className="text-ink">Scale-Up Cooldown (Default: 15s):</strong> Prevents redundant scale-out orders while newly created pods transition through <code className="text-ink">ContainerCreating</code> and pass readiness probes.
            </li>
            <li>
              <strong className="text-ink">Scale-Down Cooldown (Default: 90s):</strong> Prevents premature pod termination during momentary traffic dips.
            </li>
            <li>
              <strong className="text-ink">Threat Lockout Window (Default: 300s):</strong> Suppresses all scale-down events if anomalous traffic patterns or brute-force floods have been detected.
            </li>
          </ul>
        </section>
      </div>
    ),
  },
  "security-analytics": {
    title: "Security Analytics",
    description: "How LogStrata protects your application scaling layers from cyber threats and DDoS floods.",
    category: "Threat Security",
    titleHeader: "Security Analytics &amp; Threat Mitigation",
    subHeader: "DDoS scale-lock defenses, dynamic Kubernetes NetworkPolicies, and automated IP quarantine.",
    element: (
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">The Scale-Down Exhaustion Attack</h2>
          <p className="text-xs text-body leading-relaxed">
            A primary vulnerability of naive Kubernetes Horizontal Pod Autoscalers (HPAs) is the <strong>Yo-Yo / Oscillating Attack</strong>. Adversaries generate pulsating traffic surges: forcing a massive scale-up, suddenly terminating traffic, waiting for the cluster to scale down, and then hitting the endpoint again. This exhausts Kubernetes API server capacity, worker node memory, and CPU limits.
          </p>
          <p className="text-xs text-body leading-relaxed">
            LogStrata identifies this signature pattern and engages an immediate <strong className="text-ink">Scale-Down Suppression Lock</strong>, freezing the pod replica count at elevated capacity and notifying SecOps teams via Slack or Discord.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">Dynamic Kubernetes NetworkPolicy Quarantine</h2>
          <p className="text-xs text-body leading-relaxed">
            When malicious IPs generate unauthorized requests (e.g. &gt;40 401/403s per second), LogStrata isolates the CIDRs and automatically applies a dynamic <code className="text-ink">networking.k8s.io/v1</code> <code className="text-ink">NetworkPolicy</code> directly in the workload namespace:
          </p>
          <div className="bg-canvas-soft p-4 rounded-none border border-hairline font-mono text-[11px] text-ink leading-relaxed">
            <pre className="whitespace-pre-wrap">
              <code>
                {`apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: logstrata-waf-quarantine
  namespace: prod-services
spec:
  podSelector:
    matchLabels:
      app: checkout-service
  policyTypes:
    - Ingress
  ingress:
    - from:
        - ipBlock:
            cidr: 0.0.0.0/0
            except:
              - 198.51.100.42/32
              - 203.0.113.88/32`}
              </code>
            </pre>
          </div>
          <p className="text-xs text-body leading-relaxed">
            Blocked IPs are managed with automatic TTL expiration (default: 600 seconds) in memory, ensuring clean recovery once the attack subsides.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">Observability &amp; Webhook Alerts</h2>
          <p className="text-xs text-body leading-relaxed">
            All threat activations, scale decisions, and blocked CIDRs are exported to Prometheus metrics and dispatched in real-time to configured Slack/Discord webhooks with incident summaries.
          </p>
        </section>
      </div>
    ),
  },
  "api-reference": {
    title: "API Reference",
    description: "HTTP API specification for LogStrata daemon and controller endpoints.",
    category: "Spec",
    titleHeader: "API &amp; Metrics Reference",
    subHeader: "Native HTTP and Prometheus endpoints exposed by LogStrata daemon and controller.",
    element: (
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">Health &amp; Runtime Endpoints</h2>

          {/* Healthz */}
          <div className="border border-hairline rounded-none bg-canvas overflow-hidden mb-4">
            <div className="border-b border-hairline px-4 py-2.5 flex items-center justify-between bg-canvas-soft">
              <div className="flex items-center gap-2 text-xs">
                <span className="border border-hairline bg-canvas px-2 py-0.5 rounded-none font-mono text-ink text-[10px] font-bold">
                  GET
                </span>
                <span className="font-mono font-semibold text-ink">/healthz</span>
              </div>
              <span className="text-[9px] text-mute font-mono uppercase tracking-wider font-bold">Liveness / Readiness</span>
            </div>
            <div className="p-4 text-xs text-body flex flex-col gap-3">
              <p className="leading-relaxed">Returns HTTP 200 OK if the daemon process is healthy and ingesting logs.</p>
              <pre className="bg-canvas-soft p-3 rounded-none border border-hairline font-mono text-[10px] text-ink leading-relaxed">
                <code>{`{"status": "ok"}`}</code>
              </pre>
            </div>
          </div>

          {/* Status */}
          <div className="border border-hairline rounded-none bg-canvas overflow-hidden mb-4">
            <div className="border-b border-hairline px-4 py-2.5 flex items-center justify-between bg-canvas-soft">
              <div className="flex items-center gap-2 text-xs">
                <span className="border border-hairline bg-canvas px-2 py-0.5 rounded-none font-mono text-ink text-[10px] font-bold">
                  GET
                </span>
                <span className="font-mono font-semibold text-ink">/api/v1/status</span>
              </div>
              <span className="text-[9px] text-mute font-mono uppercase tracking-wider font-bold">Runtime Telemetry</span>
            </div>
            <div className="p-4 text-xs text-body flex flex-col gap-3">
              <p className="leading-relaxed">
                Returns live telemetry from the in-memory SWTR engine: current RPS, P50/P90/P95/P99 latency, and threat lock status.
              </p>
              <span className="font-semibold text-ink">Example Response:</span>
              <pre className="bg-canvas-soft p-3 rounded-none border border-hairline font-mono text-[10px] text-ink leading-relaxed">
                <code>
                  {`{
  "node": "worker-pool-node-03",
  "swtr_window_sec": 60,
  "current_rps": 142.5,
  "p95_latency_ms": 48.2,
  "p99_latency_ms": 112.6,
  "error_ratio": 0.008,
  "threat_state": {
    "surge_detected": false,
    "scale_down_locked": false,
    "blocked_ips_count": 0
  }
}`}
                </code>
              </pre>
            </div>
          </div>

          {/* Prometheus Metrics */}
          <div className="border border-hairline rounded-none bg-canvas overflow-hidden mb-4">
            <div className="border-b border-hairline px-4 py-2.5 flex items-center justify-between bg-canvas-soft">
              <div className="flex items-center gap-2 text-xs">
                <span className="border border-hairline bg-canvas px-2 py-0.5 rounded-none font-mono text-ink text-[10px] font-bold">
                  GET
                </span>
                <span className="font-mono font-semibold text-ink">:8080/metrics</span>
              </div>
              <span className="text-[9px] text-mute font-mono uppercase tracking-wider font-bold">Prometheus Scrape</span>
            </div>
            <div className="p-4 text-xs text-body flex flex-col gap-3">
              <p className="leading-relaxed">Standard Prometheus exposition format metrics:</p>
              <pre className="bg-canvas-soft p-3 rounded-none border border-hairline font-mono text-[10px] text-ink leading-relaxed">
                <code>
                  {`# HELP logstrata_ingested_logs_total Total log lines parsed
# TYPE logstrata_ingested_logs_total counter
logstrata_ingested_logs_total 1284501

# HELP logstrata_engine_rps Current rolling requests per second
# TYPE logstrata_engine_rps gauge
logstrata_engine_rps 142.5

# HELP logstrata_engine_p95_latency_ms Rolling P95 latency in ms
# TYPE logstrata_engine_p95_latency_ms gauge
logstrata_engine_p95_latency_ms 48.2

# HELP logstrata_threat_scale_lock Active scale down lock (1 = locked, 0 = normal)
# TYPE logstrata_threat_scale_lock gauge
logstrata_threat_scale_lock 0`}
                </code>
              </pre>
            </div>
          </div>

          {/* Ingest */}
          <div className="border border-hairline rounded-none bg-canvas overflow-hidden">
            <div className="border-b border-hairline px-4 py-2.5 flex items-center justify-between bg-canvas-soft">
              <div className="flex items-center gap-2 text-xs">
                <span className="border border-hairline bg-canvas px-2 py-0.5 rounded-none font-mono text-ink text-[10px] font-bold">
                  POST
                </span>
                <span className="font-mono font-semibold text-ink">/api/v1/ingest</span>
              </div>
              <span className="text-[9px] text-mute font-mono uppercase tracking-wider font-bold">Log Injection</span>
            </div>
            <div className="p-4 text-xs text-body flex flex-col gap-3">
              <p className="leading-relaxed">HTTP log ingestion endpoint for application sidecars or load test generators.</p>
              <pre className="bg-canvas-soft p-3 rounded-none border border-hairline font-mono text-[10px] text-ink leading-relaxed">
                <code>
                  {`// POST Body (JSON or plain text log)
{
  "timestamp": "2026-09-21T17:15:00Z",
  "method": "POST",
  "path": "/api/v2/checkout",
  "status": 200,
  "latency_ms": 64.2,
  "client_ip": "198.51.100.12"
}`}
                </code>
              </pre>
            </div>
          </div>
        </section>
      </div>
    ),
  },
};

interface DocsClientPageProps {
  slug: string;
}

export default function DocsClientPage({ slug }: DocsClientPageProps) {
  const router = useRouter();
  const currentDoc = DOCS_DATA[slug] || DOCS_DATA["getting-started"];

  const handleMobileNavChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(e.target.value);
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Sticky Sidebar */}
        <aside className="md:col-span-3 sticky top-24 h-[calc(100vh-10rem)] overflow-y-auto custom-scrollbar border-r border-hairline pr-6 hidden md:block">
          <span className="font-mono text-[9px] uppercase tracking-wider text-mute mb-4 block font-bold">
            Documentation
          </span>
          <nav className="flex flex-col gap-1.5">
            {MENU_ITEMS.map((item) => {
              const isActive = slug === item.slug;
              return (
                <Link
                  key={item.slug}
                  href={item.path}
                  className={`px-3 py-2 rounded-[6px] text-xs font-medium transition-all duration-150 border focus-visible:outline-none focus-visible:border-primary ${
                    isActive
                      ? "bg-canvas border-hairline-strong text-ink font-semibold"
                      : "bg-transparent border-transparent text-body hover:text-ink hover:bg-canvas-soft"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Docs Navigation Dropdown */}
        <div className="md:hidden w-full border border-hairline rounded-[6px] p-3 bg-canvas mb-4">
          <label
            htmlFor="mobile-docs-select"
            className="block font-mono text-[9px] uppercase tracking-wider text-mute mb-2 font-bold"
          >
            Documentation Section
          </label>
          <select
            id="mobile-docs-select"
            className="w-full bg-canvas text-ink border border-hairline rounded-[6px] px-2 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:border-primary"
            value={currentDoc ? `/docs/${slug}` : "/docs/getting-started"}
            onChange={handleMobileNavChange}
          >
            {MENU_ITEMS.map((item) => (
              <option key={item.slug} value={item.path}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* Right Content Area */}
        <article className="md:col-span-9 max-w-3xl prose prose-invert prose-zinc prose-h1:text-3xl prose-h2:text-xl prose-p:leading-relaxed prose-code:font-mono prose-code:text-xs">
          <div className="flex flex-col gap-6">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-mute font-bold">
                {currentDoc.category}
              </span>
              <h1 className="font-sans text-3xl font-bold text-ink tracking-tight mt-1.5 mb-2">
                {currentDoc.titleHeader}
              </h1>
              <p className="text-xs text-body">{currentDoc.subHeader}</p>
            </div>

            <hr className="border-hairline" />

            {currentDoc.element}
          </div>
        </article>
      </div>
    </div>
  );
}
