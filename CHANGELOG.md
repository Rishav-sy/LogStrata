# Changelog

All notable changes to LogStrata are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Version numbers follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-09-21

### 🚀 Added — Core Engine (Sprint 1)
- **Zero-copy log tailer**: Direct `/var/log/pods/*/*/*.log` tailing via buffered inotify + goroutine fan-out, eliminating sidecar container overhead.
- **Auto-format parser** (`pkg/parser`): Single-pass tokenizer supporting JSON structured logs, Nginx Combined Log Format, Apache Common Log Format, and logfmt — with zero heap allocations on the hot path.
- **Sliding Window Transaction Rate** (`pkg/engine`): Circular-buffer engine computing real-time RPS, P50/P95/P99 latency percentiles over configurable 5s/15s/30s/60s windows. Benchmarked at **>1M records/s** on a single core.
- **Anomaly detector** (`pkg/detector`): Status-code ratio evaluator (5xx spike detection), 401/403 brute-force velocity tracking, and DDoS rate detection with configurable thresholds.
- **Benchmark suite**: Validates <0.5ms ingestion latency and <20MB per-node memory footprint under 100k lines/s synthetic flood.

### 🎛️ Added — Kubernetes Operator (Sprint 2)
- **`LogAutoscalerPolicy` CRD** (`v1alpha1`): OpenAPI v3 schema with bounds, step ratios, cooldown timers, target workload refs, and headroom factors.
- **`LogThreatPolicy` CRD** (`v1alpha1`): Threat pattern schema with detection thresholds, response actions (NetworkPolicy injection, scale-down lock, webhook alerts).
- **Reconciliation controller** (`pkg/controller`): Evaluates current vs desired replicas using ceiling math with configurable headroom. Emits atomic Server-Side Apply (SSA) patches against `apps/v1` Deployments.
- **Circuit breaker**: If log stream halts or daemon fails healthcheck, controller falls back to standard Kubernetes HPA.
- **`kind` E2E test pipeline**: Validates scale-up with synthetic k6 traffic inside local clusters.

### 🛡️ Added — Threat Shield (Sprint 3)
- **Scale-down suppression lock** (`pkg/detector`): Algorithm preventing HPA cooldown flapping during ongoing DDoS or brute-force attacks.
- **Dynamic NetworkPolicy engine** (`pkg/waf`): Auto-generates and injects `networking.k8s.io/v1` NetworkPolicy CIDR drop rules isolating attacker IPs.
- **Ingress config generators** (`pkg/ratelimiter`): Unified `Config` struct generates ready-to-apply rate-limit manifests for NGINX, Envoy, Traefik, and Cilium.
- **Prometheus metrics exporter**: Standard `/metrics` endpoint exposing 6+ gauge/counter metrics compatible with `kube-prometheus-stack`.
- **Grafana dashboard**: Pre-built JSON dashboard with RPS graph, replica scaling timeline, P95 latency gauge, error rate bar chart, and blocked IP counter.

### 🖥️ Added — Enterprise UI & Policy Studio (Sprint 4)
- **DevOps Simulation Playground**: Interactive Next.js dashboard with 4 traffic modes (Normal → DDoS), 4 failure scenarios (Black Friday, DB Outage, Viral Post, DDoS Attack), and real-time telemetry canvas.
- **Visual Policy Studio**: Drag-and-drop rule builder with instant YAML preview and cluster sync simulation.
- **Interactive Architecture Diagram**: Animated React Flow diagram showing the full data path from pod log → daemon → controller → replica patch.
- **Webhook Alert Dispatcher** (`pkg/notifier`): Multi-channel incident notifications with rich Slack, Discord, and PagerDuty payloads.
- **Live SSE Dashboard Hook** (`src/hooks/useDaemonStream`): EventSource hook with auto-reconnect, connection state indicator (LIVE/CONNECTING/OFFLINE), and real replica count sync from daemon stream.

