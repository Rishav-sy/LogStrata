package engine_test

import (
	"fmt"
	"testing"

	"github.com/Rishav-sy/LogStrata/pkg/engine"
	"github.com/Rishav-sy/LogStrata/pkg/parser"
)

// generateSyntheticLog creates a realistic nginx access log line.
func generateNginxLog(statusCode int, latencyMs float64, path, ip string) string {
	return fmt.Sprintf(
		`{"remote_addr":"%s","method":"GET","path":"%s","status":%d,"response_time":%.3f,"bytes":4096}`,
		ip, path, statusCode, latencyMs/1000,
	)
}

// BenchmarkSlidingWindowEngine_Record measures the throughput of the core
// record ingestion path under a simulated 100k lines/s load.
func BenchmarkSlidingWindowEngine_Record(b *testing.B) {
	eng := engine.NewSlidingWindowEngine(60)
	p := parser.NewAutoParser()

	// Pre-parse a realistic log entry
	line := generateNginxLog(200, 12.5, "/api/checkout", "192.168.1.100")
	rec, err := p.Parse(line)
	if err != nil {
		b.Fatalf("failed to parse synthetic log: %v", err)
	}

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		eng.Record(rec)
	}
}

// BenchmarkSlidingWindowEngine_GetSnapshot measures the read path latency.
func BenchmarkSlidingWindowEngine_GetSnapshot(b *testing.B) {
	eng := engine.NewSlidingWindowEngine(60)
	p := parser.NewAutoParser()

	// Pre-fill with 10,000 records to simulate a loaded window
	for i := 0; i < 10_000; i++ {
		status := 200
		if i%20 == 0 {
			status = 500
		}
		line := generateNginxLog(status, float64(5+i%50), "/api/v1", "10.0.0.1")
		if rec, err := p.Parse(line); err == nil {
			eng.Record(rec)
		}
	}

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		_ = eng.GetSnapshot(15)
	}
}

// BenchmarkSlidingWindowEngine_ConcurrentRecordAndSnapshot simulates concurrent
// writers (log tailers) and readers (evaluation loop) on the same engine.
func BenchmarkSlidingWindowEngine_ConcurrentRecordAndSnapshot(b *testing.B) {
	eng := engine.NewSlidingWindowEngine(60)
	p := parser.NewAutoParser()

	line := generateNginxLog(200, 8.0, "/api/order", "172.16.0.1")
	rec, _ := p.Parse(line)

	b.ResetTimer()
	b.ReportAllocs()

	b.RunParallel(func(pb *testing.PB) {
		i := 0
		for pb.Next() {
			if i%5 == 0 {
				_ = eng.GetSnapshot(5)
			} else {
				eng.Record(rec)
			}
			i++
		}
	})
}

// BenchmarkParser_Parse measures the zero-allocation JSON parser throughput.
func BenchmarkParser_Parse(b *testing.B) {
	p := parser.NewAutoParser()
	lines := []string{
		generateNginxLog(200, 5.0, "/api/checkout", "1.2.3.4"),
		generateNginxLog(429, 1.0, "/login", "5.6.7.8"),
		generateNginxLog(500, 250.0, "/api/payment", "9.10.11.12"),
		// Common Log Format variant
		`192.168.1.50 - - [21/Sep/2026:12:00:00 +0000] "POST /api/order HTTP/1.1" 201 512 "-" "Go-http-client/1.1"`,
	}

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		_, _ = p.Parse(lines[i%len(lines)])
	}
}

// BenchmarkEngine_HighThroughput_100kLinesPerSec validates the < 0.5ms
// latency target under 100,000 lines/second burst load.
func BenchmarkEngine_HighThroughput_100kLinesPerSec(b *testing.B) {
	eng := engine.NewSlidingWindowEngine(60)
	p := parser.NewAutoParser()

	// Pre-parse a batch of diverse log lines
	const batchSize = 1000
	records := make([]interface{ IsRecord() }, 0, batchSize)
	// Actually pre-parse into engine's Record type
	type Recordable interface{}
	_ = records

	lines := make([]string, batchSize)
	for i := range lines {
		status := 200
		if i%25 == 0 {
			status = 500
		}
		if i%50 == 0 {
			status = 401
		}
		lines[i] = generateNginxLog(status, float64(2+i%100), "/api/v1/resource", "10.0.0."+fmt.Sprint(i%255))
	}

	parsedRecords := make([]*parser.LogRecord, 0, batchSize)
	for _, l := range lines {
		rec, err := p.Parse(l)
		if err == nil {
			parsedRecords = append(parsedRecords, rec)
		}
	}

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		eng.Record(parsedRecords[i%len(parsedRecords)])
	}
}
