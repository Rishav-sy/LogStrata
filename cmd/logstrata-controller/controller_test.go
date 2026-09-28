package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestControllerHealthz(t *testing.T) {
	cs := NewControllerServer(DefaultControllerConfig())
	defer cs.Stop()

	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()
	cs.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if rec.Body.String() != "OK\n" {
		t.Fatalf("unexpected body: %q", rec.Body.String())
	}
}

func TestControllerReconciliationsAndPolicies(t *testing.T) {
	cs := NewControllerServer(DefaultControllerConfig())
	defer cs.Stop()

	// 1. Initial /api/v1/reconciliations
	req := httptest.NewRequest(http.MethodGet, "/api/v1/reconciliations", nil)
	rec := httptest.NewRecorder()
	cs.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	var auditResp struct {
		Status            string        `json:"status"`
		ActivePolicies    int           `json:"active_policies"`
		RecentEvaluations []interface{} `json:"recent_evaluations"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &auditResp); err != nil {
		t.Fatalf("failed to unmarshal reconciliations: %v", err)
	}
	if auditResp.ActivePolicies != 1 {
		t.Fatalf("expected 1 active policy, got %d", auditResp.ActivePolicies)
	}

	// 2. /api/v1/policies
	polReq := httptest.NewRequest(http.MethodGet, "/api/v1/policies", nil)
	polRec := httptest.NewRecorder()
	cs.ServeHTTP(polRec, polReq)

	if polRec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", polRec.Code)
	}
}

func TestControllerStep_ScaleUp(t *testing.T) {
	cs := NewControllerServer(DefaultControllerConfig())
	defer cs.Stop()

	// High RPS: 1500 RPS on 3 replicas with target 120 RPS/pod
	// Expected desired replicas = ceil((1500 / 120) * 1.2) = ceil(12.5 * 1.2) = ceil(15) = 15
	telemetry := &DaemonTelemetry{
		Status:          "HEALTHY",
		RPS:             1500.0,
		CurrentReplicas: 3,
		BlockedIPs:      []string{"185.220.101.5"},
		ScaleDownLocked: false,
	}

	res := cs.Step(telemetry)

	if !res.ScalePatchDispatched {
		t.Fatalf("expected scale patch to be dispatched on load surge")
	}
	if res.ActionTaken != "SCALE_UP" {
		t.Fatalf("expected SCALE_UP action, got %s", res.ActionTaken)
	}
	if res.DesiredReplicas <= 3 {
		t.Fatalf("expected DesiredReplicas > 3, got %d", res.DesiredReplicas)
	}
	if res.JSONPatch == "" {
		t.Fatalf("expected non-empty JSON patch")
	}
	if res.NetworkPolicyYAML == "" {
		t.Fatalf("expected network policy generated for blocked IPs")
	}

	// Verify history recorded
	cs.mu.RLock()
	histLen := len(cs.history)
	cs.mu.RUnlock()

	if histLen != 1 {
		t.Fatalf("expected 1 history entry, got %d", histLen)
	}
}

func TestControllerStep_ScaleDownLockedOnThreat(t *testing.T) {
	cs := NewControllerServer(DefaultControllerConfig())
	defer cs.Stop()

	// Traffic drops to 0 RPS, but ScaleDownLocked = true due to threat
	telemetry := &DaemonTelemetry{
		Status:          "HEALTHY",
		RPS:             0.0,
		CurrentReplicas: 10,
		BlockedIPs:      []string{"45.33.32.156"},
		ScaleDownLocked: true,
	}

	res := cs.Step(telemetry)

	if res.ActionTaken == "SCALE_DOWN" {
		t.Fatalf("scale down should be locked when threat is active, but action was %s", res.ActionTaken)
	}
	if !res.ScaleDownLocked {
		t.Fatalf("expected ScaleDownLocked=true in result")
	}
	if res.ThreatLevel != "CRITICAL" {
		t.Fatalf("expected ThreatLevel=CRITICAL, got %s", res.ThreatLevel)
	}
}

func TestControllerFetchTelemetry(t *testing.T) {
	// Mock daemon server
	mockDaemon := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintln(w, `{
			"status": "HEALTHY",
			"rps": 240.5,
			"current_replicas": 4,
			"blocked_ips": ["1.2.3.4"],
			"scale_down_locked": false
		}`)
	}))
	defer mockDaemon.Close()

	cfg := DefaultControllerConfig()
	cfg.DaemonURL = mockDaemon.URL

	cs := NewControllerServer(cfg)
	defer cs.Stop()

	client := mockDaemon.Client()
	telemetry, err := cs.FetchTelemetry(client)
	if err != nil {
		t.Fatalf("unexpected error fetching telemetry: %v", err)
	}

	if telemetry.RPS != 240.5 {
		t.Fatalf("expected RPS 240.5, got %f", telemetry.RPS)
	}
	if telemetry.CurrentReplicas != 4 {
		t.Fatalf("expected CurrentReplicas 4, got %d", telemetry.CurrentReplicas)
	}
	if len(telemetry.BlockedIPs) != 1 || telemetry.BlockedIPs[0] != "1.2.3.4" {
		t.Fatalf("expected blocked IP 1.2.3.4, got %v", telemetry.BlockedIPs)
	}
}

func TestControllerMitigationsEndpoint(t *testing.T) {
	cs := NewControllerServer(DefaultControllerConfig())
	defer cs.Stop()

	// 1. Initial mitigations should have 0 blocked IPs
	req := httptest.NewRequest(http.MethodGet, "/api/v1/mitigations", nil)
	rec := httptest.NewRecorder()
	cs.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	var initMitigations ActiveMitigations
	if err := json.Unmarshal(rec.Body.Bytes(), &initMitigations); err != nil {
		t.Fatalf("failed to decode initial mitigations: %v", err)
	}
	if initMitigations.BlockedIPsCount != 0 {
		t.Fatalf("expected 0 blocked IPs initially, got %d", initMitigations.BlockedIPsCount)
	}

	// 2. Perform step with blocked IPs
	blockedIP := "192.0.2.45"
	telemetry := &DaemonTelemetry{
		Status:          "DEGRADED",
		RPS:             300.0,
		CurrentReplicas: 3,
		BlockedIPs:      []string{blockedIP},
		ScaleDownLocked: true,
	}
	cs.Step(telemetry)

	// 3. Query mitigations again
	req2 := httptest.NewRequest(http.MethodGet, "/api/v1/mitigations", nil)
	rec2 := httptest.NewRecorder()
	cs.ServeHTTP(rec2, req2)

	if rec2.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec2.Code)
	}

	var updatedMitigations ActiveMitigations
	if err := json.Unmarshal(rec2.Body.Bytes(), &updatedMitigations); err != nil {
		t.Fatalf("failed to decode updated mitigations: %v", err)
	}

	if updatedMitigations.BlockedIPsCount != 1 {
		t.Fatalf("expected 1 blocked IP, got %d", updatedMitigations.BlockedIPsCount)
	}
	if len(updatedMitigations.BlockedIPs) != 1 || updatedMitigations.BlockedIPs[0] != blockedIP {
		t.Fatalf("expected blocked IP %s, got %v", blockedIP, updatedMitigations.BlockedIPs)
	}
	if updatedMitigations.CiliumCCNP == "" {
		t.Fatalf("expected non-empty Cilium CCNP manifest")
	}
	if updatedMitigations.EbpfXdpConfig == "" {
		t.Fatalf("expected non-empty eBPF XDP config")
	}
	if updatedMitigations.NginxIngressConfigMap == "" {
		t.Fatalf("expected non-empty NGINX Ingress ConfigMap")
	}
}

