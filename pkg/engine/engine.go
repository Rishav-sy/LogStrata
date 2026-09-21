package engine

import (
	"math"
	"sort"
	"sync"
	"time"

	"github.com/Rishav-sy/LogStrata/pkg/parser"
)

// SecondBucket holds aggregated metrics for a 1-second interval.
type SecondBucket struct {
	TimestampSecond int64
	Count           int
	Status2xx       int
	Status3xx       int
	Status4xx       int
	Status5xx       int
	Latencies       []float64
}

// MetricsSnapshot provides a point-in-time calculation across a rolling time window.
type MetricsSnapshot struct {
	WindowDurationSeconds int       `json:"window_duration_seconds"`
	Timestamp             time.Time `json:"timestamp"`
	TotalRequests         int       `json:"total_requests"`
	RPS                   float64   `json:"rps"`
	InstantaneousRPS      float64   `json:"instantaneous_rps"`
	Count2xx              int       `json:"count_2xx"`
	Count4xx              int       `json:"count_4xx"`
	Count5xx              int       `json:"count_5xx"`
	ErrorRate5xxPercent   float64   `json:"error_rate_5xx_percent"`
	ErrorRate4xxPercent   float64   `json:"error_rate_4xx_percent"`
	P50LatencyMs          float64   `json:"p50_latency_ms"`
	P90LatencyMs          float64   `json:"p90_latency_ms"`
	P95LatencyMs          float64   `json:"p95_latency_ms"`
	P99LatencyMs          float64   `json:"p99_latency_ms"`
}

// SlidingWindowEngine tracks transactions across a rolling circular buffer.
type SlidingWindowEngine struct {
	mu           sync.RWMutex
	bufferSize   int
	buckets      []*SecondBucket
	maxSamples   int
}

// NewSlidingWindowEngine creates a new rolling buffer engine (e.g. 60 or 120 seconds).
func NewSlidingWindowEngine(windowSeconds int) *SlidingWindowEngine {
	if windowSeconds <= 0 {
		windowSeconds = 60
	}
	return &SlidingWindowEngine{
		bufferSize: windowSeconds,
		buckets:    make([]*SecondBucket, windowSeconds),
		maxSamples: 1000, // sample reservoir per second for latency percentiles
	}
}

// Record processes an incoming LogRecord into the current second bucket.
func (e *SlidingWindowEngine) Record(rec *parser.LogRecord) {
	if rec == nil {
		return
	}

	sec := rec.Timestamp.Unix()
	idx := int(sec % int64(e.bufferSize))

	e.mu.Lock()
	defer e.mu.Unlock()

	b := e.buckets[idx]
	if b == nil || b.TimestampSecond != sec {
		b = &SecondBucket{
			TimestampSecond: sec,
			Latencies:       make([]float64, 0, 64),
		}
		e.buckets[idx] = b
	}

	b.Count++
	switch {
	case rec.StatusCode >= 200 && rec.StatusCode < 300:
		b.Status2xx++
	case rec.StatusCode >= 300 && rec.StatusCode < 400:
		b.Status3xx++
	case rec.StatusCode >= 400 && rec.StatusCode < 500:
		b.Status4xx++
	case rec.StatusCode >= 500:
		b.Status5xx++
	}

	if rec.LatencyMs > 0 && len(b.Latencies) < e.maxSamples {
		b.Latencies = append(b.Latencies, rec.LatencyMs)
	}
}

// GetSnapshot computes rolling window metrics for the specified trailing seconds.
func (e *SlidingWindowEngine) GetSnapshot(trailingSeconds int) MetricsSnapshot {
	e.mu.RLock()
	defer e.mu.RUnlock()

	nowSec := time.Now().Unix()
	if trailingSeconds <= 0 || trailingSeconds > e.bufferSize {
		trailingSeconds = e.bufferSize
	}

	snapshot := MetricsSnapshot{
		WindowDurationSeconds: trailingSeconds,
		Timestamp:             time.Now(),
	}

	var allLatencies []float64
	minSec := nowSec - int64(trailingSeconds)

	// Instantaneous RPS (last 1 second)
	lastSecIdx := int((nowSec - 1) % int64(e.bufferSize))
	if b := e.buckets[lastSecIdx]; b != nil && b.TimestampSecond == nowSec-1 {
		snapshot.InstantaneousRPS = float64(b.Count)
	}

	activeSecondsCount := 0

	for _, b := range e.buckets {
		if b == nil || b.TimestampSecond <= minSec || b.TimestampSecond > nowSec {
			continue
		}

		snapshot.TotalRequests += b.Count
		snapshot.Count2xx += b.Status2xx
		snapshot.Count4xx += b.Status4xx
		snapshot.Count5xx += b.Status5xx
		allLatencies = append(allLatencies, b.Latencies...)
		activeSecondsCount++
	}

	// Calculate RPS
	if trailingSeconds > 0 {
		snapshot.RPS = float64(snapshot.TotalRequests) / float64(trailingSeconds)
	}

	// Calculate Error Ratios
	if snapshot.TotalRequests > 0 {
		snapshot.ErrorRate5xxPercent = (float64(snapshot.Count5xx) / float64(snapshot.TotalRequests)) * 100.0
		snapshot.ErrorRate4xxPercent = (float64(snapshot.Count4xx) / float64(snapshot.TotalRequests)) * 100.0
	}

	// Calculate Latency Percentiles
	if len(allLatencies) > 0 {
		sort.Float64s(allLatencies)
		snapshot.P50LatencyMs = percentile(allLatencies, 50)
		snapshot.P90LatencyMs = percentile(allLatencies, 90)
		snapshot.P95LatencyMs = percentile(allLatencies, 95)
		snapshot.P99LatencyMs = percentile(allLatencies, 99)
	}

	return snapshot
}

func percentile(sortedVals []float64, p float64) float64 {
	if len(sortedVals) == 0 {
		return 0
	}
	if p <= 0 {
		return sortedVals[0]
	}
	if p >= 100 {
		return sortedVals[len(sortedVals)-1]
	}

	idx := (p / 100.0) * float64(len(sortedVals)-1)
	lower := int(math.Floor(idx))
	upper := int(math.Ceil(idx))

	if lower == upper {
		return sortedVals[lower]
	}

	weight := idx - float64(lower)
	return sortedVals[lower]*(1-weight) + sortedVals[upper]*weight
}
