# ==============================================================================
# LogStrata Developer Makefile
# Security-Aware Kubernetes Autoscaling & Real-Time Log-Stream Analytics
# ==============================================================================

SHELL := /bin/bash
export PATH := $(shell go env GOPATH)/bin:$(PATH)
VERSION ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo "1.1.0")
GIT_COMMIT ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_DATE ?= $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")

GO ?= go
BIN_DIR := bin
LDFLAGS := -s -w -X main.Version=$(VERSION) -X main.GitCommit=$(GIT_COMMIT)

.PHONY: all help build test lint staticcheck docker helm-lint clean kind-test verify chaos

all: lint test build ## Run linter, tests, and build all binaries

help: ## Display this help message
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n\nTargets:\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

build: ## Compile daemon, controller, and CLI binaries into bin/
	@mkdir -p $(BIN_DIR)
	@echo "==> Building logstrata-daemon..."
	CGO_ENABLED=0 $(GO) build -ldflags="$(LDFLAGS)" -trimpath -o $(BIN_DIR)/logstrata-daemon ./cmd/logstrata-daemon
	@echo "==> Building logstrata-controller..."
	CGO_ENABLED=0 $(GO) build -ldflags="$(LDFLAGS)" -trimpath -o $(BIN_DIR)/logstrata-controller ./cmd/logstrata-controller
	@echo "==> Building logstrata-cli..."
	CGO_ENABLED=0 $(GO) build -ldflags="$(LDFLAGS)" -trimpath -o $(BIN_DIR)/logstrata-cli ./cmd/logstrata-cli
	@echo "✓ Binaries compiled successfully in $(BIN_DIR)/"

test: ## Run all Go unit tests with race detection and memory profiling
	@echo "==> Running Go unit test suite..."
	$(GO) test -race -count=1 -timeout=120s ./...
	@echo "✓ All Go tests passed"

lint: staticcheck ## Run go vet and staticcheck
	@echo "==> Running go vet..."
	$(GO) vet ./...
	@echo "✓ go vet passed"

staticcheck: ## Run staticcheck linter
	@echo "==> Running staticcheck..."
	@which staticcheck > /dev/null 2>&1 || $(GO) install honnef.co/go/tools/cmd/staticcheck@latest
	staticcheck ./...
	@echo "✓ staticcheck passed"

helm-lint: ## Run Helm chart strict lint and template dry-run
	@echo "==> Linting Helm chart..."
	helm lint charts/logstrata --strict
	@echo "==> Dry-run rendering Helm chart..."
	helm template test-logstrata charts/logstrata --debug > /dev/null
	@echo "✓ Helm chart validation passed"

docker: ## Build multi-arch local Docker containers for daemon and controller
	@echo "==> Building logstrata-daemon Docker image..."
	docker build -f cmd/logstrata-daemon/Dockerfile -t logstrata-daemon:local .
	@echo "==> Building logstrata-controller Docker image..."
	docker build -f cmd/logstrata-controller/Dockerfile -t logstrata-controller:local .
	@echo "✓ Docker images built successfully"

kind-test: ## Execute KIND automated local end-to-end integration test harness
	@echo "==> Running KIND E2E Test Suite..."
	./scripts/test-e2e-kind.sh

verify: ## Run deep cluster readiness and pre-requisite audit script
	@echo "==> Verifying Kubernetes cluster readiness..."
	./scripts/verify-cluster.sh

chaos: build ## Run CLI chaos engineering fault injection against local daemon
	@echo "==> Running chaos load simulation..."
	$(BIN_DIR)/logstrata-cli chaos --scenario corrupt-json --duration 3s
	$(BIN_DIR)/logstrata-cli chaos --scenario 50k-burst --burst-total 1000

benchmark: build ## Run CLI sliding-window ring buffer benchmark (1,000,000 ops)
	$(BIN_DIR)/logstrata-cli benchmark --ops 1000000

clean: ## Clean up compiled binaries, coverage profiles, and temporary files
	@rm -rf $(BIN_DIR) dist coverage.out trivy-results.sarif
	@echo "✓ Cleaned workspace"
