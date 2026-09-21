#!/usr/bin/env bash
# =============================================================================
# LogStrata Installer — curl -fsSL https://logstrata.io/install.sh | sh
# =============================================================================
# Supports: Linux (amd64/arm64), macOS (amd64/arm64)
# Requirements: kubectl, helm (auto-installed if missing)
# =============================================================================
set -euo pipefail

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'
OK="${GREEN}✔${RESET}"; WARN="${YELLOW}⚠${RESET}"; ERR="${RED}✖${RESET}"
INFO="${CYAN}→${RESET}"

# ── Config ────────────────────────────────────────────────────────────────────
CHART_REPO_URL="https://rishav-sy.github.io/logstrata"
CHART_NAME="logstrata"
RELEASE_NAME="${LOGSTRATA_RELEASE:-logstrata}"
NAMESPACE="${LOGSTRATA_NAMESPACE:-logstrata}"
HELM_VERSION="v3.14.0"

header() {
  echo ""
  echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════╗${RESET}"
  echo -e "${BOLD}${CYAN}║   LogStrata — Log-Driven Kubernetes Scaling  ║${RESET}"
  echo -e "${BOLD}${CYAN}║   5-Minute Quickstart Installer  v1.0.0      ║${RESET}"
  echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════╝${RESET}"
  echo ""
}

log()  { echo -e "  ${INFO} $*"; }
ok()   { echo -e "  ${OK}  $*"; }
warn() { echo -e "  ${WARN} $*"; }
die()  { echo -e "  ${ERR}  $*" >&2; exit 1; }

check_requirements() {
  echo -e "${BOLD}[1/5] Checking requirements...${RESET}"

  command -v kubectl &>/dev/null || die "kubectl not found. Install it: https://kubernetes.io/docs/tasks/tools/"
  ok "kubectl $(kubectl version --client --short 2>/dev/null | head -1 | awk '{print $3}')"

  if ! command -v helm &>/dev/null; then
    warn "helm not found — installing..."
    install_helm
  fi
  ok "helm $(helm version --short)"

  # Verify cluster connectivity
  kubectl cluster-info &>/dev/null || die "Cannot connect to a Kubernetes cluster. Check your kubeconfig."
  CONTEXT=$(kubectl config current-context)
  ok "Connected to cluster: ${BOLD}${CONTEXT}${RESET}"
}

install_helm() {
  OS=$(uname -s | tr '[:upper:]' '[:lower:]')
  ARCH=$(uname -m); [[ "$ARCH" == "x86_64" ]] && ARCH="amd64" || ARCH="arm64"
  TMPDIR=$(mktemp -d)
  TARBALL="${TMPDIR}/helm.tar.gz"

  log "Downloading Helm ${HELM_VERSION} for ${OS}/${ARCH}..."
  curl -fsSL "https://get.helm.sh/helm-${HELM_VERSION}-${OS}-${ARCH}.tar.gz" -o "${TARBALL}"
  tar -xzf "${TARBALL}" -C "${TMPDIR}"
  sudo mv "${TMPDIR}/${OS}-${ARCH}/helm" /usr/local/bin/helm
  sudo chmod +x /usr/local/bin/helm
  rm -rf "${TMPDIR}"
  ok "Helm installed"
}

add_helm_repo() {
  echo ""
  echo -e "${BOLD}[2/5] Adding LogStrata Helm repository...${RESET}"

  helm repo add "${CHART_NAME}" "${CHART_REPO_URL}" 2>/dev/null || true
  helm repo update
  ok "Repository synced"
}

create_namespace() {
  echo ""
  echo -e "${BOLD}[3/5] Preparing namespace: ${NAMESPACE}${RESET}"

  if kubectl get namespace "${NAMESPACE}" &>/dev/null; then
    warn "Namespace '${NAMESPACE}' already exists — skipping"
  else
    kubectl create namespace "${NAMESPACE}"
    ok "Namespace created"
  fi

  # Label namespace for NetworkPolicy and PSA
  kubectl label namespace "${NAMESPACE}" \
    logstrata.io/managed="true" \
    pod-security.kubernetes.io/enforce="restricted" \
    pod-security.kubernetes.io/warn="restricted" \
    --overwrite
  ok "Namespace labelled (PSA restricted)"
}

