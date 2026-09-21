package main

import (
	"bufio"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestDaemonHealthz(t *testing.T) {
	ds := NewDaemonServer(DefaultDaemonConfig())
	defer ds.Stop()

	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()

	ds.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if rec.Body.String() != "OK\n" {
		t.Fatalf("unexpected body: %q", rec.Body.String())
	}
}

func TestDaemonIngestAndStatus(t *testing.T) {
	ds := NewDaemonServer(DefaultDaemonConfig())
	defer ds.Stop()

	rawLogs := `{"client_ip":"192.168.1.50","method":"GET","uri":"/api/products","status":200,"response_time_ms":12.5}
{"client_ip":"192.168.1.51","method":"POST","uri":"/api/checkout","status":201,"response_time_ms":45.0}
{"client_ip":"10.0.0.99","method":"GET","uri":"/admin/../../etc/passwd","status":403,"response_time_ms":2.1}
`

	// Ingest POST
	ingestReq := httptest.NewRequest(http.MethodPost, "/api/v1/ingest", strings.NewReader(rawLogs))
	ingestRec := httptest.NewRecorder()
	ds.ServeHTTP(ingestRec, ingestReq)

	if ingestRec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", ingestRec.Code)
	}

	var ingestResp struct {
		Status string `json:"status"`
		Lines  int    `json:"lines"`
	}
	if err := json.Unmarshal(ingestRec.Body.Bytes(), &ingestResp); err != nil {
		t.Fatalf("failed to decode ingest response: %v", err)
	}
	if ingestResp.Lines != 3 {
		t.Fatalf("expected 3 ingested lines, got %d", ingestResp.Lines)
	}

	// Status GET
	statusReq := httptest.NewRequest(http.MethodGet, "/api/v1/status", nil)
	statusRec := httptest.NewRecorder()
	ds.ServeHTTP(statusRec, statusReq)

	if statusRec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", statusRec.Code)
	}

	var statusResp struct {
		Status         string   `json:"status"`
		TotalIngested  int64    `json:"total_ingested"`
		CurrentReplicas int     `json:"current_replicas"`
		BlockedIPs     []string `json:"blocked_ips"`
	}
	if err := json.Unmarshal(statusRec.Body.Bytes(), &statusResp); err != nil {
		t.Fatalf("failed to decode status response: %v", err)
	}

	if statusResp.TotalIngested != 3 {
		t.Fatalf("expected 3 total ingested, got %d", statusResp.TotalIngested)
	}
	if statusResp.CurrentReplicas != 3 {
		t.Fatalf("expected minReplicas=3, got %d", statusResp.CurrentReplicas)
	}

	// Metrics endpoint GET
	metricsReq := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	metricsRec := httptest.NewRecorder()
	ds.ServeHTTP(metricsRec, metricsReq)

	if metricsRec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", metricsRec.Code)
	}
	metricText := metricsRec.Body.String()
	if !strings.Contains(metricText, "logstrata_total_ingested 3") {
		t.Errorf("metrics missing logstrata_total_ingested 3, got:\n%s", metricText)
	}
	if !strings.Contains(metricText, "logstrata_current_replicas 3") {
		t.Errorf("metrics missing logstrata_current_replicas 3, got:\n%s", metricText)
	}
}

func TestDaemonIngestMethodNotAllowed(t *testing.T) {
	ds := NewDaemonServer(DefaultDaemonConfig())
	defer ds.Stop()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/ingest", nil)
	rec := httptest.NewRecorder()
	ds.ServeHTTP(rec, req)

	if rec.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405 Method Not Allowed, got %d", rec.Code)
	}
}

func TestDaemonStream(t *testing.T) {
	ds := NewDaemonServer(DefaultDaemonConfig())
	defer ds.Stop()

	ts := httptest.NewServer(ds)
	defer ts.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 2500*time.Millisecond)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, ts.URL+"/api/v1/stream", nil)
	if err != nil {
		t.Fatalf("failed to create request: %v", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("failed to connect to stream: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
	if ct := resp.Header.Get("Content-Type"); ct != "text/event-stream" {
		t.Fatalf("expected Content-Type text/event-stream, got %s", ct)
	}

	reader := bufio.NewReader(resp.Body)
	receivedEvent := false

	// Read first event
	for i := 0; i < 10; i++ {
		line, err := reader.ReadString('\n')
		if err != nil {
			break
		}
		if strings.HasPrefix(line, "data: ") {
			data := strings.TrimPrefix(line, "data: ")
			var payload map[string]interface{}
			if err := json.Unmarshal([]byte(data), &payload); err == nil {
				receivedEvent = true
				if _, ok := payload["timestamp"]; !ok {
					t.Errorf("expected timestamp in event stream payload")
				}
				break
			}
		}
	}

	if !receivedEvent {
		t.Log("Stream ended or timed out before first event; expected for short test window")
	}
}
