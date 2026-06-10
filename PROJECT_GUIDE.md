# LogStrata: Security-Aware Auto Log Scaling & Analytics (SLSA)

LogStrata is an intelligent, container-native cloud infrastructure management and autoscaling platform. By analyzing multi-dimensional application telemetry and security logs in real-time, LogStrata drives automated container scaling bounds and active network isolation defenses within Kubernetes clusters.

> [!NOTE]
> Unlike traditional metrics-based autoscalers (which rely on lagging CPU and memory utilization), LogStrata analyzes structured access logs directly from container runtimes to pre-emptively adapt cluster topology before resources saturate.

---

## 1. The Core Problem & Solution

### Traditional Autoscaling Limitations
* **Lagging Indicators:** CPU and memory utilization are lagging indicators. By the time resource utilization thresholds are breached, application latencies have already spiked, resulting in degraded SLAs or Out-of-Memory (OOM) pod crashes.
* **SecOps Blindspot:** Under application-layer DDoS or credential stuffing attacks, traditional HPAs react by scaling up pods endlessly. This exhausts cloud budgets and database connections, rather than mitigating the malicious threat at the cluster ingress.

### The LogStrata Approach
LogStrata hooks directly into the stdout streams of application pods. The control plane evaluates logs on a millisecond-level loop:
* **Pre-emptive Scale-Up:** Detects incoming transaction rate jumps (RPS spikes) or latency surges, and scales pods seconds before CPU curves rise.
* **Security lock override:** If active security attacks (such as brute-force spikes or DDoS floods) are detected, LogStrata **locks scale-down events** to preserve service availability while executing active ingress defenses.
* **Active Defense Ingress Rules:** Auto-generates Kubernetes NetworkPolicies and updates Ingress ConfigMaps to block offending IPs at the cluster boundary.

---

## 2. Technical Architecture

```
                      ┌──────────────────────────────────────────────┐
                      │            LOGSTRATA CONTROL LOOP            │
                      └──────────────────────┬───────────────────────┘
                                             │
                                             ▼
                                     [Kubernetes Pods]
                                             │  (stdout stdout stream)
                                             ▼
                                     [Log Collection]
                                             │
                                             ▼
                                     [LogStrata Engine]
                                      (Core Parser)
                                      /            \
                                     v              v
                           [Metrics Engine]    [Security Analytics]
                            (Latencies, RPS)    (SIEM Threat Anomaly)
                                     \              /
                                      v            v
                                     [Autoscaler Engine]
                                             │  (replica / network policy updates)
                                             ▼
                                      [Scale Event]
```

### Logical Engines
1. **Ingestion & Aggregation Core:** Tails raw container logs, standardizes streams into structured JSON format, and enriches records with namespace, pod ID, and container metadata.
2. **Performance Analytics Engine:** Continually scans access log fields to compute Requests-Per-Second (RPS), HTTP status ratios (e.g. 5xx rate), and sliding-window latency percentiles (P95/P99).
3. **Threat Detection Engine (Mini-SIEM):** Scans auth logs for high-frequency failures and Kubernetes API audit logs for unauthorized configuration modifications.
4. **Autoscaling Decision Engine:** An algorithmic controller that balances workload capacity with threat severity profiles, determining the target replica count.
5. **Active Ingress Controller:** Dynamically injects rate-limiting configs or blocking rules into ingress resources to isolate offending client nodes.

---

## 3. Technology Stack

LogStrata is built using a modern cloud-observability stack optimized for low-latency visual performance:

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Core Framework** | [Next.js 15+](https://nextjs.org/) | Modern React framework with App Router, SSR, and dynamic client routing for dashboards and documentation. |
| **Theme Management** | [next-themes](https://github.com/pacocoursey/next-themes) | Isomorphic system-adaptive dark/light theme switching with zero layout shift. |
| **Styling** | [Tailwind CSS v4.0](https://tailwindcss.com/) | Premium developer design system styling (Vercel/Linear theme) with native CSS variables and CSS processing. |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, vector icon library matching modern developer tool aesthetic. |
| **Visualization** | SVG / Canvas APIs | Dynamic SVG-based animated micro-flow diagrams and low-latency canvas telemetry charts. |
| **Telemetry SDK** | [runetrace v0.1.1](https://github.com/) | Internal telemetry analysis for client metrics profiling. |
| **Orchestration Sim** | Vanilla ES6 JavaScript | Client-side reactive event loops simulating cluster scaling, traffic spikes, and DDoS events. |

---

## 4. Repository Structure

```text
/
├── src/
│   ├── app/                            # Next.js App Router root
│   │   ├── dashboard/                  # Live Autoscaling Playground / Simulation
│   │   │   └── page.tsx
│   │   ├── docs/                       # Technical Documentation Section
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   ├── layout.tsx                  # Root HTML/Body wrapper with theme providers
│   │   ├── page.tsx                    # Landing Page / Home
│   │   └── globals.css                 # Global design system styles and theme configs
│   ├── components/                     # Reusable client and server components
│   │   ├── Header.tsx                  # Global responsive header navigation
│   │   ├── HeroDiagram.tsx             # Interactive, state-driven SVG flow diagram
│   │   ├── ArchitectureDiagram.tsx     # Full cluster control loop diagram & console logs
│   │   └── ThemeProvider.tsx           # next-themes integration provider
│   └── ...
├── public/                             # Static visual assets and icons
├── package.json                        # Dependency registry
└── next.config.ts                      # Next.js compiler settings
```

---

## 5. Development & Running Locally

### Commands

To run the project locally, install dependencies and start the development server:

```bash
# Install package dependencies
npm install

# Start the local development server (defaults to localhost:3000)
npm run dev

# Compile production-ready static assets
npm run build

# Start the production-built site locally
npm run start
```

### Local Cluster Staging
For platform testing within localized environments:
1. Initialize a Kubernetes target context (e.g. `minikube` or `Kind`).
2. Deploy the agent DaemonSet using configuration charts outlined in `/docs/getting-started`.
3. Launch the dashboard to observe real-time log ingestion performance.
