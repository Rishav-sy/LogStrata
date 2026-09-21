package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
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

	handleStatus([]string{"--endpoint", ts.URL})
}

func TestCLIVersion(t *testing.T) {
	if Version == "" {
		t.Fatal("Expected non-empty version")
	}
}

func TestCLIBenchmark(t *testing.T) {
	// Run with 10k ops in test mode
	handleBenchmark([]string{"--ops", "10000"})
}

func TestCLIEvaluate(t *testing.T) {
	tmpFile, err := os.CreateTemp("", "test-eval-*.log")
	if err != nil {
		t.Fatalf("failed to create temp file: %v", err)
	}
	defer os.Remove(tmpFile.Name())

	sampleLogs := `{"method":"GET","path":"/api/products","status":200,"latency_ms":15.0,"client_ip":"192.168.1.1"}
{"method":"GET","path":"/api/checkout","status":200,"latency_ms":30.0,"client_ip":"192.168.1.2"}
{"method":"POST","path":"/login","status":401,"latency_ms":5.0,"client_ip":"185.220.101.5"}
`
	if _, err := tmpFile.WriteString(sampleLogs); err != nil {
		t.Fatalf("failed to write logs: %v", err)
	}
	tmpFile.Close()

	handleEvaluate([]string{
		"--log-file", tmpFile.Name(),
		"--target-rps", "100",
		"--min-replicas", "2",
		"--max-replicas", "10",
		"--current-replicas", "2",
	})
}
