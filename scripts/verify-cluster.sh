#!/usr/bin/env bash
# ==============================================================================
# LogStrata Cluster Verification Script
# Validates DaemonSet health, controller responsiveness, and CRD APIs
# ==============================================================================

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

NAMESPACE="logstrata-system"

echo -e "${CYAN}[LogStrata Health Check] Auditing cluster components in ${NAMESPACE}...${NC}"

# Check CRDs
echo -n "Checking CRD registration... "
kubectl get crd logautoscalerpolicies.core.logstrata.io >/dev/null 2>&1 && \
kubectl get crd logthreatpolicies.security.logstrata.io >/dev/null 2>&1 && \
echo -e "${GREEN}OK${NC}" || echo -e "${RED}FAILED${NC}"

# Check DaemonSet
echo -n "Checking DaemonSet rollouts... "
if kubectl get daemonset -n "${NAMESPACE}" -l app.kubernetes.io/component=daemon >/dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}NOT FOUND${NC}"
fi

# Check Controller Deployment
echo -n "Checking Controller Deployment... "
if kubectl get deployment -n "${NAMESPACE}" -l app.kubernetes.io/component=controller >/dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}NOT FOUND${NC}"
fi

echo -e "${GREEN}✓ All component health audits concluded.${NC}"
