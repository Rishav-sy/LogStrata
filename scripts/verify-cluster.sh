#!/usr/bin/env bash
# ==============================================================================
# LogStrata Multi-Cloud Cluster Verification Script
# Audits Kubernetes compatibility, CRDs, RBAC, DaemonSet rollouts, and APIs
# Supports: AWS EKS, Google Cloud GKE, Azure AKS, Kind, Minikube, K3s
# ==============================================================================

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

NAMESPACE="${NAMESPACE:-logstrata-system}"
FAILED=0

echo -e "${BOLD}${CYAN}========================================================================${NC}"
echo -e "${BOLD}${CYAN}                LOGSTRATA MULTI-CLOUD CLUSTER AUDIT                     ${NC}"
echo -e "${BOLD}${CYAN}========================================================================${NC}"

# 1. Cluster & Provider Detection
echo -n "Detecting Kubernetes provider... "
SERVER_VERSION=$(kubectl version -o json 2>/dev/null | grep -o '"gitVersion": "[^"]*"' | head -1 | cut -d'"' -f4 || echo "unknown")
NODE_INFO=$(kubectl get nodes -o jsonpath='{.items[0].status.nodeInfo.osImage}' 2>/dev/null || echo "")

PROVIDER="Standard / Bare-metal"
if kubectl get nodes -o jsonpath='{.items[*].spec.providerID}' 2>/dev/null | grep -q "aws"; then
    PROVIDER="AWS EKS"
elif kubectl get nodes -o jsonpath='{.items[*].spec.providerID}' 2>/dev/null | grep -q "gce"; then
    PROVIDER="Google Cloud GKE"
elif kubectl get nodes -o jsonpath='{.items[*].spec.providerID}' 2>/dev/null | grep -q "azure"; then
    PROVIDER="Azure AKS"
elif echo "$NODE_INFO" | grep -qi "k3s"; then
    PROVIDER="Rancher K3s"
elif echo "$NODE_INFO" | grep -qi "kind"; then
    PROVIDER="Kind (Kubernetes in Docker)"
elif echo "$NODE_INFO" | grep -qi "minikube"; then
    PROVIDER="Minikube"
fi
echo -e "${GREEN}${PROVIDER} (${SERVER_VERSION})${NC}"

# 2. Verify CRDs
echo -n "Auditing CustomResourceDefinitions... "
CRD_COUNT=0
if kubectl get crd logautoscalerpolicies.core.logstrata.io >/dev/null 2>&1; then
    CRD_COUNT=$((CRD_COUNT + 1))
fi
if kubectl get crd logthreatpolicies.security.logstrata.io >/dev/null 2>&1; then
    CRD_COUNT=$((CRD_COUNT + 1))
fi

if [ "$CRD_COUNT" -eq 2 ]; then
    echo -e "${GREEN}2/2 Registered (lap, ltp)${NC}"
else
    echo -e "${RED}MISSING (${CRD_COUNT}/2 registered)${NC}"
    FAILED=1
fi

# 3. Verify DaemonSet Log Harvester
echo -n "Auditing DaemonSet log harvester... "
if kubectl get daemonset logstrata-daemon -n "${NAMESPACE}" >/dev/null 2>&1; then
    DESIRED=$(kubectl get daemonset logstrata-daemon -n "${NAMESPACE}" -o jsonpath='{.status.desiredNumberScheduled}')
    READY=$(kubectl get daemonset logstrata-daemon -n "${NAMESPACE}" -o jsonpath='{.status.numberReady}')
    if [ "$DESIRED" -eq "$READY" ] && [ "$READY" -gt 0 ]; then
        echo -e "${GREEN}READY (${READY}/${DESIRED} nodes active)${NC}"
    else
        echo -e "${YELLOW}DEGRADED (${READY}/${DESIRED} nodes ready)${NC}"
    fi
else
    echo -e "${RED}NOT FOUND in ${NAMESPACE}${NC}"
    FAILED=1
fi

# 4. Verify Controller Operator
echo -n "Auditing Controller Operator... "
if kubectl get deployment logstrata-controller -n "${NAMESPACE}" >/dev/null 2>&1; then
    READY=$(kubectl get deployment logstrata-controller -n "${NAMESPACE}" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    if [ "${READY:-0}" -ge 1 ]; then
        echo -e "${GREEN}READY (${READY} replica active)${NC}"
    else
        echo -e "${RED}NOT READY (0 replicas available)${NC}"
        FAILED=1
    fi
else
    echo -e "${RED}NOT FOUND in ${NAMESPACE}${NC}"
    FAILED=1
fi

# 5. Verify RBAC Permissions
echo -n "Auditing Controller RBAC write permissions... "
CAN_SCALE=$(kubectl auth can-i patch deployments/scale -n default 2>/dev/null || echo "no")
CAN_NETPOL=$(kubectl auth can-i create networkpolicies -n default 2>/dev/null || echo "no")

if [ "$CAN_SCALE" = "yes" ] && [ "$CAN_NETPOL" = "yes" ]; then
    echo -e "${GREEN}OK (deployments/scale + networkpolicies)${NC}"
else
    echo -e "${YELLOW}LIMITED (scale: ${CAN_SCALE}, netpol: ${CAN_NETPOL})${NC}"
fi

echo -e "${BOLD}${CYAN}------------------------------------------------------------------------${NC}"
if [ "$FAILED" -eq 0 ]; then
    echo -e "${BOLD}${GREEN}✓ All LogStrata health and readiness checks passed successfully!${NC}"
    exit 0
else
    echo -e "${BOLD}${RED}✗ Cluster audit identified missing components. Check logs above.${NC}"
    exit 1
fi
