package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCLIStatusHandler(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/v1/status" {
			t.Fatalf("Unexpected path: %s", r.URL.Path)
		}
		resp := StatusResponse{
			Status:             "HEALTHY",
			TotalIngested:      12400,
			CurrentReplicas:    4,
			TargetReplicas:     6,
			LastDecisionAction: "SCALE_UP",
			LastDecisionReason: "Target RPS exceeded 150/pod",
			RPS:                240.5,
			P50LatencyMs:       24.2,
			P95LatencyMs:       180.4,
			P99LatencyMs:       320.1,
			BlockedIPs:         []string{"198.51.100.42"},
			ScaleDownLocked:    true,
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
	}))
	defer ts.Close()

	// Verify handleStatus executes without crashing
	handleStatus([]string{"--endpoint", ts.URL})
}

func TestCLIVersion(t *testing.T) {
	if Version == "" {
		t.Fatal("Expected non-empty version")
	}
}