install_crds() {
  echo ""
  echo -e "${BOLD}[4/5] Installing CRDs...${RESET}"

  # Apply CRDs from the chart (pre-install hook handles this automatically)
  # Manual fallback: apply from the deploy/crds directory
  if ls deploy/crds/*.yaml &>/dev/null 2>&1; then
    kubectl apply -f deploy/crds/ --server-side
    ok "CRDs applied (from local deploy/crds/)"
  else
    log "CRDs will be installed via Helm chart hooks"
  fi
}

install_chart() {
  echo ""
  echo -e "${BOLD}[5/5] Installing LogStrata...${RESET}"

  # Build helm flags from environment overrides
  HELM_EXTRA_ARGS=()
  [[ -n "${LOGSTRATA_DAEMON_IMAGE:-}" ]]  && HELM_EXTRA_ARGS+=(--set "daemon.image.repository=${LOGSTRATA_DAEMON_IMAGE}")
  [[ -n "${LOGSTRATA_DAEMON_TAG:-}" ]]    && HELM_EXTRA_ARGS+=(--set "daemon.image.tag=${LOGSTRATA_DAEMON_TAG}")
  [[ -n "${LOGSTRATA_CTRL_IMAGE:-}" ]]    && HELM_EXTRA_ARGS+=(--set "controller.image.repository=${LOGSTRATA_CTRL_IMAGE}")
  [[ -n "${LOGSTRATA_CTRL_TAG:-}" ]]      && HELM_EXTRA_ARGS+=(--set "controller.image.tag=${LOGSTRATA_CTRL_TAG}")

  helm upgrade --install "${RELEASE_NAME}" "${CHART_NAME}/${CHART_NAME}" \
    --namespace "${NAMESPACE}" \
    --create-namespace \
    --wait \
    --timeout 5m \
    "${HELM_EXTRA_ARGS[@]+"${HELM_EXTRA_ARGS[@]}"}"

  ok "LogStrata installed ✓"
}

verify_install() {
  echo ""
  echo -e "${BOLD}Verifying installation...${RESET}"

  # Wait for DaemonSet rollout
  kubectl rollout status daemonset/"${RELEASE_NAME}-daemon" \
    -n "${NAMESPACE}" --timeout=120s
  ok "Daemon DaemonSet is healthy"

  # Wait for Controller deployment
  kubectl rollout status deployment/"${RELEASE_NAME}-controller" \
    -n "${NAMESPACE}" --timeout=120s
  ok "Controller Deployment is healthy"

  # Quick healthcheck
  POD=$(kubectl get pods -n "${NAMESPACE}" -l app.kubernetes.io/component=daemon \
    -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)
  if [[ -n "${POD}" ]]; then
    STATUS=$(kubectl exec -n "${NAMESPACE}" "${POD}" -- \
      wget -qO- http://localhost:8080/healthz 2>/dev/null || echo "unavailable")
    [[ "${STATUS}" == "OK" ]] && ok "Daemon healthz: OK" || warn "Daemon healthz returned: ${STATUS}"
  fi
}

print_summary() {
  echo ""
  echo -e "${GREEN}${BOLD}════════════════════════════════════════════════${RESET}"
  echo -e "${GREEN}${BOLD}  🚀  LogStrata is running!${RESET}"
  echo -e "${GREEN}${BOLD}════════════════════════════════════════════════${RESET}"
  echo ""
  echo -e "  ${INFO} View daemon status:"
  echo -e "     kubectl -n ${NAMESPACE} exec -it ds/${RELEASE_NAME}-daemon -- wget -qO- http://localhost:8080/api/v1/status | jq"
  echo ""
  echo -e "  ${INFO} Stream live telemetry:"
  echo -e "     kubectl -n ${NAMESPACE} exec -it ds/${RELEASE_NAME}-daemon -- wget -qO- http://localhost:8080/api/v1/stream"
  echo ""
  echo -e "  ${INFO} View all pods:"
  echo -e "     kubectl get pods -n ${NAMESPACE}"
  echo ""
  echo -e "  ${INFO} Docs: https://logstrata.io/docs"
  echo -e "  ${INFO} Issues: https://github.com/Rishav-sy/LogStrata/issues"
  echo ""
}

main() {
  header
  check_requirements
  add_helm_repo
  create_namespace
  install_crds
  install_chart
  verify_install
  print_summary
}

main "$@"
