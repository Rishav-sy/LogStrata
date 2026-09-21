#!/usr/bin/env bash
# ==============================================================================
# LogStrata E2E Local KIND Verification & Simulation Harness
# ==============================================================================
set -euo pipefail

CLUSTER_NAME="logstrata-e2e"
NAMESPACE="logstrata-system"
APP_NAMESPACE="default"
CLEANUP=false

for arg in "$@"; do
  case $arg in
    --cleanup)
      CLEANUP=true
      shift
      ;;
  esac
done

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_succ() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_err()  { echo -e "${RED}[ERROR]${NC} $1"; }

cleanup_cluster() {
  if [ "$CLEANUP" = true ]; then
    log_info "Tearing down KIND cluster '${CLUSTER_NAME}'..."
    kind delete cluster --name "${CLUSTER_NAME}" || true
    log_succ "Cluster cleaned up successfully."
  fi
}
trap cleanup_cluster EXIT

# 1. Dependency checks
log_info "Validating required tools (kind, kubectl, helm, docker)..."
for cmd in kind kubectl helm docker; do
  if ! command -v "$cmd" &>/dev/null; then
    log_err "Missing required dependency: $cmd"
    exit 1
  fi
done
log_succ "All host prerequisites found."

# 2. KIND cluster creation
if kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
  log_warn "Cluster '${CLUSTER_NAME}' already exists, reusing..."
else
  log_info "Creating KIND cluster with /var/log/pods volume mounts..."
  cat <<EOF | kind create cluster --name "${CLUSTER_NAME}" --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraMounts:
  - hostPath: /var/log/pods
    containerPath: /var/log/pods
EOF
  log_succ "KIND cluster '${CLUSTER_NAME}' ready."
fi

kubectl cluster-info --context "kind-${CLUSTER_NAME}"

# 3. Build & load local container images
log_info "Building local LogStrata container images..."
docker build -t logstrata-daemon:local -f cmd/logstrata-daemon/Dockerfile .
docker build -t logstrata-controller:local -f cmd/logstrata-controller/Dockerfile .

log_info "Loading images into KIND nodes..."
kind load docker-image logstrata-daemon:local --name "${CLUSTER_NAME}"
kind load docker-image logstrata-controller:local --name "${CLUSTER_NAME}"
log_succ "Images loaded into cluster."

# 4. Install CRDs
log_info "Applying LogStrata CRDs..."
kubectl apply -f deploy/crds/logautoscalerpolicy-crd.yaml
kubectl apply -f deploy/crds/logthreatpolicy-crd.yaml
log_succ "CRDs applied."

# 5. Deploy sample workload
log_info "Deploying sample commerce-frontend workload (initial replicas: 3)..."
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: commerce-frontend
  namespace: ${APP_NAMESPACE}
spec:
  replicas: 3
  selector:
    matchLabels:
      app: commerce-frontend
  template:
    metadata:
      labels:
        app: commerce-frontend
    spec:
      containers:
      - name: web
        image: nginx:alpine
        ports:
        - containerPort: 80
EOF

kubectl rollout status deployment/commerce-frontend -n ${APP_NAMESPACE} --timeout=60s

# 6. Install LogStrata via Helm
log_info "Installing LogStrata Helm Chart..."
helm upgrade --install logstrata charts/logstrata \
  --namespace ${NAMESPACE} \
  --create-namespace \
  --set daemon.image.repository=logstrata-daemon \
  --set daemon.image.tag=local \
  --set daemon.image.pullPolicy=Never \
  --set controller.image.repository=logstrata-controller \
  --set controller.image.tag=local \
  --set controller.image.pullPolicy=Never \
  --set controller.replicaCount=1

log_succ "Helm chart deployed. Waiting for pods to become ready..."
kubectl wait --namespace ${NAMESPACE} \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/name=logstrata-daemon \
  --timeout=90s

# 7. Apply sample LogAutoscalerPolicy
log_info "Applying LogAutoscalerPolicy targeting commerce-frontend..."
cat <<EOF | kubectl apply -f -
apiVersion: core.logstrata.io/v1alpha1
kind: LogAutoscalerPolicy
metadata:
  name: commerce-frontend-scaler
  namespace: ${APP_NAMESPACE}
spec:
  scaleTargetRef:
    kind: Deployment
    name: commerce-frontend
  minReplicas: 3
  maxReplicas: 15
  targetRPSPerPod: 100.0
  headroomFactor: 1.2
  security:
    lockScaleDownOnThreat: true
    autoBlockMaliciousIPs: true
EOF

log_succ "E2E Test Environment verified! To run synthetic load against daemon:"
echo "  kubectl port-forward -n ${NAMESPACE} svc/logstrata-daemon 8080:8080"
echo "  curl -X POST http://localhost:8080/api/v1/ingest --data-binary @deploy/examples/sample-traffic.log"
echo "=============================================================================="
log_succ "E2E KIND verification script complete."
