package parser

import (
	"testing"
)

func TestParseJSON(t *testing.T) {
	p := NewAutoParser()

	line := `{"status": 200, "request_time": 0.045, "method": "POST", "path": "/api/v1/checkout", "remote_addr": "10.244.0.15", "user_agent": "k6/0.48"}`
	rec, err := p.Parse(line)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	if rec.StatusCode != 200 {
		t.Errorf("expected status 200, got %d", rec.StatusCode)
	}
	if rec.Method != "POST" {
		t.Errorf("expected method POST, got %s", rec.Method)
	}
	if rec.Path != "/api/v1/checkout" {
		t.Errorf("expected path /api/v1/checkout, got %s", rec.Path)
	}
	if rec.LatencyMs < 44.0 || rec.LatencyMs > 46.0 {
		t.Errorf("expected ~45ms latency, got %f", rec.LatencyMs)
	}
	if rec.RemoteIP != "10.244.0.15" {
		t.Errorf("expected remote IP 10.244.0.15, got %s", rec.RemoteIP)
	}
}

func TestParseCRIWrapped(t *testing.T) {
	p := NewAutoParser()

	line := `2026-09-21T10:15:30.456789123Z stdout F {"status": 503, "latency": 450.5, "method": "GET", "path": "/products", "client_ip": "194.26.29.11"}`
	rec, err := p.Parse(line)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	if rec.StatusCode != 503 {
		t.Errorf("expected status 503, got %d", rec.StatusCode)
	}
	if rec.LatencyMs != 450.5 {
		t.Errorf("expected latency 450.5, got %f", rec.LatencyMs)
	}
	if rec.RemoteIP != "194.26.29.11" {
		t.Errorf("expected remote IP 194.26.29.11, got %s", rec.RemoteIP)
	}
}

func TestParseCombined(t *testing.T) {
	p := NewAutoParser()

	line := `192.168.1.50 - - [21/Sep/2026:12:00:00 +0000] "GET /cart HTTP/1.1" 200 4500 "-" "Mozilla/5.0" 0.082`
	rec, err := p.Parse(line)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	if rec.StatusCode != 200 {
		t.Errorf("expected status 200, got %d", rec.StatusCode)
	}
	if rec.Method != "GET" {
		t.Errorf("expected method GET, got %s", rec.Method)
	}
	if rec.Path != "/cart" {
		t.Errorf("expected path /cart, got %s", rec.Path)
	}
	if rec.LatencyMs < 81.0 || rec.LatencyMs > 83.0 {
		t.Errorf("expected ~82ms latency, got %f", rec.LatencyMs)
	}
}

func BenchmarkParseJSON(b *testing.B) {
	p := NewAutoParser()
	line := `{"status": 200, "request_time": 0.042, "method": "GET", "path": "/api/checkout", "remote_addr": "10.0.1.25"}`

	b.ResetTimer()
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_, _ = p.Parse(line)
	}
}
