# LogStrata — Production Deployment Guide

> **Log-Driven Kubernetes Autoscaling & Active Threat Mitigation**

LogStrata delivers **sub-50ms scaling decisions** by processing container log streams directly on each node — 18–30 seconds faster than metric-scraper approaches. A single DaemonSet agent watches `/var/log/pods`, streams telemetry to the central operator, and autonomously patches `Deployment` replica counts while simultaneously enforcing `NetworkPolicy` blocks against detected attackers.

---

## Table of Contents

1. [5-Minute Quickstart](#5-minute-quickstart)
2. [Architecture Overview](#architecture-overview)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Configuration Reference](#configuration-reference)
6. [CRD Reference](#crd-reference)
7. [Observability](#observability)
8. [Security Hardening](#security-hardening)
9. [Multi-Cloud Verification](#multi-cloud-verification)
10. [Troubleshooting](#troubleshooting)
11. [Uninstall](#uninstall)

---

## 5-Minute Quickstart

```bash
# One-liner install (requires kubectl + Helm, or auto-installs Helm)
curl -fsSL https://logstrata.io/install.sh | sh

# Verify it's running
kubectl -n logstrata get pods

# Stream live telemetry
kubectl -n logstrata exec -it ds/logstrata-daemon -- \
  wget -qO- http://localhost:8080/api/v1/stream
```

That's it. LogStrata is now processing logs on every node and will autoscale your workloads within seconds of a traffic spike.

---

## Architecture Overview

```
┌─────────────────────────────────── Kubernetes Node ────────────────────────────────────┐
│                                                                                          │
│   /var/log/pods/                                                                         │
│       └── namespace/pod/container.log ──► logstrata-daemon (DaemonSet)                  │
│                                                   │                                      │
│                                         ┌─────────▼─────────┐                           │
│                                         │  Zero-Copy Parser  │  < 0.5ms latency          │
│                                         │  SWTR Aggregator   │  100k lines/s            │
│                                         │  Anomaly Detector  │  < 20MB RAM              │
│                                         └─────────┬─────────┘                           │
└───────────────────────────────────────────────────┼──────────────────────────────────────┘
                                                     │ HTTP /api/v1/stream (SSE)
                                          ┌──────────▼──────────┐
                                          │ logstrata-controller │  (Deployment, 2 replicas)
                                          │   Reconciler Loop    │
                                          └──────┬───────┬───────┘
                                                 │       │
                               ┌─────────────────┘       └──────────────────────┐
                               ▼                                                  ▼
                   apps/v1 Deployment PATCH                    NetworkPolicy CREATE
                   (atomic SSA, < 50ms)                       (CIDR block attacker IPs)
```

### Components

| Component | Kind | Purpose |
|-----------|------|---------|
| `logstrata-daemon` | DaemonSet | Per-node log tailer, metric aggregator, threat sensor |
| `logstrata-controller` | Deployment (×2 HA) | CRD reconciler, replica patcher, threat responder |
| `LogAutoscalerPolicy` | CRD | Defines scaling thresholds per workload |
| `LogThreatPolicy` | CRD | Defines threat patterns and response actions |

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Kubernetes | ≥ 1.26 | EKS, GKE, AKS, kind, k3s supported |
| Helm | ≥ 3.12 | Auto-installed by quickstart script |
| kubectl | any | Must have cluster-admin or equivalent |
| Container Runtime | containerd ≥ 1.6 | CRI-O also supported |

---

## Installation

### Method 1: Quickstart Script (Recommended)

```bash
curl -fsSL https://logstrata.io/install.sh | sh
```

**Environment variable overrides:**

```bash
# Custom namespace
LOGSTRATA_NAMESPACE=monitoring curl -fsSL https://logstrata.io/install.sh | sh

# Custom images (e.g., private registry mirror)
LOGSTRATA_DAEMON_IMAGE=myregistry.io/logstrata-daemon \
LOGSTRATA_DAEMON_TAG=v1.0.0 \
curl -fsSL https://logstrata.io/install.sh | sh
```

### Method 2: Helm

```bash
# Add the chart repository
helm repo add logstrata https://rishav-sy.github.io/logstrata
helm repo update

# Install with defaults
helm install logstrata logstrata/logstrata \
  --namespace logstrata \
  --create-namespace \
  --wait

# Install with custom values
helm install logstrata logstrata/logstrata \
  --namespace logstrata \
  --create-namespace \
  --values my-values.yaml \
  --wait
```

### Method 3: From Source

```bash
git clone https://github.com/Rishav-sy/LogStrata.git
cd LogStrata

# Install CRDs
kubectl apply -f deploy/crds/ --server-side

# Install chart from local source
helm install logstrata charts/logstrata \
  --namespace logstrata \
  --create-namespace \
  --wait
```

---

## Configuration Reference

### Core Scaling (`daemon.args`)

| Parameter | Default | Description |
|-----------|---------|-------------|
| `listenAddr` | `:8080` | HTTP server bind address |
| `minReplicas` | `3` | Floor replica count |
| `maxReplicas` | `50` | Ceiling replica count |
| `targetRPSPerPod` | `150` | Target RPS capacity before scaling up |

### Controller (`controller`)

| Parameter | Default | Description |
|-----------|---------|-------------|
| `replicaCount` | `2` | Controller replicas (HA) |
| `leaderElection.enabled` | `true` | Enable leader election for HA |

### Prometheus Integration (`serviceMonitor`)

```yaml
serviceMonitor:
  enabled: true
  interval: "15s"
  labels:
    release: prometheus  # match your Prometheus operator selector
```

### Example Production Override

```yaml
# production-values.yaml
daemon:
  args:
    minReplicas: 5
    maxReplicas: 100
    targetRPSPerPod: 200

controller:
  replicaCount: 3

serviceMonitor:
  enabled: true
  labels:
    release: kube-prometheus-stack

policy:
  enabled: true
  targetDeployment: "api-server"
  targetNamespace: "production"
  maxReplicas: 100
  targetRPSPerPod: 200
  cooldownSeconds: 30
```

---

## CRD Reference

### LogAutoscalerPolicy

```yaml
apiVersion: core.logstrata.io/v1alpha1
kind: LogAutoscalerPolicy
metadata:
  name: api-server-scaling
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  scaling:
    minReplicas: 5
    maxReplicas: 100
    targetRPSPerPod: 200
    headroomFactor: 1.25
    cooldownSeconds: 60
    scaleUpThreshold: 0.80    # scale up when RPS > 80% of capacity
    scaleDownThreshold: 0.30  # scale down when RPS < 30% of capacity
```

### LogThreatPolicy

```yaml
apiVersion: security.logstrata.io/v1alpha1
kind: LogThreatPolicy
metadata:
  name: ddos-protection
  namespace: production
spec:
  targetRef:
    kind: Ingress
    name: api-ingress
  detection:
    rateWindow: "5s"
    bruteForce401Threshold: 20   # >20 401s/5s from same IP = block
    errorSpikeThreshold: 0.30    # >30% 5xx rate = alert
    ddosRPSThreshold: 5000       # >5000 RPS = DDoS mode
  response:
    blockDuration: "1h"
    injectNetworkPolicy: true
    scaleDownLock: true          # prevent scale-down during attack
    notifyWebhook: ""            # optional Slack/PagerDuty webhook URL
```

---

## Observability

### Prometheus Metrics

LogStrata exposes standard Prometheus metrics on `:8080/metrics` (daemon) and `:8081/metrics` (controller):

```text
# Ingestion counters
logstrata_total_ingested          Total log lines parsed (counter)

# Scaling state
logstrata_current_replicas        Active replica count (gauge)
logstrata_desired_replicas        Target replica count (gauge)
logstrata_scale_events_total      Scale decisions (counter, label: action)

# Latency percentiles (rolling 15s window)
logstrata_rps                     Requests per second (gauge)
logstrata_p50_latency_ms          P50 latency (gauge)
logstrata_p95_latency_ms          P95 latency (gauge)
logstrata_p99_latency_ms          P99 latency (gauge)

# Threat telemetry
logstrata_error_rate_5xx          5xx error rate 0.0–1.0 (gauge)
logstrata_blocked_ips_count       Active blocked IP count (gauge)
```

### Grafana Dashboard

Import the pre-built dashboard from `deploy/grafana/`:

```bash
# Via Grafana API
curl -X POST http://admin:admin@localhost:3000/api/dashboards/import \
  -H "Content-Type: application/json" \
  -d @deploy/grafana/logstrata-dashboard.json
```

### Live SSE Stream

```bash
# From any pod with network access to the daemon
curl -N http://<daemon-pod-ip>:8080/api/v1/stream

# Via kubectl port-forward
kubectl port-forward -n logstrata ds/logstrata-daemon 8080:8080 &
curl -N http://localhost:8080/api/v1/stream
```

---

## Security Hardening

LogStrata is hardened by default:

| Control | Status |
|---------|--------|
| Distroless container base | ✅ `gcr.io/distroless/static-debian12:nonroot` |
| Non-root user | ✅ `runAsUser: 65532` |
| Read-only root filesystem | ✅ `readOnlyRootFilesystem: true` |
| All capabilities dropped | ✅ `capabilities.drop: [ALL]` |
| Seccomp profile | ✅ `RuntimeDefault` |
| No privilege escalation | ✅ `allowPrivilegeEscalation: false` |
| PSA restricted namespace | ✅ Applied by install script |

### Trivy Scan

```bash
# Scan the daemon image
trivy image ghcr.io/rishav-sy/logstrata-daemon:v1.0.0

# Scan the repository source
trivy fs . --severity CRITICAL,HIGH
```

---

## Multi-Cloud Verification

Run the automated cloud certification script:

```bash
# Verify current cluster
./scripts/verify-cluster.sh

# With explicit provider override
CLOUD_PROVIDER=eks ./scripts/verify-cluster.sh
```

The script checks: node readiness, DaemonSet rollout, daemon healthz, metrics endpoint, SSE stream, and computes a pass/fail score per cluster.

---

## Troubleshooting

### Daemon pods are Pending

```bash
# Check node tolerations — daemon must tolerate control-plane taint
kubectl describe ds logstrata-daemon -n logstrata | grep -A 10 Tolerations

# Check resource availability on nodes  
kubectl describe nodes | grep -A 5 "Allocated resources"
```

### No metrics appearing

```bash
# Check daemon logs
kubectl logs -n logstrata -l app.kubernetes.io/component=daemon --tail=50

# Verify /var/log/pods is accessible  
kubectl exec -n logstrata -it ds/logstrata-daemon -- ls /var/log/pods
```

### Controller not scaling workloads

```bash
# Check RBAC
kubectl auth can-i update deployments --as=system:serviceaccount:logstrata:logstrata

# Verify LogAutoscalerPolicy CRD exists
kubectl get logautoscalerpolicies -A

# Check controller logs
kubectl logs -n logstrata -l app.kubernetes.io/component=controller --tail=50
```

### SSE stream disconnects immediately

The `/api/v1/stream` endpoint requires HTTP/1.1 keep-alive. Ensure your ingress/proxy:
- Does **not** buffer responses (`proxy_buffering off` in Nginx)
- Has a sufficiently long read timeout (≥ 300s)

---

## Uninstall

```bash
# Remove the Helm release
helm uninstall logstrata -n logstrata

# Remove CRDs (warning: deletes all LogAutoscalerPolicy/LogThreatPolicy resources)
kubectl delete crd logautoscalerpolicies.core.logstrata.io
kubectl delete crd logthreatpolicies.security.logstrata.io

# Remove namespace
kubectl delete namespace logstrata
```

---

*LogStrata is open source under the MIT License. Contributions welcome at [github.com/Rishav-sy/LogStrata](https://github.com/Rishav-sy/LogStrata).*
