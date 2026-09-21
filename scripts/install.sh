#!/usr/bin/env bash
# ==============================================================================
# LogStrata 5-Minute Production Cluster Installer
# Installs LogStrata CRDs, DaemonSet Agent, and Operator Controller
# ==============================================================================

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
AMBER='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
cat << "EOF"
  _                   ____  _             _        
 | |    ___   __ _ / ___|| |_ _ __ __ _| |_ __ _ 
 | |   / _ \ / _` |\___ \| __| '__/ _` | __/ _` |
 | |__| (_) | (_| | ___) | |_| | | (_| | || (_| |
 |_____\___/ \__, ||____/ \__|_|  \__,_|\__\__,_|
             |___/                                
 Intelligent Log-Driven Kubernetes Scaling & Ingress Defense
EOF
echo -e "${NC}"

echo -e "${CYAN}[1/4] Checking prerequisites...${NC}"
command -v kubectl >/dev/null 2>&1 || { echo -e "${RED}Error: kubectl is required but not installed.${NC}" >&2; exit 1; }
command -v helm >/dev/null 2>&1 || { echo -e "${RED}Error: helm is required but not installed.${NC}" >&2; exit 1; }

# Verify cluster connectivity
echo -e "${CYAN}[2/4] Verifying Kubernetes cluster connectivity...${NC}"
CURRENT_CONTEXT=$(kubectl config current-context 2>/dev/null || true)
if [ -z "$CURRENT_CONTEXT" ]; then
    echo -e "${RED}Error: No active Kubernetes context found. Please connect to a cluster.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Connected to cluster context: ${CURRENT_CONTEXT}${NC}"

NAMESPACE="logstrata-system"

echo -e "${CYAN}[3/4] Creating namespace and installing Custom Resource Definitions...${NC}"
kubectl create namespace "${NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

if [ -d "${REPO_ROOT}/charts/logstrata/crds" ]; then
    kubectl apply -f "${REPO_ROOT}/charts/logstrata/crds/"
else
    echo -e "${AMBER}Warning: Local CRD directory not found, using Helm crd hooks.${NC}"
fi

echo -e "${CYAN}[4/4] Deploying LogStrata Helm chart...${NC}"
helm upgrade --install logstrata "${REPO_ROOT}/charts/logstrata" \
  --namespace "${NAMESPACE}" \
  --set daemon.enabled=true \
  --set controller.enabled=true

echo -e "${GREEN}"
echo "=================================================================="
echo " LogStrata successfully deployed to namespace: ${NAMESPACE}"
echo "=================================================================="
echo -e "${NC}"
echo "Useful Commands:"
echo "  kubectl get pods -n ${NAMESPACE}"
echo "  kubectl get logautoscalerpolicies -A"
echo "  kubectl get logthreatpolicies -A"
echo "  kubectl port-forward -n ${NAMESPACE} svc/logstrata 3000:80"
echo ""
