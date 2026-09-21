package engine

import (
	"testing"
	"time"

	"github.com/Rishav-sy/LogStrata/pkg/parser"
)

func TestSlidingWindowEngine(t *testing.T) {
	eng := NewSlidingWindowEngine(60)

	// Simulate 100 requests with increasing latencies
	now := time.Now()
	for i := 1; i <= 100; i++ {
		status := 200
		if i > 90 {
			status = 503 // 10% errors
		}
		eng.Record(&parser.LogRecord{
			Timestamp:  now,
			StatusCode: status,
			LatencyMs:  float64(i * 10), // 10ms to 1000ms
		})
	}

	snap := eng.GetSnapshot(60)
	if snap.TotalRequests != 100 {
		t.Errorf("expected 100 total requests, got %d", snap.TotalRequests)
	}
	if snap.Count2xx != 90 {
		t.Errorf("expected 90 2xx requests, got %d", snap.Count2xx)
	}
	if snap.Count5xx != 10 {
		t.Errorf("expected 10 5xx requests, got %d", snap.Count5xx)
	}
	if snap.ErrorRate5xxPercent != 10.0 {
		t.Errorf("expected 10.0%% 5xx error rate, got %f", snap.ErrorRate5xxPercent)
	}

	// Percentile checks
	if snap.P50LatencyMs < 490 || snap.P50LatencyMs > 510 {
		t.Errorf("expected P50 around 500ms, got %f", snap.P50LatencyMs)
	}
	if snap.P95LatencyMs < 940 || snap.P95LatencyMs > 960 {
		t.Errorf("expected P95 around 950ms, got %f", snap.P95LatencyMs)
	}
	if snap.P99LatencyMs < 980 || snap.P99LatencyMs > 1000 {
		t.Errorf("expected P99 around 990ms, got %f", snap.P99LatencyMs)
	}
}

func BenchmarkEngineRecord(b *testing.B) {
	eng := NewSlidingWindowEngine(60)
	rec := &parser.LogRecord{
		Timestamp:  time.Now(),
		StatusCode: 200,
		LatencyMs:  45.0,
	}

	b.ResetTimer()
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		eng.Record(rec)
	}
}