### 🏭 Added — Production Hardening & Ecosystem
- **Kubernetes Admission Webhooks** (`pkg/admission`): Validating and Mutating Webhook controllers validating CRD ranges and automatically injecting resilient production defaults.
- **Fail-Safe Circuit Breaker Watchdog** (`pkg/controller/failover.go`): Three-state watchdog (`CLOSED`, `HALF_OPEN`, `OPEN`) preventing pod flapping and safely yielding scaling control to native HPA if telemetry heartbeats degrade.
- **KIND Local E2E Simulation Harness** (`scripts/test-e2e-kind.sh`): Automated cluster setup, local image building/loading, CRD installation, sample workload deployment, and scale verification.
- **CLI Diagnostics & Offline Evaluator** (`cmd/logstrata-cli`): Added `logstrata benchmark` (in-memory zero-alloc performance run) and `logstrata evaluate` (offline policy dry-run against historical logs).
- **eBPF XDP Ingress Shield** (`pkg/waf`): Added `CiliumClusterwideNetworkPolicy` and raw BPF map generation for driver-level kernel packet dropping (`XDP_DROP`).
- **Interactive Simulation Controls** (`src/components/ArchitectureDiagram.tsx`): Added pause/resume controls and 7 interactive simulation stage selection pills.
- **CLI Reference Guide** (`/docs/cli-tool`): Added comprehensive CLI documentation to the Next.js static site.
- **Distroless multi-stage Dockerfiles**: `gcr.io/distroless/static-debian12:nonroot` runtime, `CGO_ENABLED=0` static binaries, non-root UID 65532.
- **Production Helm chart v1.0.0**: HA controller (2 replicas with leader election), daemon anti-affinity, PodDisruptionBudget, Prometheus ServiceMonitor, NetworkPolicy isolation, admission webhook templates, and hardened security contexts.
- **5-minute install script**: `curl -fsSL https://logstrata.io/install.sh | sh` with auto-Helm install, namespace PSA labeling, and post-install healthcheck.
- **Full CI pipeline**: 5 parallel GitHub Actions jobs — Go vet+staticcheck+race test, Frontend ESLint+TypeScript+build, Helm lint, Trivy security scan with SARIF upload, Docker build validation.
- **Release pipeline**: Multi-arch Docker publish (linux/amd64 + linux/arm64) to GHCR, Helm chart publish to GitHub Pages, cross-compiled CLI binaries (linux/darwin/windows × amd64/arm64) with SHA256 checksums.
- **Production deployment guide** (`PRODUCTION.md`): Architecture diagrams, CRD reference with examples, metrics catalog, security hardening matrix, troubleshooting runbook.
- **Dev Compose stack**: Full local development environment with daemon + Next.js + Prometheus + Grafana (pre-provisioned).

---

## [0.9.0-beta] — 2026-09-01

### Added
- Initial logstrata-daemon with HTTP `/api/v1/ingest`, `/api/v1/status`, `/api/v1/stream` endpoints.
- logstrata-cli with `status`, `stream`, and `simulate` sub-commands.
- Initial Helm chart skeleton.
- Next.js dashboard with basic terminal log view.

### Fixed
- Daemon `sync.RWMutex` contention on `DaemonState` under high concurrency.
- ArchitectureDiagram component animation loop (stale closure bug).

---

## [0.1.0] — 2026-08-01

### Added
- Initial project scaffold: Go modules, Next.js 16, Supabase auth, Helm chart.
- LogStrata SRS document (system requirements specification).
- MIT License.

[1.0.0]: https://github.com/Rishav-sy/LogStrata/compare/v0.9.0-beta...v1.0.0
[0.9.0-beta]: https://github.com/Rishav-sy/LogStrata/compare/v0.1.0...v0.9.0-beta
[0.1.0]: https://github.com/Rishav-sy/LogStrata/releases/tag/v0.1.0
