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
    subHeader: "Learn how to deploy LogStrata's controller daemon and fluentd collection agents in minutes.",
    element: (
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">System Prerequisites</h2>
          <p className="text-xs text-body leading-relaxed">
            Before installing LogStrata, verify that your target environment contains the following tools:
          </p>
          <ul className="list-disc list-inside text-xs text-body flex flex-col gap-1.5 pl-2">
            <li>
              Kubernetes cluster version{" "}
              <code className="bg-canvas-soft px-1.5 py-0.5 rounded-none border border-hairline font-mono text-[10px]">
                v1.24+
              </code>
            </li>
            <li>Helm package manager installed locally</li>
            <li>Aggregated Elasticsearch database context or open port access</li>
            <li>Write access to patch Deployment scale limits</li>
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">1. Install via Helm</h2>
          <p className="text-xs text-body leading-relaxed">
            Add the official Helm repository context and pull down the LogStrata platform package:
          </p>
          <div className="bg-canvas-soft p-4 rounded-none border border-hairline font-mono text-[11px] text-ink leading-relaxed">
            <span className="text-mute"># Register registry</span>
            <br />
            <span className="text-mute">$</span> helm repo add logstrata https://helm.logstrata.io
            <br />
            <span className="text-mute">$</span> helm repo update
            <br />
            <br />
            <span className="text-mute"># Install charts into custom namespace</span>
            <br />
            <span className="text-mute">$</span> helm install logstrata logstrata/logstrata \<br />
            &nbsp;&nbsp;--namespace logstrata-system \<br />
            &nbsp;&nbsp;--create-namespace
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">2. Verify Ingestion</h2>
          <p className="text-xs text-body leading-relaxed">
            Ensure that the collection agent DaemonSet and Controller components are running correctly:
          </p>
          <div className="bg-canvas-soft p-4 rounded-none border border-hairline font-mono text-[11px] text-ink leading-relaxed">
            <span className="text-mute">$</span> kubectl get pods -n logstrata-system
          </div>
          <p className="text-xs text-body leading-relaxed">Expected output:</p>
          <div className="bg-canvas-soft p-4 rounded-none border border-hairline font-mono text-[11px] text-body leading-relaxed">
            NAME&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;READY&nbsp;&nbsp;&nbsp;STATUS&nbsp;&nbsp;&nbsp;&nbsp;RESTARTS&nbsp;&nbsp;&nbsp;AGE
            <br />
            logstrata-controller-5fc6d5b78-xyz12&nbsp;&nbsp;&nbsp;1/1&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Running&nbsp;&nbsp;&nbsp;0&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2m
            <br />
            fluentd-logging-agent-j4k2s&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1/1&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Running&nbsp;&nbsp;&nbsp;0&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2m
            <br />
            fluentd-logging-agent-l8f9d&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1/1&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Running&nbsp;&nbsp;&nbsp;0&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2m
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">3. Apply Your First Scaling Policy</h2>
          <p className="text-xs text-body leading-relaxed">
            Create a simple policy configuration to automatically scale your application on high request latency. Save the
            file as{" "}
            <code className="bg-canvas-soft px-1.5 py-0.5 rounded-none border border-hairline font-mono text-[10px]">
              slsa-policy.yaml
            </code>
            :
          </p>
          <div className="bg-canvas-soft p-4 rounded-none border border-hairline font-mono text-[11px] text-ink leading-relaxed">
            <pre className="whitespace-pre-wrap">
              <code>
                {`apiVersion: core.logstrata.io/v1alpha1
kind: LogAutoscalerPolicy
metadata:
  name: frontend-latency-scaler
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: main-frontend
  metricSources:
    - type: ElasticSearchQuery
      elasticsearch:
        query: "status:200 AND path:/home"
        timeWindow: "30s"
        trigger:
          metricName: throughput_rps
          threshold: 300.0
          scaleFactor: 1.5
  cooldownPeriod: "45s"
  minReplicas: 3
  maxReplicas: 15`}
              </code>
            </pre>
          </div>
          <p className="text-xs text-body leading-relaxed">Apply it directly to your cluster context:</p>
          <div className="bg-canvas-soft p-4 rounded-none border border-hairline font-mono text-[11px] text-ink leading-relaxed">
            <span className="text-mute">$</span> kubectl apply -f slsa-policy.yaml
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">Next Steps</h2>
          <p className="text-xs text-body leading-relaxed">
            Read about how the{" "}
            <Link href="/docs/architecture" className="text-link hover:underline">
              internal architecture
            </Link>{" "}
            manages metric querying, or explore the{" "}
            <Link href="/docs/configuration" className="text-link hover:underline">
              configuration variables
            </Link>
            .
          </p>
        </section>
      </div>
    ),
  },
  architecture: {
    title: "Architecture",
    description: "Deep dive into LogStrata's log collection, database indexing, and scaling orchestrations.",
    category: "Concepts",
    titleHeader: "System Architecture",
    subHeader: "Understand the internal components and data flow loops driving log-based Kubernetes scaling.",
    element: (
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">Component Breakdown</h2>
          <p className="text-xs text-body leading-relaxed">
            LogStrata relies on three core microservices deployed inside your cluster context:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div className="bg-canvas-soft p-4 rounded-none border border-hairline flex flex-col gap-1.5">
              <span className="font-mono text-xs text-primary font-bold">1. Log Harvesters</span>
              <p className="text-[11px] text-body leading-relaxed">
                Fluentd DaemonSets running on every node harvest container stdout stream logs directly from the node
                filesystem.
              </p>
            </div>
            <div className="bg-canvas-soft p-4 rounded-none border border-hairline flex flex-col gap-1.5">
              <span className="font-mono text-xs text-primary font-bold">2. Index Storage</span>
              <p className="text-[11px] text-body leading-relaxed">
                Logs are structured into indexed documents in Elasticsearch or OpenSearch databases to allow fast
                aggregation queries.
              </p>
            </div>
            <div className="bg-canvas-soft p-4 rounded-none border border-hairline flex flex-col gap-1.5">
              <span className="font-mono text-xs text-primary font-bold">3. LogStrata Daemon</span>
              <p className="text-[11px] text-body leading-relaxed">
                The core control plane queries the index database at tick intervals to evaluate custom scaling threshold
                policies.
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">Data Flow Pipeline</h2>
          <p className="text-xs text-body leading-relaxed">
            How a log entry turns into an infrastructure adjustment:
          </p>
          <ol className="list-decimal list-inside text-xs text-body flex flex-col gap-2.5 pl-2">
            <li>
              <strong className="text-ink">Log Generation:</strong> An application pod handles a checkout request and logs:{" "}
              <code className="bg-canvas-soft px-1.5 py-0.5 border border-hairline font-mono text-[10px]">
                {`{"path":"/checkout", "latency_ms":1200, "status":200}`}
              </code>
              .
            </li>
            <li>
              <strong className="text-ink">Ingestion & Storage:</strong> The Fluentd DaemonSet forwards the parsed JSON
              document to Elasticsearch, where it is indexed in real-time.
            </li>
            <li>
              <strong className="text-ink">Controller Tick Evaluation:</strong> Every 10 seconds, LogStrata executes an
              aggregation query:{" "}
              <code className="bg-canvas-soft px-1.5 py-0.5 border border-hairline font-mono text-[10px]">
                SELECT P95(latency_ms) WHERE path=&apos;/checkout&apos;
              </code>{" "}
              over the last 30s.
            </li>
            <li>
              <strong className="text-ink">Threshold Violation:</strong> The query returns <code className="text-ink">1200ms</code>
              . This violates the configured <code className="text-ink">800ms</code> limit.
            </li>
            <li>
              <strong className="text-ink">Kubernetes PATCH Action:</strong> LogStrata sends a patch API request to
              increase target deployment replica counts.
            </li>
          </ol>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">Scale-Down Cooldowns & Failsafes</h2>
          <p className="text-xs text-body leading-relaxed">
            To avoid &quot;thrashing&quot; (rapid scaling up and down), LogStrata enforces strict cooldown windows. When a
            scale-up is completed, scale-down requests are ignored for a default cooldown period (e.g. 90 seconds). This
            allows newly scheduled pods to start up and stabilize cluster metrics.
          </p>
        </section>
      </div>
    ),
  },
  configuration: {
    title: "Configuration",
    description: "YAML schema definitions and Custom Resource (CRD) configuration options.",
    category: "Reference",
    titleHeader: "Configuration",
    subHeader: "Examine the full YAML schema specifications for LogAutoscalerPolicy Custom Resources.",
    element: (
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">YAML Schema Outline</h2>
          <p className="text-xs text-body leading-relaxed">
            Below is a fully featured{" "}
            <code className="bg-canvas-soft px-1.5 py-0.5 border border-hairline font-mono text-[10px]">
              LogAutoscalerPolicy
            </code>{" "}
            resource. Use it as a configuration template:
          </p>

          <div className="bg-canvas-soft p-4 rounded-none border border-hairline font-mono text-[11px] text-ink leading-relaxed">
            <pre className="whitespace-pre-wrap">
              <code>
                {`apiVersion: core.logstrata.io/v1alpha1
kind: LogAutoscalerPolicy
metadata:
  name: billing-scaler-rules
  namespace: prod-services
spec:
  # Reference to target application
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: billing-worker

  # Scaling bounds limits
  minReplicas: 2
  maxReplicas: 30
  cooldownPeriod: "90s"

  # Metrics sources definitions
  metricSources:
    - type: ElasticSearchQuery
      elasticsearch:
        query: "status:500 AND service:billing"
        timeWindow: "60s"
        trigger:
          metricName: error_rate_pct
          threshold: 5.0
          scaleFactor: 2.0

  # Active Cybersecurity Modifiers
  securityModifications:
    lockMinReplicasOnDDoS: 10
    dynamicIpBlocking: true
    mitigationCooldown: "120s"`}
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
                  <td className="py-2.5 font-mono text-[11px] text-ink">scaleTargetRef</td>
                  <td className="py-2.5">Object</td>
                  <td className="py-2.5">Defines the deployment name and apiVersion to modify scaling bounds on.</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-mono text-[11px] text-ink">minReplicas</td>
                  <td className="py-2.5">Integer</td>
                  <td className="py-2.5">Absolute minimum pod instances the controller can scale down to.</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-mono text-[11px] text-ink">maxReplicas</td>
                  <td className="py-2.5">Integer</td>
                  <td className="py-2.5">Absolute ceiling pod limits to prevent budget runaway.</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-mono text-[11px] text-ink">elasticsearch.query</td>
                  <td className="py-2.5">String</td>
                  <td className="py-2.5">The Lucene-style search query executed against Elasticsearch indices.</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-mono text-[11px] text-ink">elasticsearch.timeWindow</td>
                  <td className="py-2.5">Duration</td>
                  <td className="py-2.5">Time period range looked back (e.g. 30s, 2m, 5m).</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-mono text-[11px] text-ink">securityModifications</td>
                  <td className="py-2.5">Object</td>
                  <td className="py-2.5">
                    Mitigation properties to lock bounds and trigger firewall gates during cyber attacks.
                  </td>
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
    subHeader: "Deep dive into target calculations, latency percentile equations, and cooldown algorithms.",
    element: (
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">Autoscaling Core Equation</h2>
          <p className="text-xs text-body leading-relaxed">
            LogStrata uses a modified target tracking algorithm to determine the desired replica count. At each controller
            tick:
          </p>
          <div className="bg-canvas-soft p-4 rounded-none border border-hairline font-mono text-[11px] text-ink text-center">
            DesiredReplicas = ceil( CurrentReplicas * ( CurrentMetricValue / TargetThreshold ) )
          </div>
          <p className="text-xs text-body leading-relaxed">
            For example, if your current replica count is <code className="text-ink">4</code>, the current P95 response
            latency is <code className="text-ink">1200ms</code>, and your target threshold limit is configured at{" "}
            <code className="text-ink">800ms</code>:
          </p>
          <div className="bg-canvas-soft p-4 rounded-none border border-hairline font-mono text-[11px] text-body">
            DesiredReplicas = ceil( 4 * ( 1200 / 800 ) ) = ceil( 4 * 1.5 ) = 6 replicas
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">Percentile vs Average Metrics</h2>
          <p className="text-xs text-body leading-relaxed">
            Relying on average latencies often masks extreme outliers (e.g. 5% of users experiencing 10-second wait times).
            LogStrata recommends configuring <strong className="text-ink">P95</strong> or <strong className="text-ink">P99</strong>{" "}
            percentiles in the aggregation queries to capture microservice choke points accurately:
          </p>
          <div className="bg-canvas-soft p-4 rounded-none border border-hairline font-mono text-[11px] text-ink leading-relaxed">
            <pre className="whitespace-pre-wrap">
              <code>
                {`# P95 response latency trigger configuration snippet
trigger:
  metricName: p95_latency
  threshold: 800.0  # Milliseconds
  scaleFactor: 1.5  # Boost multiplier when violated`}
              </code>
            </pre>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">Cooldown Restraints</h2>
          <p className="text-xs text-body leading-relaxed">To maintain infrastructure stability, two cooldown windows exist:</p>
          <ul className="list-disc list-inside text-xs text-body flex flex-col gap-1.5 pl-2">
            <li>
              <strong className="text-ink">Scale-Up Cooldown:</strong> Default <code className="text-ink">15s</code>. Prevents
              the controller from spinning up further pods while the previously ordered pods are in the{" "}
              <code className="text-ink">ContainerCreating</code> phase.
            </li>
            <li>
              <strong className="text-ink">Scale-Down Cooldown:</strong> Default <code className="text-ink">90s</code>.
              Prevents deleting healthy pods too quickly during minor traffic fluctuations, avoiding pod spin-up overhead.
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
    titleHeader: "Security Analytics",
    subHeader: "Configure defense modifiers to block credential stuffing and lock scaling bounds during cyber incidents.",
    element: (
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">The Scale-Down Vulnerability</h2>
          <p className="text-xs text-body leading-relaxed">
            A common attack vector against autoscaling APIs is a <strong className="text-ink">resource degradation DDoS</strong>.
            Attackers flood a cluster endpoint, forcing the orchestrator to scale out. Once the attack stops, the cluster
            quickly scales back down. If the attacker alternates this pattern, the cluster gets stuck in a constant loop of
            container creation and deletion, exhausting API resources.
          </p>
          <p className="text-xs text-body leading-relaxed">
            LogStrata solves this by enforcing a <strong className="text-ink">Minimum Replica Scale Lock</strong> during security
            events, preventing pods from being deleted for a safety cooldown period.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">Dynamic IP Blocklisting</h2>
          <p className="text-xs text-body leading-relaxed">
            When brute-force logins or application-level flood patterns are detected, LogStrata parses the logs, isolates the
            offending client IPs, and writes them directly into an Nginx Ingress ConfigMap:
          </p>
          <div className="bg-canvas-soft p-4 rounded-none border border-hairline font-mono text-[11px] text-ink leading-relaxed">
            <pre className="whitespace-pre-wrap">
              <code>
                {`# Ingress IP Blocklist Policy Spec
spec:
  threatMetrics:
    - type: RegexPatternMatch
      pattern: "auth_failed"
      thresholdPerMinute: 60
      action:
        - type: IPBlocklist
          duration: "30m"
          blocklistConfigMap: "nginx-blocked-ips"`}
              </code>
            </pre>
          </div>
          <p className="text-xs text-body leading-relaxed">
            LogStrata monitors this ConfigMap and issues a reload trigger to Nginx Ingress Controllers, blocking matching
            TCP connections at the edge in less than 5 seconds.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">Security Compliance Audit Log</h2>
          <p className="text-xs text-body leading-relaxed">
            Every scaling modifier and blocked IP action is written to a tamper-proof SIEM audit log. You can stream these
            security events to Splunk, Datadog, or Elasticsearch for compliance verification.
          </p>
        </section>
      </div>
    ),
  },
  "api-reference": {
    title: "API Reference",
    description: "HTTP API specification for LogStrata controller control endpoints.",
    category: "Spec",
    titleHeader: "API Reference",
    subHeader: "HTTP endpoints exposed by the LogStrata controller for external query and integration.",
    element: (
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">Ingress IP Blocklist Management</h2>
          <p className="text-xs text-body leading-relaxed">Query or manually add addresses to the dynamic firewall blocklist.</p>

          {/* API Endpoint 1 */}
          <div className="border border-hairline rounded-none bg-canvas overflow-hidden mb-4">
            <div className="border-b border-hairline px-4 py-2.5 flex items-center justify-between bg-canvas-soft">
              <div className="flex items-center gap-2 text-xs">
                <span className="border border-hairline bg-canvas px-2 py-0.5 rounded-none font-mono text-ink text-[10px] font-bold">
                  GET
                </span>
                <span className="font-mono font-semibold text-ink">/api/v1/blocklist</span>
              </div>
              <span className="text-[9px] text-mute font-mono uppercase tracking-wider font-bold">Auth Required</span>
            </div>
            <div className="p-4 text-xs text-body flex flex-col gap-3">
              <p className="leading-relaxed">
                Retrieves the complete array of currently blocked client IP addresses with their remaining lease durations.
              </p>
              <span className="font-semibold text-ink">Example Response:</span>
              <pre className="bg-canvas-soft p-3 rounded-none border border-hairline font-mono text-[10px] text-ink leading-relaxed">
                <code>
                  {`{
  "status": "success",
  "blocked_ips": [
    {
      "ip": "104.22.45.1",
      "reason": "DDoS threshold violation",
      "expires_in_sec": 1420
    }
  ]
}`}
                </code>
              </pre>
            </div>
          </div>

          {/* API Endpoint 2 */}
          <div className="border border-hairline rounded-none bg-canvas overflow-hidden">
            <div className="border-b border-hairline px-4 py-2.5 flex items-center justify-between bg-canvas-soft">
              <div className="flex items-center gap-2 text-xs">
                <span className="border border-hairline bg-canvas px-2 py-0.5 rounded-none font-mono text-ink text-[10px] font-bold">
                  POST
                </span>
                <span className="font-mono font-semibold text-ink">/api/v1/blocklist</span>
              </div>
              <span className="text-[9px] text-mute font-mono uppercase tracking-wider font-bold">Auth Required</span>
            </div>
            <div className="p-4 text-xs text-body flex flex-col gap-3">
              <p className="leading-relaxed">Manually add an IP address to the firewall blocklist.</p>
              <span className="font-semibold text-ink">Payload Schema:</span>
              <pre className="bg-canvas-soft p-3 rounded-none border border-hairline font-mono text-[10px] text-ink leading-relaxed">
                <code>
                  {`{
  "ip": "198.51.100.42",
  "reason": "Manual operator block",
  "duration_sec": 3600
}`}
                </code>
              </pre>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">Controller Metrics Feed</h2>

          {/* API Endpoint 3 */}
          <div className="border border-hairline rounded-none bg-canvas overflow-hidden">
            <div className="border-b border-hairline px-4 py-2.5 flex items-center justify-between bg-canvas-soft">
              <div className="flex items-center gap-2 text-xs">
                <span className="border border-hairline bg-canvas px-2 py-0.5 rounded-none font-mono text-ink text-[10px] font-bold">
                  GET
                </span>
                <span className="font-mono font-semibold text-ink">/api/v1/metrics</span>
              </div>
              <span className="text-[9px] text-mute font-mono uppercase tracking-wider font-bold">Public Feed</span>
            </div>
            <div className="p-4 text-xs text-body flex flex-col gap-3">
              <p className="leading-relaxed">
                Returns current telemetry aggregated by the LogStrata controller daemon for active policy monitoring.
              </p>
              <span className="font-semibold text-ink">Example Response:</span>
              <pre className="bg-canvas-soft p-3 rounded-none border border-hairline font-mono text-[10px] text-ink leading-relaxed">
                <code>
                  {`{
  "cluster_context": "minikube-logstrata-prod",
  "uptime_seconds": 158240,
  "telemetry": {
    "aggregate_rps": 18.2,
    "error_rate_pct": 0.45,
    "p95_latency_ms": 118,
    "target_deployment": "main-frontend",
    "active_replicas": 3,
    "min_replicas_lock": null
  }
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
