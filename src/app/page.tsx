"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { HeroDiagram } from "@/components/HeroDiagram";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";
import { FallingPattern } from "@/components/ui/falling-pattern";
import { ButtonColorful } from "@/components/ui/button-colorful";
import { Pricing } from "@/components/ui/pricing";
import { FaqSectionWithCategories } from "@/components/blocks/faq-with-categories";
import { FloatingPaths } from "@/components/ui/background-paths";
import { Snippet } from "@/components/ui/snippet";
import { Terminal as TerminalIcon, Shield, Zap, Sparkles, Check, Play, Copy, CheckSquare, ArrowRight } from "lucide-react";

type UseCaseKey = "spike" | "ddos" | "chaos";

interface UseCaseContent {
  filename: string;
  code: string;
}

const USE_CASES: Record<UseCaseKey, UseCaseContent> = {
  spike: {
    filename: "checkout-scaling.yaml",
    code: `# E-commerce Flash Sale Autoscaling Policy
apiVersion: core.logstrata.io/v1alpha1
kind: LogAutoscalerPolicy
metadata:
  name: frontend-scaling-rules
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: commerce-frontend
  metricSources:
    - type: ElasticSearchQuery
      elasticsearch:
        query: "status:200 AND path:/checkout"
        timeWindow: "30s"
        trigger:
          metricName: throughput_rps
          threshold: 450.0  # Scale up above 450 RPS
          scaleFactor: 1.5  # Increase scale bounds by 50%
  cooldownPeriod: "60s"
  minReplicas: 3
  maxReplicas: 25`,
  },
  ddos: {
    filename: "brute-force-protection.yaml",
    code: `# Brute-Force & Credential Stuffing Mitigation Policy
apiVersion: security.logstrata.io/v1alpha1
kind: LogThreatPolicy
metadata:
  name: login-brute-force-defense
spec:
  targetIngressRef:
    name: main-api-ingress
  threatMetrics:
    - type: RegexPatternMatch
      pattern: "auth_failed"
      thresholdPerMinute: 60
      action:
        - type: IPBlocklist
          duration: "30m"
          blocklistConfigMap: "nginx-blocked-ips"
        - type: ScalingModifierLock
          lockMinReplicas: 8
          duration: "10m"
          description: "Active threat detected: scaling locked to prevent resource degradation"`,
  },
  chaos: {
    filename: "db-timeout-mitigation.yaml",
    code: `# Cascading Database Timeout Fail-Safe Policy
apiVersion: core.logstrata.io/v1alpha1
kind: LogAutoscalerPolicy
metadata:
  name: db-cascading-failsafe
spec:
  scaleTargetRef:
    name: catalog-service
  metricSources:
    - type: LogMetricsParser
      parseRule:
        extractField: "db_query_time_ms"
        threshold: 1500.0  # > 1500ms query latency
        consecutiveTicks: 3
      trigger:
        metricName: database_latency_spike
        action:
          type: ScaleUpOverride
          replicas: 12
          lockDown: "120s" # Keep scaling up, prevent cooldown during DB recover`,
  },
};

const PRICING_PLANS = [
  {
    name: "Developer",
    price: "Free",
    yearlyPrice: "Free",
    period: "per month",
    features: [
      "Up to 3 namespaces monitoring",
      "Single containerd tailing daemon",
      "Community support (GitHub)",
      "Standard metrics analyzer",
    ],
    description: "Ideal for local evaluation and minikube environments",
    buttonText: "Start Free",
    href: "/dashboard",
    isPopular: false,
  },
  {
    name: "Standard",
    price: "49",
    yearlyPrice: "39",
    period: "per month",
    features: [
      "Up to 15 namespaces monitoring",
      "Mutations within < 500ms latency",
      "Email and discord support",
      "Ingress firewall integration",
      "Declarative YAML threat policies",
    ],
    description: "For small-to-medium clusters in staging and production",
    buttonText: "Get Started",
    href: "/dashboard",
    isPopular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    yearlyPrice: "Custom",
    period: "per month",
    features: [
      "Unlimited namespaces & clusters",
      "Sub-millisecond processing loop",
      "24/7/365 phone & Slack SLA support",
      "Custom regex pattern parsers",
      "Dedicated integration engineering",
    ],
    description: "For mission-critical global scale multi-cluster operations",
    buttonText: "Contact Sales",
    href: "/docs/support",
    isPopular: false,
  },
];

const FAQ_ITEMS = [
  {
    question: "What is the CPU overhead of the LogStrata DaemonSet?",
    answer: "LogStrata is written in high-performance Rust and compiles down to a native binary. Because it reads container log streams directly from the local containerd socket bypassing the network stack, it uses less than 0.1% CPU overhead per core, even under workloads exceeding 10,000 events/second.",
    category: "Performance"
  },
  {
    question: "How does it compare to standard HPA (Horizontal Pod Autoscaler)?",
    answer: "Standard Kubernetes HPA relies on metrics-server which polls CPU/memory every 15-60 seconds. This is reactive and too slow for sudden flash spikes. LogStrata reacts proactively to log event volume shifts, triggering replicas mutation within milliseconds, before the containers overload.",
    category: "Architecture"
  },
  {
    question: "Which container runtimes and Kubernetes distributions are supported?",
    answer: "LogStrata supports all container runtimes that write stdout/stderr logs in Docker JSON or CRI formats (including containerd and CRI-O). It works out of the box with minikube, EKS, GKE, AKS, and self-hosted bare-metal clusters.",
    category: "Compatibility"
  },
  {
    question: "How do we write declarative threat and scaling policies?",
    answer: "Policies are defined as standard Kubernetes Custom Resource Definitions (CRDs). You write a YAML manifest specifying your metric targets (e.g., matching a log pattern, error rate threshold, or request path) and the scaling behavior, and apply it via kubectl or GitOps workflows.",
    category: "Configuration"
  },
  {
    question: "Does LogStrata store or upload our logs to external servers?",
    answer: "No. LogStrata operates entirely on-premise inside your Kubernetes cluster boundaries. Logs are parsed locally on the node in-memory, and only aggregated numerical counts are sent to the controller. No log payloads are stored, written to disk, or sent outside the cluster.",
    category: "Security"
  }
];

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/dashboard");
      }
    });
  }, [router]);

  const [activeUseCase, setActiveUseCase] = useState<UseCaseKey>("spike");
  const [copiedSandbox, setCopiedSandbox] = useState(false);
  const [copiedTerminal, setCopiedTerminal] = useState(false);

  const handleCopySandbox = () => {
    navigator.clipboard.writeText(USE_CASES[activeUseCase].code).then(() => {
      setCopiedSandbox(true);
      setTimeout(() => setCopiedSandbox(false), 2000);
    });
  };

  const handleCopyTerminal = () => {
    const terminalLines = [
      "helm repo add logstrata https://helm.logstrata.io",
      "helm install logstrata logstrata/logstrata --namespace logstrata-system --create-namespace",
      "kubectl apply -f logstrata-policy.yamlSpec",
    ].join("\n");

    navigator.clipboard.writeText(terminalLines).then(() => {
      setCopiedTerminal(true);
      setTimeout(() => setCopiedTerminal(false), 2000);
    });
  };

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-canvas focus:text-ink focus:px-4 focus:py-2 focus:border focus:border-hairline focus:m-4"
      >
        Skip to Content
      </a>

      {/* HERO SECTION with animated flowing background paths */}
      <section
        id="main-content"
        className="relative pt-32 pb-24 border-b border-hairline bg-canvas overflow-hidden min-h-[85vh] flex items-center"
      >
        {/* Falling Pattern Background */}
        <div className="absolute inset-0 z-0 opacity-50 dark:opacity-40">
          <FallingPattern className="h-full w-full [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_85%)]" />
        </div>

        {/* Subtle Ambient Glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[600px] pointer-events-none z-0"
          aria-hidden="true"
          style={{
            background: `
              radial-gradient(ellipse 40% 50% at 20% 50%, rgba(0, 124, 240, 0.04) 0%, transparent 70%),
              radial-gradient(ellipse 30% 45% at 60% 60%, rgba(121, 40, 202, 0.03) 0%, transparent 70%)
            `,
            filter: "blur(60px)",
          }}
        />

        <div className="mx-auto max-w-[1400px] px-6 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Side: Copy and Actions */}
            <div className="lg:col-span-5 flex flex-col items-start">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-hairline bg-canvas-soft mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0070f3] animate-pulse"></span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-body">
                  01 / DYNAMIC AUTOSCALING
                </span>
              </div>

              <h1 className="font-sans text-4xl sm:text-[48px] font-semibold tracking-[-2.4px] leading-[1.05] text-ink mb-6 text-balance">
                Log-Driven Kubernetes scaling.
              </h1>

              <p className="font-sans text-lg text-body mb-8 leading-relaxed font-light text-balance">
                Interpret container stdout in real-time. Patch HPA bounds and block malicious ingress instantly, seconds before CPU capacity limits are breached.
              </p>

              <p className="font-sans text-sm text-mute mb-10 leading-relaxed font-light">
                Traditional CPU/memory-based autoscaling reacts too late. LogStrata tails access log event patterns directly from containerd sockets, triggering pod scale-up and IP rate-limiting policy adjustments within milliseconds of load shifts.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-12">
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <button className="relative w-full sm:w-auto h-12 rounded-xl px-8 text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100 transition-all duration-200 inline-flex items-center justify-center gap-2 group border border-zinc-900 dark:border-transparent shadow-sm hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    <span>Open live playground</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </Link>
                <Link
                  href="/docs/getting-started"
                  className="h-12 px-8 text-sm font-semibold rounded-xl border border-zinc-300 dark:border-zinc-800 focus-visible:outline-none w-full sm:w-auto text-center bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 inline-flex items-center justify-center transition-all duration-200"
                >
                  Read technical docs
                </Link>
              </div>

              {/* Dotted separator and premium stats panel */}
              <div className="w-full pt-8 border-t border-dashed border-hairline/60">
                <div className="grid grid-cols-3 gap-8 text-left max-w-lg">
                  <div className="group cursor-default hover:translate-y-[-2px] transition-transform duration-200">
                    <div className="font-mono text-2xl font-bold text-ink mb-1 tracking-tight">
                      &lt; 50ms
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-mute group-hover:text-ink transition-colors">
                      DECISION LOOP
                    </div>
                  </div>
                  <div className="group cursor-default hover:translate-y-[-2px] transition-transform duration-200">
                    <div className="font-mono text-2xl font-bold text-ink mb-1 tracking-tight">
                      5
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-mute group-hover:text-ink transition-colors">
                      PROVIDER TYPES
                    </div>
                  </div>
                  <div className="group cursor-default hover:translate-y-[-2px] transition-transform duration-200">
                    <div className="font-mono text-2xl font-bold text-ink mb-1 tracking-tight flex items-center gap-2">
                      Public
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-mute group-hover:text-ink transition-colors">
                      SIMULATION LAB
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Live Architecture Visualization */}
            <div className="lg:col-span-7 w-full border border-hairline bg-canvas-soft/85 backdrop-blur-md p-6 rounded-2xl shadow-xl">
              <HeroDiagram />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: PROBLEM */}
      <section id="features" className="py-24 px-6 border-b border-hairline bg-canvas-soft">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-16 max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-widest text-[#0070f3] font-bold">
              02 / THE CPU METRIC LAG
            </span>
            <h2 className="font-sans text-[32px] font-semibold tracking-[-1.28px] leading-[40px] text-ink mt-3 mb-4">
              Traditional HPA reacts too late.
            </h2>
            <p className="text-body text-base leading-relaxed font-light">
              Kubernetes Horizontal Pod Autoscalers rely on metrics-server CPU/memory polling. During sudden load events, your containers will crash-loop before the system registers resource spikes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* CPU Scaling Card */}
            <div className="border border-hairline bg-canvas p-6 rounded-xl flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                  <h3 className="font-sans text-sm font-semibold text-ink uppercase tracking-wider">
                    Standard CPU Metrics Scaling
                  </h3>
                </div>
                <p className="text-xs text-body leading-relaxed mb-6 font-light">
                  Metrics server averages CPU usage over 60-second windows. During flash-sale traffic spikes, request queues fill up instantly. Latency rises exponentially, causing database socket depletion and gateway timeouts before pods scale.
                </p>
              </div>

              {/* Mock Graph */}
              <div className="border border-hairline bg-canvas-soft p-4 rounded-lg font-mono text-[9px] text-rose-500">
                <div className="flex justify-between text-[8px] text-mute mb-2">
                  <span>CPU UTILIZATION (AVG)</span>
                  <span>100% OVERLOAD</span>
                </div>
                <div className="h-20 w-full flex items-end gap-1 border-b border-l border-hairline-strong pb-1 pl-1">
                  <div className="bg-zinc-300 dark:bg-zinc-800 w-full h-[15%]"></div>
                  <div className="bg-zinc-300 dark:bg-zinc-800 w-full h-[18%]"></div>
                  <div className="bg-rose-500 w-full h-[85%] animate-pulse"></div>
                  <div className="bg-rose-500 w-full h-[100%] animate-pulse"></div>
                </div>
                <div className="mt-2 text-rose-400 font-semibold text-[8px]">
                  ❌ Connection timeouts (504 Gateway Timeout) detected.
                </div>
              </div>
            </div>

            {/* LogStrata Card */}
            <div className="border border-hairline bg-canvas p-6 rounded-xl flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h3 className="font-sans text-sm font-semibold text-ink uppercase tracking-wider">
                    LogStrata Dynamic Pre-emption
                  </h3>
                </div>
                <p className="text-xs text-body leading-relaxed mb-6 font-light">
                  LogStrata parses individual HTTP access logs on the fly. By monitoring the exact throughput rate of checkout endpoints, the scaling trigger is fired immediately—allocating replicas before CPU metrics even begin to move.
                </p>
              </div>

              {/* Mock Graph */}
              <div className="border border-hairline bg-canvas-soft p-4 rounded-lg font-mono text-[9px] text-emerald-500">
                <div className="flex justify-between text-[8px] text-mute mb-2">
                  <span>PRE-EMPTIVE CAPACITY ROUTING</span>
                  <span>9 REPLICAS PROVISIONED</span>
                </div>
                <div className="h-20 w-full flex items-end gap-1 border-b border-l border-hairline-strong pb-1 pl-1">
                  <div className="bg-emerald-500 w-full h-[15%]"></div>
                  <div className="bg-emerald-500 w-full h-[35%]"></div>
                  <div className="bg-emerald-500 w-full h-[65%]"></div>
                  <div className="bg-emerald-500 w-full h-[95%]"></div>
                </div>
                <div className="mt-2 text-emerald-400 font-semibold text-[8px]">
                  ✓ Latency stabilized at 120ms. Connection queue cleared.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: HOW LOGSTRATA WORKS */}
      <section className="py-24 px-6 border-b border-hairline bg-canvas">
        <div className="mx-auto max-w-[1400px]">
          <div className="text-center mb-16">
            <span className="font-mono text-xs uppercase tracking-widest text-[#0070f3] font-bold">
              03 / INGESTION TO ENFORCEMENT
            </span>
            <h2 className="font-sans text-[32px] font-semibold tracking-[-1.28px] leading-[40px] text-ink mt-3 mb-4">
              How LogStrata Works.
            </h2>
            <p className="text-body max-w-xl mx-auto leading-relaxed text-sm font-light">
              A zero-overhead daemonset listens directly on the container socket, transforming raw stdout streams into instant scaling actions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div
              className="hidden md:block absolute top-[50px] left-[15%] right-[15%] border-t border-dashed border-hairline-strong z-0"
              aria-hidden="true"
            />

            {/* Step 1 */}
            <div className="relative z-10 border border-hairline bg-canvas-soft p-6 rounded-xl shadow-sm hover:border-hairline-strong transition-all duration-200">
              <div className="w-10 h-10 rounded-full bg-canvas border border-hairline-strong flex items-center justify-center font-mono text-xs font-bold text-ink mb-4">
                01
              </div>
              <h4 className="font-sans text-sm font-bold text-ink mb-2">Tails Socket</h4>
              <p className="text-[11px] text-body leading-relaxed font-light">
                DaemonSet tails container stdout files directly from <code>/var/log/pods</code>, completely bypassing the user network path.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 border border-hairline bg-canvas-soft p-6 rounded-xl shadow-sm hover:border-hairline-strong transition-all duration-200">
              <div className="w-10 h-10 rounded-full bg-canvas border border-hairline-strong flex items-center justify-center font-mono text-xs font-bold text-ink mb-4">
                02
              </div>
              <h4 className="font-sans text-sm font-bold text-ink mb-2">Parses JSON</h4>
              <p className="text-[11px] text-body leading-relaxed font-light">
                Extracts latency fields, response status, endpoints, and incoming client subnet IPs at sub-millisecond speeds.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 border border-hairline bg-canvas-soft p-6 rounded-xl shadow-sm hover:border-hairline-strong transition-all duration-200">
              <div className="w-10 h-10 rounded-full bg-canvas border border-hairline-strong flex items-center justify-center font-mono text-xs font-bold text-ink mb-4">
                03
              </div>
              <h4 className="font-sans text-sm font-bold text-ink mb-2">Evaluates Rules</h4>
              <p className="text-[11px] text-body leading-relaxed font-light">
                Matches extracted values against policy criteria (RPS ceilings, error percentages, rate limits, cooldown bounds).
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative z-10 border border-hairline bg-canvas-soft p-6 rounded-xl shadow-sm hover:border-hairline-strong transition-all duration-200">
              <div className="w-10 h-10 rounded-full bg-canvas border border-hairline-strong flex items-center justify-center font-mono text-xs font-bold text-ink mb-4">
                04
              </div>
              <h4 className="font-sans text-sm font-bold text-ink mb-2">API Patch</h4>
              <p className="text-[11px] text-body leading-relaxed font-light">
                Triggers mutations on Kubernetes API servers to scale pods or update ingress rate-limiting rules.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: CORE FEATURES / BENTO GRID REDESIGN */}
      <section className="py-24 px-6 border-b border-hairline bg-canvas-soft">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-16 max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-widest text-[#0070f3] font-bold">
              04 / ARCHITECTURE CAPABILITIES
            </span>
            <h2 className="font-sans text-[32px] font-semibold tracking-[-1.28px] leading-[40px] text-ink mt-3 mb-4">
              Core Features.
            </h2>
            <p className="text-body text-base leading-relaxed font-light">
              Observe and autoscale within a single control loop. Skip third-party metric collectors entirely.
            </p>
          </div>

          {/* Styled Grid resembling a premium Bento Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* Bento Block 1: JSON Parser (Double Width) */}
            <div className="group relative p-8 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-canvas overflow-hidden hover:shadow-lg transition-all duration-300 md:col-span-2 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#0070f3]/5 text-[#0070f3] mb-4 border border-[#0070f3]/10">
                  <TerminalIcon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-white tracking-tight text-lg mb-2">
                  High-Speed JSON Parser
                  <span className="ml-2 text-xs text-emerald-500 font-mono bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 font-normal">
                    CPU Overhead: &lt; 0.1%
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-light mb-6">
                  Parse container stdout socket streams directly from containerd. Our high-performance extraction loop decodes JSON lines in micro-seconds, logging throughput metrics, request paths, response duration and query parameters.
                </p>
              </div>

              <div className="bg-canvas-soft border border-hairline rounded-lg p-4 font-mono text-[10px] text-zinc-400 overflow-auto">
                <div className="text-zinc-500 mb-2">{"// Ingestion Console Feed"}</div>
                <div className="space-y-1">
                  <div>
                    <span className="text-[#0070f3]">stdout</span> &#123; &quot;time&quot;:
                    &quot;12:05:01&quot;, &quot;duration&quot;: 48, &quot;url&quot;: &quot;/cart&quot;,
                    &quot;ip&quot;: &quot;172.58.91.22&quot; &#125;
                  </div>
                  <div>
                    <span className="text-[#0070f3]">stdout</span> &#123; &quot;time&quot;:
                    &quot;12:05:02&quot;, &quot;duration&quot;: 156, &quot;url&quot;: &quot;/checkout&quot;,
                    &quot;ip&quot;: &quot;104.24.12.9&quot; &#125;
                  </div>
                  <div className="text-amber-500">
                    <span className="text-amber-500 font-bold">stderr</span> &#123; &quot;time&quot;:
                    &quot;12:05:03&quot;, &quot;error&quot;: &quot;db_timeout&quot;, &quot;query&quot;:
                    &quot;SELECT * FROM inventory&quot; &#125;
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Block 2: Declarative Policies (Single Width) */}
            <div className="group relative p-8 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-canvas overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-500/5 text-blue-500 mb-4 border border-blue-500/10">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-white tracking-tight text-lg mb-2">
                  Declarative Policies
                  <span className="ml-2 text-xs text-blue-500 font-mono bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10 font-normal">
                    GitOps Ready
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-light mb-6">
                  Configure autoscaling parameters through YAML Custom Resource Definitions (CRDs). Set custom metrics thresholds, scale boundaries, cooldown periods, and threat locks.
                </p>
              </div>

              <div className="bg-canvas-soft border border-hairline rounded-lg p-4 font-mono text-[9px] text-zinc-400 overflow-auto">
                <div className="text-zinc-500 mb-1">yaml-policy-spec.yaml</div>
                <pre className="whitespace-pre">
                  <span className="text-blue-400">apiVersion</span>: core.logstrata.io/v1alpha1{"\n"}
                  <span className="text-blue-400">kind</span>: LogAutoscalerPolicy{"\n"}
                  <span className="text-blue-400">metadata</span>:{"\n"}
                  {"  "}<span className="text-blue-400">name</span>: checkout-rules{"\n"}
                  <span className="text-blue-400">spec</span>:{"\n"}
                  {"  "}<span className="text-blue-400">scaleTargetRef</span>:{"\n"}
                  {"    "}<span className="text-blue-400">name</span>: commerce-frontend
                </pre>
              </div>
            </div>

            {/* Bento Block 3: Ingress Firewall (Single Width) */}
            <div className="group relative p-8 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-canvas overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-rose-500/5 text-rose-500 mb-4 border border-rose-500/10">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-white tracking-tight text-lg mb-2">
                  Ingress Firewall
                  <span className="ml-2 text-xs text-rose-500 font-mono bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/10 font-normal">
                    Auto-Block
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-light mb-6">
                  Protect workloads from malicious requests by blocking IPs at the ingress layer. LogStrata monitors fail counts and pattern repetitions, dynamically updating Nginx Ingress ConfigMaps to drop connections.
                </p>
              </div>

              <div className="bg-canvas-soft border border-hairline rounded-lg p-4 font-mono text-[9px] text-rose-500 overflow-auto">
                <div className="text-zinc-500 mb-2">{"// Ingress Rate Limiting Firewall"}</div>
                <div className="space-y-1">
                  <div>
                    <span className="text-zinc-400 font-bold">12:06:10</span> [BLOCKED] IP: 185.220.101.42 (Reps: 120/min on /login)
                  </div>
                  <div className="text-emerald-500 font-bold mt-1">
                    ✓ Ingress ConfigMap &quot;nginx-blocked-ips&quot; updated.
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Block 4: Predictive Scaling (Double Width) */}
            <div className="group relative p-8 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-canvas overflow-hidden hover:shadow-lg transition-all duration-300 md:col-span-2 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-500/5 text-amber-500 mb-4 border border-amber-500/10">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-white tracking-tight text-lg mb-2">
                  Predictive In-Memory Scaling
                  <span className="ml-2 text-xs text-amber-500 font-mono bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 font-normal">
                    &lt; 50ms Decision
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-light mb-6">
                  LogStrata analyzes in-memory logs asynchronously to identify traffic anomalies. Rather than waiting for metrics-server or Prometheus queries, the controller makes immediate decisions and propagates them to the Kubernetes endpoint, protecting downstream resources from queue overload.
                </p>
              </div>

              <div className="bg-canvas-soft border border-hairline rounded-lg p-4 font-mono text-[10px] text-zinc-400">
                <div className="flex items-center justify-between text-zinc-500 mb-2">
                  <span>{"// Real-time Event Correlation Loop"}</span>
                  <span className="text-[#0070f3] animate-pulse">Running</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[9px]">
                  <div className="border border-hairline bg-canvas p-2 rounded">
                    <span className="text-zinc-400 block uppercase text-[8px]">Ingress Rate</span>
                    <span className="text-zinc-900 dark:text-white font-bold">1,480 req/s</span>
                  </div>
                  <div className="border border-hairline bg-canvas p-2 rounded">
                    <span className="text-zinc-400 block uppercase text-[8px]">Anomaly Index</span>
                    <span className="text-amber-500 font-bold">Medium (0.68)</span>
                  </div>
                  <div className="border border-hairline bg-canvas p-2 rounded">
                    <span className="text-zinc-400 block uppercase text-[8px]">Auto-Provision</span>
                    <span className="text-emerald-500 font-bold">Targeted [+6]</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: REALISTIC DASHBOARD PREVIEW */}
      <section className="py-24 px-6 border-b border-hairline bg-canvas">
        <div className="mx-auto max-w-[1400px]">
          <div className="text-center mb-16">
            <span className="font-mono text-xs uppercase tracking-widest text-[#0070f3] font-bold">
              05 / TELEMETRY DASHBOARD
            </span>
            <h2 className="font-sans text-[32px] font-semibold tracking-[-1.28px] leading-[40px] text-ink mt-3 mb-4">
              Total Cluster Visibility.
            </h2>
            <p className="text-body max-w-xl mx-auto leading-relaxed text-sm font-light">
              Monitor ingress rates, autoscale transitions, and client blocklists inside a single unified dashboard interface.
            </p>
          </div>

          <div className="border border-hairline rounded-xl overflow-hidden bg-canvas shadow-lg max-w-5xl mx-auto">
            <div className="bg-canvas-soft border-b border-hairline px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="font-mono text-[11px] font-bold text-ink uppercase tracking-wider">
                  minikube-cluster-context
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-mute">
                <span>RPS: 1,480/s</span>
                <span>BLOCKED: 42 IPs</span>
                <span>REPLICAS: 9/12</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 border-b border-hairline">
              <div className="p-6 border-b md:border-b-0 md:border-r border-hairline">
                <span className="font-mono text-[10px] text-mute uppercase">AUTOSCALER STATE</span>
                <div className="text-2xl font-bold text-ink mt-1">ACTIVE</div>
                <p className="text-[10px] text-body mt-2 leading-relaxed font-light">
                  Evaluator matched 1 active scaling target.
                </p>
              </div>
              <div className="p-6 border-b md:border-b-0 md:border-r border-hairline">
                <span className="font-mono text-[10px] text-rose-500 uppercase">BLOCKED TRAFFIC</span>
                <div className="text-2xl font-bold text-rose-500 mt-1">4.2%</div>
                <p className="text-[10px] text-body mt-2 leading-relaxed font-light">
                  42 rogue IPs blocked in the last hour.
                </p>
              </div>
              <div className="p-6">
                <span className="font-mono text-[10px] text-blue-500 uppercase">
                  AVG RESPONSE DURATION
                </span>
                <div className="text-2xl font-bold text-blue-500 mt-1">120ms</div>
                <p className="text-[10px] text-body mt-2 leading-relaxed font-light">
                  stabilized from 450ms peak load.
                </p>
              </div>
            </div>

            <div className="bg-canvas-soft p-6 font-mono text-[10px] text-zinc-400 min-h-[180px] overflow-auto">
              <div className="text-zinc-500 mb-2">{"// Scaling Decision Log"}</div>
              <div className="space-y-1.5">
                <div className="flex gap-4">
                  <span className="text-zinc-500">12:10:45.000</span>
                  <span>
                    <span className="text-blue-400 font-bold">[INFO]</span> Ingress latency exceeded 400ms target limit on endpoint /checkout
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-zinc-500">12:10:45.080</span>
                  <span>
                    <span className="text-amber-500 font-bold">[WARN]</span> Queue congestion detected. Scaler evaluating target rules...
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-zinc-500">12:10:45.150</span>
                  <span>
                    <span className="text-emerald-500 font-bold">[EXEC]</span> Patched API deployment/commerce-frontend: replicas scaled 3 ➔ 9
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-zinc-500">12:10:50.000</span>
                  <span>
                    <span className="text-zinc-500">[INFO]</span> New pods running. Latency recovered to 120ms.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: INSIDE THE CONTROL LOOP */}
      <section id="architecture" className="py-24 px-6 border-b border-hairline bg-canvas-soft">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-16 max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-widest text-[#0070f3] font-bold">
              06 / CONTROL LOOP ENGINE
            </span>
            <h2 className="font-sans text-[32px] font-semibold tracking-[-1.28px] leading-[40px] text-ink mt-3 mb-4">
              Inside the Control Loop.
            </h2>
            <p className="text-body text-base leading-relaxed font-light">
              A decoupled log controller analyzes multi-dimensional container stdout log patterns dynamically, applying feedback to the Kubernetes HPA scaling loop without adding request latency.
            </p>
          </div>

          <div className="max-w-5xl mx-auto rounded-xl overflow-hidden border border-hairline bg-canvas p-6 shadow-md">
            <ArchitectureDiagram />
          </div>
        </div>
      </section>

      {/* SECTION 7: REAL USE CASES */}
      <section id="use-cases" className="py-24 px-6 border-b border-hairline bg-canvas">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Side Tab Navigation */}
            <div className="lg:col-span-5">
              <span className="font-mono text-xs uppercase tracking-widest text-[#0070f3] font-bold">
                07 / OPERATIONAL SCENARIOS
              </span>
              <h2 className="font-sans text-[32px] font-semibold tracking-[-1.28px] leading-[40px] text-ink mt-3 mb-6">
                Real Use Cases.
              </h2>

              <div className="flex flex-col gap-3" id="use-cases-tabs">
                <button
                  className={`w-full text-left p-4 rounded-xl border cursor-pointer group focus-visible:outline-none focus-visible:border-primary transition-all duration-200 ${
                    activeUseCase === "spike"
                      ? "border-primary bg-canvas-soft shadow-sm"
                      : "border-hairline bg-canvas hover:border-hairline-strong"
                  }`}
                  onClick={() => setActiveUseCase("spike")}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                    <span className="font-sans text-xs font-bold uppercase tracking-wider text-ink">
                      E-Commerce Flash Sales
                    </span>
                  </div>
                  <p className="text-xs text-body mt-2 leading-relaxed pl-5 font-light">
                    Monitor checkout latencies directly in container logs. Scale replicas up to match high transaction rates.
                  </p>
                </button>

                <button
                  className={`w-full text-left p-4 rounded-xl border cursor-pointer group focus-visible:outline-none focus-visible:border-primary transition-all duration-200 ${
                    activeUseCase === "ddos"
                      ? "border-primary bg-canvas-soft shadow-sm"
                      : "border-hairline bg-canvas hover:border-hairline-strong"
                  }`}
                  onClick={() => setActiveUseCase("ddos")}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                    <span className="font-sans text-xs font-bold uppercase tracking-wider text-ink">
                      Credential Stuffing Attacks
                    </span>
                  </div>
                  <p className="text-xs text-body mt-2 leading-relaxed pl-5 font-light">
                    Detect login failure sequences in logs and lock replica boundaries to prevent cost spikes from malicious traffic.
                  </p>
                </button>

                <button
                  className={`w-full text-left p-4 rounded-xl border cursor-pointer group focus-visible:outline-none focus-visible:border-primary transition-all duration-200 ${
                    activeUseCase === "chaos"
                      ? "border-primary bg-canvas-soft shadow-sm"
                      : "border-hairline bg-canvas hover:border-hairline-strong"
                  }`}
                  onClick={() => setActiveUseCase("chaos")}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                    <span className="font-sans text-xs font-bold uppercase tracking-wider text-ink">
                      Database Chaos Events
                    </span>
                  </div>
                  <p className="text-xs text-body mt-2 leading-relaxed pl-5 font-light">
                    Establish db timeout thresholds to override scaling policies during cascading downstream storage failures.
                  </p>
                </button>
              </div>
            </div>

            {/* Right Side: Config YAML Preview */}
            <div className="lg:col-span-7">
              <div className="border border-hairline bg-canvas rounded-xl overflow-hidden relative group shadow-sm">
                <div className="border-b border-hairline px-4 py-3 bg-canvas-soft flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-mute" />
                    <span className="h-2 w-2 rounded-full bg-mute" />
                    <span className="h-2 w-2 rounded-full bg-mute" />
                  </div>
                  <span className="font-mono text-[10px] text-mute" id="current-filename">
                    {USE_CASES[activeUseCase].filename}
                  </span>
                </div>

                <button
                  onClick={handleCopySandbox}
                  className="absolute right-4 top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-canvas-soft hover:bg-canvas-soft-hover border border-hairline text-[10px] font-mono px-2.5 py-1 rounded-[4px] cursor-pointer focus:opacity-100 focus:outline-none text-ink"
                  aria-label="Copy code block to clipboard"
                >
                  {copiedSandbox ? "Copied!" : "Copy"}
                </button>

                <div
                  className="p-6 font-mono text-[11px] text-code-text bg-code-bg min-h-[300px] overflow-auto custom-scrollbar"
                  id="tab-content-code"
                >
                  <pre className="whitespace-pre-wrap">
                    <code>{USE_CASES[activeUseCase].code}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: QUICK START */}
      <section className="py-24 px-6 border-b border-hairline bg-canvas-soft">
        <div className="mx-auto max-w-[1400px]">
          <div className="text-center mb-16">
            <span className="font-mono text-xs uppercase tracking-widest text-[#0070f3] font-bold">
              08 / QUICK START
            </span>
            <h2 className="font-sans text-[32px] font-semibold tracking-[-1.28px] leading-[40px] text-ink mt-3 mb-4">
              Get Up and Running.
            </h2>
            <p className="text-body max-w-xl mx-auto leading-relaxed text-sm font-light">
              Deploy the LogStrata controller using Helm, apply configurations, and start monitoring logs.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="border border-hairline bg-canvas rounded-xl overflow-hidden relative group shadow-sm">
              <div className="border-b border-hairline px-4 py-3 bg-canvas-soft flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-mute" />
                  <span className="h-2 w-2 rounded-full bg-mute" />
                  <span className="h-2 w-2 rounded-full bg-mute" />
                </div>
                <span className="font-mono text-[10px] text-mute">Terminal</span>
              </div>

              <button
                onClick={handleCopyTerminal}
                className="absolute right-4 top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-canvas-soft hover:bg-canvas-soft-hover border border-hairline text-[10px] font-mono px-2.5 py-1 rounded-[4px] cursor-pointer focus:opacity-100 focus:outline-none text-ink"
                aria-label="Copy terminal commands to clipboard"
              >
                {copiedTerminal ? "Copied!" : "Copy"}
              </button>

              <div
                className="p-6 font-mono text-[11px] text-code-text bg-code-bg min-h-[220px] custom-scrollbar"
                id="terminal-content-raw"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-mute">$</span>
                  <span className="text-ink">helm repo add logstrata https://helm.logstrata.io</span>
                </div>
                <div className="text-zinc-500 mb-4">
                  &quot;logstrata&quot; has been added to your repositories
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-mute">$</span>
                  <span className="text-ink">
                    helm install logstrata logstrata/logstrata --namespace logstrata-system --create-namespace
                  </span>
                </div>
                <div className="text-zinc-500 mb-1">NAMESPACE: logstrata-system</div>
                <div className="text-zinc-500 mb-4">STATUS: deployed</div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-mute">$</span>
                  <span className="text-ink">kubectl apply -f logstrata-policy.yaml</span>
                </div>
                <div className="text-emerald-500 font-semibold">
                  logautoscalerpolicy.core.logstrata.io/frontend-scaling-rules created ✓
                </div>
              </div>
            </div>

            <div className="mt-8 max-w-3xl mx-auto flex flex-col items-center border border-hairline bg-canvas p-6 rounded-2xl shadow-sm">
              <span className="font-mono text-[10px] uppercase tracking-wider text-mute mb-3">
                Or copy and run the installer directly
              </span>
              <Snippet
                text="helm install logstrata logstrata/logstrata --namespace logstrata-system --create-namespace"
                dark
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: SPECIFICATION REFERENCE */}
      <section className="py-24 px-6 border-b border-hairline bg-canvas">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-16 max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-widest text-[#0070f3] font-bold">
              09 / SPECIFICATION REFERENCE
            </span>
            <h2 className="font-sans text-[32px] font-semibold tracking-[-1.28px] leading-[40px] text-ink mt-3 mb-4">
              Documentation Preview.
            </h2>
            <p className="text-body text-base leading-relaxed font-light">
              Review standard Custom Resource Definitions (CRDs) and metric parameter schemas supported by the evaluator core.
            </p>
          </div>

          <div className="border border-hairline rounded-xl overflow-hidden max-w-4xl mx-auto shadow-sm">
            <table className="w-full border-collapse text-left font-sans text-xs">
              <thead>
                <tr className="bg-canvas-soft border-b border-hairline font-mono text-[10px] text-mute uppercase">
                  <th className="p-4">CRD Group / Resource</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Primary Config Parameters</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-ink">
                <tr>
                  <td className="p-4 font-mono font-semibold">LogAutoscalerPolicy</td>
                  <td className="p-4 font-light">
                    Defines real-time pod replicas boundaries and triggering log criteria.
                  </td>
                  <td className="p-4 font-mono text-[10px] text-mute">
                    minReplicas, maxReplicas, trigger.threshold
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-mono font-semibold">LogThreatPolicy</td>
                  <td className="p-4 font-light">
                    Specifies rate limiting and host blocking rules based on log failure loops.
                  </td>
                  <td className="p-4 font-mono text-[10px] text-mute">
                    threatMetrics.pattern, action.duration
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-mono font-semibold">IngressRateLimiter</td>
                  <td className="p-4 font-light">
                    Configures ConfigMap routing rules to enforce firewall blocks on client IPs.
                  </td>
                  <td className="p-4 font-mono text-[10px] text-mute">
                    blocklistConfigMap, duration
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* NEW SECTION 10: INTERACTIVE PRICING SECTION */}
      <section className="py-24 px-6 border-b border-hairline bg-canvas-soft">
        <Pricing
          title="Sized for clusters of any scale"
          description={`Local testing is always free. Scale up to staging and multi-cluster production environments dynamically.`}
          plans={PRICING_PLANS}
        />
      </section>

      {/* NEW SECTION 11: FAQ ACCORDION SECTION FROM 21ST.DEV */}
      <section className="py-24 px-6 border-b border-hairline bg-canvas">
        <FaqSectionWithCategories
          title="Frequently Asked Questions"
          description="Everything you need to know about log-driven autoscaling, security loops, and container telemetry."
          items={FAQ_ITEMS}
        />
      </section>

      {/* NEW SECTION 11.5: INTERACTIVE TELEMETRY PREVIEW */}
      <section className="relative py-32 px-6 border-b border-hairline bg-canvas overflow-hidden flex items-center justify-center min-h-[50vh]">
        {/* Floating Paths Background */}
        <div className="absolute inset-0 z-0 opacity-40 dark:opacity-60">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>

        <div className="mx-auto max-w-[800px] relative z-10 text-center flex flex-col items-center">
          <span className="font-mono text-xs uppercase tracking-widest text-[#0070f3] font-bold mb-4">
            11.5 / TRAFFIC SHARDS
          </span>
          <h2 className="font-sans text-3xl sm:text-4xl font-semibold tracking-[-1.28px] leading-[40px] text-ink mb-6 text-balance">
            Visually track traffic anomalies.
          </h2>
          <p className="text-body text-base leading-relaxed font-light mb-8 max-w-2xl text-balance">
            Log access requests cascade through the control engine like rapid floating streams. Our low-latency anomaly detectors capture sudden volume fluctuations, routing events to isolated pods before the CPU bottlenecks.
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-xs text-mute uppercase tracking-wider">
              Telemetry Engine Online
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 12: CALL TO ACTION */}
      <section className="py-24 px-6 bg-canvas border-b border-hairline relative overflow-hidden">
        {/* Secondary Mesh Backdrop */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.05] dark:opacity-[0.1] blur-[80px] z-0"
          aria-hidden="true"
        >
          <div className="absolute bottom-[-100px] right-[10%] w-[50%] h-[300px] rounded-full bg-gradient-to-r from-[#7928ca] to-[#ff0080]" />
        </div>

        <div className="mx-auto max-w-[1000px] relative z-10 text-center border border-hairline bg-canvas-soft p-12 rounded-2xl shadow-sm">
          <span className="font-mono text-xs uppercase tracking-widest text-[#0070f3] font-bold mb-4 block">
            12 / DEPLOY LOGSTRATA
          </span>
          <h2 className="font-sans text-[32px] font-semibold tracking-[-1.28px] leading-[40px] text-ink mb-6">
            Take control of your cluster latency.
          </h2>
          <p className="text-body max-w-xl mx-auto leading-relaxed text-sm font-light mb-8">
            Switch scaling decisions from reactive resource consumption limits to predictive log-level insights. Deploy to minikube or cloud clusters in seconds.
          </p>

          <div className="max-w-md mx-auto mb-8 text-left">
            <div className="text-[10px] font-mono text-mute mb-2 text-center uppercase tracking-wider">
              Quick Helm Install Command
            </div>
            <Snippet
              text="helm install logstrata logstrata/logstrata --namespace logstrata-system --create-namespace"
              dark
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <button className="relative w-full sm:w-auto h-12 rounded-xl px-8 text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100 transition-all duration-200 inline-flex items-center justify-center gap-2 group border border-zinc-900 dark:border-transparent shadow-sm hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                <span>Open live playground</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
            <Link
              href="/docs/getting-started"
              className="h-12 px-8 text-sm font-semibold rounded-xl border border-zinc-300 dark:border-zinc-800 focus-visible:outline-none w-full sm:w-auto text-center bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 inline-flex items-center justify-center transition-all duration-200"
            >
              Read technical docs
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
